// Session <-> order binding checks for verify-payment-v2 (fixes F1: verify-payment today never
// cross-checks that the verified Stripe session/PaymentIntent actually belongs to the requested
// orderId, and never compares the Stripe-paid amount to the order's total — see
// docs/metro/research/metro-checkout-security-review.md's F1 finding, reused here for the legacy
// checkout path it originally described).
import { amountsMatch } from './pricing';
import type { CheckoutV2Metadata } from './contract';

export type SessionOrigin =
  | { kind: 'checkout-v2'; metadata: CheckoutV2Metadata }
  | { kind: 'quote-conversion'; quoteId: string }
  | { kind: 'unrecognized' };

/** verify-payment-v2 receives requests originating from three different, independently-created
 * Stripe sessions: (1) create-auth-hold-v2 (this agent's new function — full binding below), (2)
 * create-quote-checkout (existing, unmodified — metadata `{quote_id, type: "quote_conversion"}`;
 * bound separately in orderRecords.ts against the DB's own stored quote total, which IS a
 * reliable source of truth unlike cart pricing), (3) anything else, chiefly the landing page's
 * `create-payment` function, which is out of this agent's ownership and unmodified. Case (3)
 * cannot be bound at all — verify-payment-v2 documents this gap in live-checkout-v2.md rather
 * than silently mis-flagging every landing-page order as tampered. */
export const classifySessionOrigin = (
  metadata: Record<string, string | null | undefined> | null | undefined,
): SessionOrigin => {
  if (metadata?.source === 'checkout-v2') {
    // Caller is expected to have already run parseCheckoutV2Metadata and confirmed ok:true
    // before reaching here; this branch only classifies, it doesn't re-validate shape.
    return {
      kind: 'checkout-v2',
      metadata: {
        source: 'checkout-v2',
        orderId: metadata.orderId ?? '',
        expectedTotalCents: metadata.expectedTotalCents ?? '0',
        depositOption: metadata.depositOption === 'true' ? 'true' : 'false',
        priceCheck:
          metadata.priceCheck === 'ok' || metadata.priceCheck === 'mismatch' ? metadata.priceCheck : 'unverifiable',
        itemsHash: metadata.itemsHash ?? '',
        userId: metadata.userId ?? 'guest',
        userEmail: metadata.userEmail ?? '',
        isGuest: metadata.isGuest === 'false' ? 'false' : 'true',
      },
    };
  }
  if (metadata?.type === 'quote_conversion' && metadata.quote_id) {
    return { kind: 'quote-conversion', quoteId: metadata.quote_id };
  }
  return { kind: 'unrecognized' };
};

export interface BindingResult {
  ok: boolean;
  reason?: string;
}

/** Requested orderId (from the client's verify-payment-v2 call) must equal the orderId the
 * session was actually created for. Both QUOTE- and its ORDER- converted form are accepted since
 * PaymentSuccess.tsx sends whichever it has (quote_id param converts QUOTE- -> ORDER- client
 * side before calling verify-payment-v2 in some code paths — see PaymentSuccess.tsx's
 * `finalOrderId` derivation). */
export const checkOrderIdBinding = (sessionOrderId: string, requestedOrderId: string | undefined | null): BindingResult => {
  if (!requestedOrderId) {
    return { ok: false, reason: 'Request is missing orderId.' };
  }
  const normalize = (id: string) => id.trim().replace(/^QUOTE-/, 'ORDER-');
  if (normalize(sessionOrderId) !== normalize(requestedOrderId)) {
    return {
      ok: false,
      reason: `Session was created for orderId "${sessionOrderId}" but request asked to verify "${requestedOrderId}".`,
    };
  }
  return { ok: true };
};

export const checkAmountBinding = (
  actualAmountTotalCents: number | null | undefined,
  expectedTotalCents: number,
): BindingResult => {
  if (!amountsMatch(actualAmountTotalCents, expectedTotalCents)) {
    return {
      ok: false,
      reason: `Stripe amount_total (${actualAmountTotalCents ?? 'null'} cents) does not match expected total (${expectedTotalCents} cents).`,
    };
  }
  return { ok: true };
};

/** Combines both checks — first failure short-circuits (order id is checked first since an
 * amount mismatch is meaningless context if the order id itself is wrong). */
export const evaluateBinding = (
  sessionOrderId: string,
  requestedOrderId: string | undefined | null,
  actualAmountTotalCents: number | null | undefined,
  expectedTotalCents: number,
): BindingResult => {
  const orderCheck = checkOrderIdBinding(sessionOrderId, requestedOrderId);
  if (!orderCheck.ok) return orderCheck;
  return checkAmountBinding(actualAmountTotalCents, expectedTotalCents);
};
