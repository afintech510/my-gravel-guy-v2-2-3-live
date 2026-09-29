// Shared types for the checkout-v2 safe-rollout path (S1-LIVE-CHECKOUT-FIX).
//
// Everything in src/services/checkoutV2/** is pure (no Deno imports, no supabase-js client
// creation, no `fetch`) so it can be unit-tested with vitest AND bundled for Deno via
// scripts/checkout/export-checkout-v2-bundle.mjs (same pattern as src/metro/checkout/**, see
// scripts/metro/export-metro-checkout-bundle.mjs). The edge functions
// (supabase/functions/create-auth-hold-v2, supabase/functions/verify-payment-v2) do the actual
// Stripe/Supabase I/O and call into this logic with plain data.
//
// Background: docs/metro/research/verify-payment-paymentstatus-bug.md (F2 — `paymentStatus` is
// referenced but never declared in verify-payment/index.ts, so its DB-write always throws) and
// docs/metro/research/metro-checkout-security-review.md (F1 — verify-payment never binds the
// verified Stripe session to the requested orderId or checks the paid amount, so a cheap real
// payment can be replayed against a different, more expensive order). verify-payment and
// create-auth-hold are intentionally left byte-identical; this whole module plus the *-v2 edge
// functions are the fix, opt-in via src/services/checkoutFunctions.ts.

export interface StripeItemInput {
  id: string | number;
  name: string;
  description?: string;
  price: number; // dollars, per unit
  quantity: number;
  image?: string;
  metadata?: Record<string, string | undefined>;
}

export interface CreateAuthHoldV2Request {
  items: StripeItemInput[];
  orderId?: string;
  depositOption?: boolean;
  cancelUrl?: string;
}

export type PriceCheckVerdict = 'ok' | 'mismatch' | 'unverifiable';

/** One item's canonical DB price, as looked up by create-auth-hold-v2 (products.id -> price). */
export interface ProductPriceLookup {
  id: string;
  price: number | null; // null when the product id wasn't found in the DB
}

export interface ItemPriceEvaluation {
  id: string;
  submittedPrice: number;
  dbPrice: number | null;
  verdict: PriceCheckVerdict;
  reason: string;
}

export interface PriceEvaluationResult {
  verdict: PriceCheckVerdict;
  items: ItemPriceEvaluation[];
}

/** Everything create-auth-hold-v2 needs to write into Stripe Checkout Session metadata so
 * verify-payment-v2 can bind the paid session back to the order it was created for (fixes F1)
 * without trusting anything the client resubmits at verification time. */
export interface CheckoutV2Metadata {
  source: 'checkout-v2';
  orderId: string;
  expectedTotalCents: string;
  depositOption: 'true' | 'false';
  priceCheck: PriceCheckVerdict;
  itemsHash: string;
  userId: string;
  userEmail: string;
  isGuest: 'true' | 'false';
}

export const CHECKOUT_V2_METADATA_KEYS: (keyof CheckoutV2Metadata)[] = [
  'source',
  'orderId',
  'expectedTotalCents',
  'depositOption',
  'priceCheck',
  'itemsHash',
  'userId',
  'userEmail',
  'isGuest',
];

/** Amount-binding tolerance in cents — covers only genuine floating point noise, never a real
 * price difference (a single cent of drift between two independent dollar->cents roundings). */
export const AMOUNT_TOLERANCE_CENTS = 1;

/** An item's submitted per-unit price must be at least this fraction of the DB's canonical
 * products.price to be accepted. See pricing.ts's module doc for the full rationale — in short,
 * legitimate discounts observed in this codebase (src/components/cart/CouponCode.tsx) top out
 * at 10%, so 0.5 leaves generous headroom for coupons plus any zip-based surcharge/discount this
 * agent could not find a server-reproducible source of truth for, while still catching the named
 * threat (a tampered client submitting a near-zero price for an expensive order). */
export const PRICE_FLOOR_RATIO = 0.5;

export interface BackupCustomerInfo {
  email?: string;
  name?: string;
}

export interface BackupCouponInfo {
  code: string;
  discount: number;
  applied: boolean;
}

export interface BackupUtmData {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landing_page_url?: string;
  referrer?: string;
  user_agent?: string;
}

/** Mirrors src/utils/paymentUtils.ts's OrderItemData / CheckoutBackup shape — the localStorage
 * "checkout-order-backup" blob the client sends verify-payment(-v2) as `backupData`. */
export interface BackupItem {
  id: string | number;
  name?: string;
  price: number;
  quantity: number;
  tons?: number;
  deliveryDate?: string | Date;
  deliveryAddress?: { street?: string; city?: string; state?: string; zip?: string };
  contactInfo?: { name?: string; email?: string; phone?: string };
  deliveryTimePreference?: string;
  deliveryInstructions?: string;
  total_price?: number;
}

export interface CheckoutBackupV2 {
  orderId: string;
  items: BackupItem[];
  total?: number;
  customerInfo?: BackupCustomerInfo;
  couponInfo?: BackupCouponInfo | null;
  depositOption?: boolean;
  utmData?: BackupUtmData | null;
}

export type OrderStatus =
  | 'pending'
  | 'authorized'
  | 'paid'
  | 'processed'
  | 'Deposit Paid'
  | 'review_required';

export interface VerificationInfo {
  paymentVerified: boolean;
  isAuthorized: boolean;
  usedFallback: boolean;
}

/** One row shaped for `orders` Insert — a subset of the generated Database['public']['Tables']
 * ['orders']['Insert'] type (kept local/untyped-against-Database here so this module has zero
 * Deno/supabase-js import surface; the edge function's caller is responsible for the DB write
 * itself and can widen this to the full Insert type there). */
export interface OrderInsertRecord {
  order_id: string;
  stripe_payment_intent_id: string | null;
  stripe_session_id: string | null;
  product_id: string;
  unit: string;
  unit_price: number;
  total_price: number;
  quantity: number;
  status: string;
  delivery_date: string | null;
  delivery_street: string | null;
  delivery_city: string | null;
  delivery_state: string | null;
  delivery_zip: string | null;
  delivery_name: string | null;
  delivery_phone: string | null;
  delivery_email: string | null;
  delivery_time_preference: string | null;
  delivery_instructions: string | null;
  billing_name: string | null;
  billing_email: string | null;
  coupon: string | null;
  is_deposit_payment: boolean;
  deposit_amount: number | null;
  balance_due: number | null;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  landing_page_url: string | null;
  referrer: string | null;
  user_agent: string | null;
}
