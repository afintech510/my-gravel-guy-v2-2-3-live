// Pure decision logic for verify-metro-payment (and, for the parts it shares, metro-stripe-
// webhook): request validation, Stripe session validation, payment-status mapping, and
// response shaping. No I/O — the edge functions do the actual Stripe retrieve/webhook-verify and
// Supabase reads/writes (via supabase/functions/_shared/metro-conversion-runner.ts, which calls
// into this module + conversion.ts) and pass plain data structures in here. Bundled into
// supabase/functions/_shared/metro-checkout.bundle.js by
// scripts/metro/export-metro-checkout-bundle.mjs (same pattern as serverQuote.ts).
//
// v2 (security-review F3 fix): there is no more "CART- row" to look up and flip — no `orders`
// row exists until a payment is verified. See conversion.ts for the metadata parsing + order-row
// building + insert-race resolution this module's validation/status-mapping feeds into.
//
// Why metro has its own verify function instead of reusing the live verify-payment: see
// docs/metro/research/verify-payment-paymentstatus-bug.md — verify-payment's DB-write block
// throws on every request today (pre-existing, unrelated to metro) and the orchestrator decided
// not to touch that shared/live function, so metro's whole conversion path is isolated here.

import type { CategorySlug } from '../types';
import type { MetroConfirmedOrder, MetroVerifyRequest, MetroVerifyResponse } from './contract';
import { getMetro } from '../config';
import { getCategory, getVariant } from '../lib/pricing';
import type { Database } from '../../integrations/supabase/types';

export type MetroOrderRow = Database['public']['Tables']['orders']['Row'];

type MetroVerifyErrorStatus = Extract<MetroVerifyResponse, { success: false }>['status'];

// ─── Request validation ───

/** Only ORDER-METRO- ids exist now (no more CART- staging prefix — security-review F3 fix). A
 * pre-hardening client build could theoretically still be cached in a browser and echo back a
 * CART-METRO- id from a stale localStorage record; that's intentionally rejected as `invalid`
 * here (nothing dangerous happens — the row it referred to under the old design was itself only
 * ever a real order after conversion, so there's no data loss, just a "please retry" error). */
const METRO_ORDER_ID_RE = /^ORDER-METRO-(.+)$/;

export interface RequestValidationOk {
  ok: true;
  orderId: string;
}
export interface RequestValidationErr {
  ok: false;
  status: MetroVerifyErrorStatus;
  error: string;
}
export type RequestValidationResult = RequestValidationOk | RequestValidationErr;

export const validateVerifyRequest = (
  request: Partial<MetroVerifyRequest> | null | undefined,
): RequestValidationResult => {
  if (!request || typeof request !== 'object') {
    return { ok: false, status: 'invalid', error: 'Request body is required.' };
  }
  if (typeof request.sessionId !== 'string' || request.sessionId.trim().length === 0) {
    return { ok: false, status: 'invalid', error: 'sessionId is required.' };
  }
  if (typeof request.orderId !== 'string' || request.orderId.trim().length === 0) {
    return { ok: false, status: 'invalid', error: 'orderId is required.' };
  }
  const match = METRO_ORDER_ID_RE.exec(request.orderId.trim());
  if (!match) {
    return { ok: false, status: 'invalid', error: 'orderId must be a metro ORDER- id.' };
  }
  return { ok: true, orderId: request.orderId.trim() };
};

// ─── Stripe session validation ───

export interface MinimalStripeSession {
  metadata?: Record<string, string | null | undefined> | null;
  amount_total?: number | null;
  payment_intent?: { id?: string | null; status?: string | null } | string | null;
  created?: number | null;
  /** Stripe's own live/test signal for this session — undefined only for a caller that never set
   * it (e.g. a hand-built test fixture); staging/test-mode conversion handling
   * (metro-conversion-runner.ts) treats that as live, same as `livemode !== false`. */
  livemode?: boolean | null;
}

export interface SessionValidationOk {
  ok: true;
}
export interface SessionValidationErr {
  ok: false;
  status: MetroVerifyErrorStatus;
  error: string;
}
export type SessionValidationResult = SessionValidationOk | SessionValidationErr;

/** `not_found` is reserved for "this Stripe session doesn't exist / isn't a metro-checkout
 * session at all" — never for "no DB row yet" (there is no DB row until after this check passes
 * AND payment is confirmed, so that condition no longer exists in this design). */
export const validateSession = (
  session: MinimalStripeSession | null | undefined,
  expectedOrderId: string,
): SessionValidationResult => {
  if (!session || typeof session !== 'object') {
    return { ok: false, status: 'not_found', error: 'Stripe session not found.' };
  }
  if (session.metadata?.source !== 'metro-checkout') {
    return { ok: false, status: 'not_found', error: 'Stripe session is not a metro checkout.' };
  }
  if (session.metadata?.orderId !== expectedOrderId) {
    return { ok: false, status: 'invalid', error: 'Stripe session does not match the requested order.' };
  }
  return { ok: true };
};

export const extractPaymentIntentId = (session: MinimalStripeSession): string | null => {
  const pi = session.payment_intent;
  if (!pi) return null;
  if (typeof pi === 'string') return pi;
  return pi.id ?? null;
};

// ─── Payment status mapping — PaymentIntent status is the source of truth, never the
// Checkout Session's own `status`/`payment_status` (manual-capture sessions read 'complete'/
// 'paid' even while the charge is only authorized, not captured). ───

export type MetroPaymentStatus = 'authorized' | 'paid' | 'unpaid';

export const mapPaymentIntentStatus = (session: MinimalStripeSession): MetroPaymentStatus => {
  const pi = session.payment_intent;
  const status = typeof pi === 'string' ? undefined : pi?.status;
  if (status === 'requires_capture') return 'authorized';
  if (status === 'succeeded') return 'paid';
  return 'unpaid';
};

/** Maps an already-converted row's stored `status` column back to a display-relevant status for
 * the alreadyProcessed (page-reload / second caller) path, where we trust the DB over
 * re-deriving from Stripe. `review_required` is intentionally NOT mapped to 'authorized'/'paid'
 * — callers should treat it as a non-success (see buildAlreadyProcessedResponse below). */
export const rowStatusToPaymentStatus = (rowStatus: string | null | undefined): MetroPaymentStatus | null => {
  if (rowStatus === 'authorized') return 'authorized';
  if (rowStatus === 'paid') return 'paid';
  return null;
};

// ─── metro-stripe-webhook event filtering — pure so it's unit-testable without a real Stripe
// signature. The two event types handled cover both "customer completes checkout synchronously"
// (checkout.session.completed) and delayed-payment-method success (async_payment_succeeded,
// e.g. certain bank-debit methods) — everything else (session expired, payment_failed, etc.) is
// ignored. metadata.source is checked here too so a non-metro Checkout Session (the live
// create-auth-hold flow, or any other Stripe product on this same account) is never touched by
// this handler even if the account-wide webhook happens to be configured broadly. ───

const METRO_WEBHOOK_EVENT_TYPES = new Set(["checkout.session.completed", "checkout.session.async_payment_succeeded"]);

export interface MinimalStripeWebhookEvent {
  type: string;
  data: { object: { metadata?: Record<string, string | null | undefined> | null } };
}

export const isMetroCheckoutWebhookEvent = (event: MinimalStripeWebhookEvent | null | undefined): boolean => {
  if (!event || typeof event !== 'object') return false;
  if (!METRO_WEBHOOK_EVENT_TYPES.has(event.type)) return false;
  return event.data?.object?.metadata?.source === 'metro-checkout';
};

// ─── notes parsing — buildMetroOrderRowFromMetadata (conversion.ts) writes notes in a
// deterministic format: "Zone: <name> (<slug>). Truck plan: <plan>. [Saturday fee: $X.] [Rush
// fee: $X.] metro-checkout v2 (post-payment insert). [[REVIEW REQUIRED] ...]" Parsed back out
// here purely for display on the confirmation page. ───

const NOTES_ZONE_TRUCK_RE = /^Zone:\s*(.+?)\s*\([^)]*\)\.\s*Truck plan:\s*(.+?)\.\s*/;

export const parseZoneAndTruckPlanFromNotes = (
  notes: string | null | undefined,
): { zoneName?: string; truckPlan?: string } => {
  if (!notes) return {};
  const match = NOTES_ZONE_TRUCK_RE.exec(notes);
  if (!match) return {};
  return { zoneName: match[1], truckPlan: match[2] };
};

// ─── Response shaping ───

export const buildConfirmedOrder = (row: MetroOrderRow): MetroConfirmedOrder => {
  const metroSlug = row.market_slug ?? '';
  const [categorySlug, variantSlug] = (row.material_slug ?? '').split('/');
  const metro = metroSlug ? getMetro(metroSlug) : undefined;
  const category = metro && categorySlug ? getCategory(metro, categorySlug as CategorySlug) : undefined;
  const variant = category && variantSlug ? getVariant(category, variantSlug) : undefined;
  const { zoneName, truckPlan } = parseZoneAndTruckPlanFromNotes(row.notes);

  return {
    orderId: row.order_id,
    metroSlug,
    variantName: variant?.name ?? variantSlug ?? row.product_id,
    quantity: row.quantity ?? 0,
    unit: (category?.unit ?? (row.unit as MetroConfirmedOrder['unit']) ?? 'ton'),
    total: row.total_price,
    deliveryDate: row.delivery_date ?? '',
    deliveryStreet: row.delivery_street ?? '',
    deliveryCity: row.delivery_city ?? undefined,
    deliveryState: row.delivery_state ?? '',
    deliveryZip: row.delivery_zip ?? '',
    zoneName,
    truckPlan,
    customerEmail: row.delivery_email ?? row.billing_email ?? '',
    customerName: row.delivery_name ?? row.billing_name ?? undefined,
    customerPhone: row.delivery_phone ?? undefined,
  };
};

export const buildSuccessResponse = (
  row: MetroOrderRow,
  status: 'authorized' | 'paid' | 'test',
  alreadyProcessed: boolean,
): MetroVerifyResponse => ({
  success: true,
  orderId: row.order_id,
  status,
  alreadyProcessed,
  order: buildConfirmedOrder(row),
});

export const buildErrorResponse = (status: MetroVerifyErrorStatus, error: string): MetroVerifyResponse => ({
  success: false,
  status,
  error,
});

/** A `review_required` row (created because the metadata/price checks in evaluateAmountAndPrice
 * failed at conversion time) is never reported as a success to the customer — surfaced as the
 * existing `mismatch` status either on first conversion or on any later repeat call, so the
 * contract (MetroVerifyResponse) needs no new variant for it. */
export const buildReviewRequiredResponse = (): MetroVerifyResponse =>
  buildErrorResponse('mismatch', "The charged amount does not match this order's total. Please contact support.");

/** HTTP status per response shape — kept alongside the pure logic since it's a deterministic
 * function of the response, not a business decision the edge function needs to re-derive. */
export const httpStatusForResponse = (response: MetroVerifyResponse): number => {
  if (response.success) return 200;
  switch (response.status) {
    case 'invalid':
      return 400;
    case 'not_found':
      return 404;
    case 'mismatch':
      return 409;
    case 'unpaid':
      return 200; // a valid, expected state (customer hasn't finished paying yet) — not an error
    case 'error':
    default:
      return 500;
  }
};
