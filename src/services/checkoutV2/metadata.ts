// Stripe Checkout Session metadata build/parse for the checkout-v2 path. create-auth-hold-v2
// writes this once, at session-creation time (server-authoritative — the client never sees or
// can edit it after that point, same trust model as src/metro/checkout/conversion.ts's
// buildMetroCheckoutMetadata/parseMetroCheckoutMetadata, which this mirrors). verify-payment-v2
// reads it back to bind the paid session to the order it was actually created for (fixes F1 —
// see docs/metro/research/metro-checkout-security-review.md).
import {
  CHECKOUT_V2_METADATA_KEYS,
  type CheckoutV2Metadata,
  type PriceCheckVerdict,
  type StripeItemInput,
} from './contract';

/** A short, non-cryptographic order-contents fingerprint — purely a diagnostic breadcrumb (does
 * this verified session's line items look like the same cart the client most recently held in
 * `backupData`?), never used as a security boundary by itself (amount + orderId binding are).
 * FNV-1a keeps this dependency-free and stable across the Deno bundle / browser / vitest. */
export const hashItems = (items: Pick<StripeItemInput, 'id' | 'price' | 'quantity'>[]): string => {
  const input = items
    .map((i) => `${i.id}:${i.price}:${i.quantity}`)
    .sort()
    .join('|');
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
};

export interface BuildMetadataInput {
  orderId: string;
  expectedTotalCents: number;
  depositOption: boolean;
  priceCheck: PriceCheckVerdict;
  items: Pick<StripeItemInput, 'id' | 'price' | 'quantity'>[];
  userId: string;
  userEmail: string;
  isGuest: boolean;
}

export const buildCheckoutV2Metadata = (input: BuildMetadataInput): CheckoutV2Metadata => ({
  source: 'checkout-v2',
  orderId: input.orderId,
  expectedTotalCents: String(input.expectedTotalCents),
  depositOption: input.depositOption ? 'true' : 'false',
  priceCheck: input.priceCheck,
  itemsHash: hashItems(input.items),
  userId: input.userId,
  userEmail: input.userEmail,
  isGuest: input.isGuest ? 'true' : 'false',
});

export type ParsedCheckoutV2Metadata =
  | { ok: true; data: CheckoutV2Metadata }
  | { ok: false; error: string };

/** Returns ok:false (never throws) whenever the metadata doesn't look like it was written by
 * create-auth-hold-v2 — this is the signal verify-payment-v2 uses to tell "a real checkout-v2
 * session" apart from sessions created by other, un-migrated entry points (create-quote-checkout,
 * the landing page's create-payment) so it can fall back to looser handling for those instead of
 * wrongly flagging every non-v2 session as tampered. See live-checkout-v2.md's "v1 -> v2 behavior
 * differences" section. */
export const parseCheckoutV2Metadata = (
  metadata: Record<string, string | null | undefined> | null | undefined,
): ParsedCheckoutV2Metadata => {
  if (!metadata || typeof metadata !== 'object') {
    return { ok: false, error: 'Missing Stripe session metadata.' };
  }
  if (metadata.source !== 'checkout-v2') {
    return { ok: false, error: 'Not a checkout-v2 session.' };
  }
  const orderId = metadata.orderId ?? '';
  if (!orderId) {
    return { ok: false, error: 'Metadata missing orderId.' };
  }
  const expectedTotalCentsRaw = metadata.expectedTotalCents ?? '';
  const expectedTotalCents = Number(expectedTotalCentsRaw);
  if (!Number.isFinite(expectedTotalCents) || expectedTotalCents < 0) {
    return { ok: false, error: 'Metadata has an invalid expectedTotalCents.' };
  }

  const priceCheckRaw = metadata.priceCheck;
  const priceCheck: PriceCheckVerdict =
    priceCheckRaw === 'ok' || priceCheckRaw === 'mismatch' || priceCheckRaw === 'unverifiable'
      ? priceCheckRaw
      : 'unverifiable';

  return {
    ok: true,
    data: {
      source: 'checkout-v2',
      orderId,
      expectedTotalCents: String(expectedTotalCents),
      depositOption: metadata.depositOption === 'true' ? 'true' : 'false',
      priceCheck,
      itemsHash: metadata.itemsHash ?? '',
      userId: metadata.userId ?? 'guest',
      userEmail: metadata.userEmail ?? '',
      isGuest: metadata.isGuest === 'false' ? 'false' : 'true',
    },
  };
};

export const metadataKeyCount = CHECKOUT_V2_METADATA_KEYS.length;
