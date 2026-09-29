// Metro → Stripe checkout contract (orchestrator-authored, 2026-09-28; hardened
// 2026-09-28 by A1v3-METRO-CHECKOUT-HARDENING per docs/metro/research/metro-checkout-security-review.md).
// Shared by the client (`src/metro/services/metroCheckoutService.ts`) and the server
// (`supabase/functions/create-metro-checkout`, `verify-metro-payment`, `metro-stripe-webhook`,
// all of which bundle `src/metro/checkout/**`).
// Pure types + constants only — no imports with side effects, no Deno/URL imports.
//
// Flow (v2 — no pre-payment DB row, fixes security-review finding F3): metro OrderFlow →
// invoke('create-metro-checkout') → server re-quotes from the metro price book, generates
// orderId = ORDER-METRO-<ts>-<rand> and writes EVERYTHING needed to build the order later into
// the Stripe Checkout Session's `metadata` (see METRO_CHECKOUT_METADATA_KEYS below) — no
// `orders` row is inserted yet, so an abandoned/never-completed checkout leaves zero DB trace
// and can never trigger process-abandoned-carts emails/SMS to an unverified address. → Stripe
// Checkout (manual capture, same as create-auth-hold) → /metro-order-confirmed, which calls
// verify-metro-payment directly with { sessionId, orderId }. verify-metro-payment (and,
// independently, the new metro-stripe-webhook for the tab-closed case) re-derives the order from
// the verified Stripe session's metadata and inserts the ONE `orders` row — idempotently, only
// once payment is confirmed. create-auth-hold and the live verify-payment function are NOT
// touched.

export const METRO_CHECKOUT_FUNCTION = 'create-metro-checkout';
/** No more CART- staging prefix — the order id is generated once, at checkout-session-creation
 * time, and is never renamed. Old CART-METRO- rows (if any exist from before this change shipped)
 * are not migrated; they age out via the existing abandoned-cart flow like any other cart. */
export const METRO_ORDER_ID_PREFIX = 'ORDER-METRO-';
/** Max allowed |client expectedTotal − server total| in dollars before PRICE_CHANGED. */
export const METRO_PRICE_TOLERANCE = 0.01;

// verify-metro-payment: metro is fully isolated from the live verify-payment function
// (which has a pre-existing, undeclared-`paymentStatus` bug on `main` — see
// docs/metro/research/verify-payment-paymentstatus-bug.md — and which the orchestrator
// decided NOT to touch, to avoid any regression risk to the live /cart→/checkout→
// /payment-success flow). create-metro-checkout's success_url now points at
// METRO_CONFIRMATION_PATH, a new client route (owned by A2v2) that calls
// METRO_VERIFY_FUNCTION directly with the Stripe session id + the ORDER-METRO- order id.
export const METRO_VERIFY_FUNCTION = 'verify-metro-payment';
export const METRO_CONFIRMATION_PATH = '/metro-order-confirmed';

// ─── Input caps (security-review F6/F7/F9) — enforced by serverQuote.ts's
// sanitizeCheckoutRequest/validateRequest, and mirrored as `maxLength` attributes on
// src/metro/components/order/DetailsStep.tsx's inputs so the browser gives the same feedback
// before the round trip. Values chosen: name/street/city are generous single-line address-book
// sizes; dropNotes/utm values match Stripe's own 500-char metadata value limit (utm values are
// capped tighter, at 200, since they're never meant to hold prose); state/zip match US formats
// exactly (no zip+4 — keeps the metadata value and the DB column consistent and simple). ───
export const METRO_INPUT_CAPS = {
  name: 100,
  email: 254,
  mobile: 20,
  street: 200,
  city: 100,
  state: 2,
  zip: 5,
  dropNotes: 500,
  utmValue: 200,
  maxUtmKeys: 10,
} as const;

/** Quantity cap — largest configured truck capacity across both metros today is 28 tons /
 * 20 cubic yards (Long Island's tri-axle); ×10 headroom would be 280. Rounded up to a flat 500
 * (units are tons or cubic yards depending on category) so the cap is easy to remember and state
 * to a customer, while still being far below anything that would make `planLoads`' truck-splitting
 * loop (src/metro/lib/pricing.ts) do meaningful work — closes security-review F6 (quantity-DoS). */
export const METRO_QUANTITY_MAX = 500;

/** Half-unit step, matching the client UI's own rounding (`roundToHalf` in useMetroOrder.ts) —
 * enforced server-side too so a bypassed/tampered client can't submit e.g. 7.3333 units
 * (security-review F9). */
export const METRO_QUANTITY_STEP = 0.5;

/** Allowlist of tracking/attribution keys accepted from the client's `utmData` object — exactly
 * 10, matching METRO_INPUT_CAPS.maxUtmKeys, so "every allowlisted key" and "the cap" are the same
 * number by construction. `user_agent` is deliberately NOT in this list: create-metro-checkout
 * captures the real `User-Agent` request header server-side instead of trusting a client-supplied
 * value for it (see create-metro-checkout/index.ts). */
export const ALLOWED_UTM_KEYS = [
  'gclid',
  'gbraid',
  'wbraid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'landing_page_url',
  'referrer',
] as const;

export type AllowedUtmKey = (typeof ALLOWED_UTM_KEYS)[number];

// ─── Stripe Checkout Session metadata — the entire order lives here from creation until a
// verified-payment conversion (verify-metro-payment / metro-stripe-webhook) turns it into an
// `orders` row. Stripe caps metadata at 50 keys, each key ≤40 chars, each value ≤500 chars — the
// list below is well under both (33 keys today, longest key `landing_page_url` at 17 chars,
// every value capped by METRO_INPUT_CAPS or by being a short enum/number). Every value is a
// string (Stripe metadata is flat string→string) — see conversion.ts's
// buildMetroCheckoutMetadata/parseMetroCheckoutMetadata for the (de)serialization. ───
export const METRO_CHECKOUT_METADATA_KEYS = [
  'source', // always 'metro-checkout' — what every reader (verify fn, webhook) filters on
  'orderId', // ORDER-METRO-<ts>-<rand>, generated once at session-creation time
  'metroSlug',
  'zip',
  'categorySlug',
  'variantSlug',
  'quantity', // stringified number
  'deliveryDate', // YYYY-MM-DD
  'zoneSlug', // echoed from the server-computed quote, for record-keeping/consistency checks
  'name',
  'mobile',
  'street',
  'city', // '' when absent (Stripe metadata can't hold null)
  'state',
  'dropNotes', // '' when absent, ≤500 chars
  'serverTotal', // authoritative server-computed total (dollars, stringified) at session creation
  'expectedTotal', // client-echoed total at session creation, informational only
  // create-auth-hold-compatible keys, unchanged shape from the original design:
  'userId',
  'userEmail',
  'isGuest',
  'depositOption',
  'fullOrderAmount',
  // utm/attribution — one metadata key per ALLOWED_UTM_KEYS entry, plus a server-captured UA:
  'gclid',
  'gbraid',
  'wbraid',
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'landing_page_url',
  'referrer',
  'user_agent', // captured from the request header server-side, not from utmData
] as const;

export interface MetroVerifyRequest {
  sessionId: string;
  orderId: string;
}

/** Display-ready fields for the /metro-order-confirmed page. */
export interface MetroConfirmedOrder {
  orderId: string;
  metroSlug: string;
  variantName: string;
  quantity: number;
  unit: 'ton' | 'yd';
  total: number;
  deliveryDate: string;
  deliveryStreet: string;
  deliveryCity?: string;
  deliveryState: string;
  deliveryZip: string;
  zoneName?: string;
  truckPlan?: string;
  customerEmail: string;
  /** Additive (G3, docs/metro/research/metro-checkout-rereview.md) — the paying customer's own
   * name/phone, fed to Google Ads Enhanced Conversions by metroPurchaseTracking.ts. Safe to
   * return here: this whole response is already gated behind knowing the order's Stripe
   * `session_id` (see verifyLogic.ts's validateSession), the same trust boundary that already
   * guards `customerEmail`/the delivery address above. */
  customerName?: string;
  customerPhone?: string;
}

export type MetroVerifyResponse =
  | {
      success: true;
      orderId: string;
      /** 'test' — Stripe TEST-mode checkout (staging origin; session.livemode === false), never a
       * real charge. See docs/metro/research/metro-checkout-server.md "Staging / test mode". */
      status: 'authorized' | 'paid' | 'test';
      alreadyProcessed: boolean;
      order: MetroConfirmedOrder;
    }
  | {
      success: false;
      status: 'unpaid' | 'invalid' | 'mismatch' | 'not_found' | 'error';
      error: string;
    };

export interface MetroCheckoutRequest {
  metroSlug: string;
  zip: string;
  categorySlug: string;
  variantSlug: string;
  /** In the category's sell unit (ton | yd). */
  quantity: number;
  /** YYYY-MM-DD; must be one of getDeliveryDayOptions(metro, now) on the server. */
  deliveryDate: string;
  contact: { name: string; email: string; mobile: string };
  address: { street: string; city?: string; state: string; zip: string };
  dropNotes?: string;
  /** Client-displayed total in dollars; server rejects with PRICE_CHANGED if it differs. */
  expectedTotal: number;
  utmData?: Record<string, string>;
  /** Path (must start with '/') to return to if the customer cancels in Stripe. */
  cancelPath?: string;
}

/** Server-authoritative quote echoed back to the client (dollars). */
export interface MetroServerQuote {
  metroSlug: string;
  zoneSlug: string;
  zoneName: string;
  categorySlug: string;
  variantSlug: string;
  variantName: string;
  unit: 'ton' | 'yd';
  quantity: number;
  deliveryDate: string;
  isSaturday: boolean;
  isRush: boolean;
  truckPlan: string;
  basePrice: number;
  saturdayFee: number;
  rushFee: number;
  total: number;
  pricePerUnit: number;
}

export interface MetroCheckoutSuccess {
  url: string;
  session_id: string;
  order_id: string;
  serverQuote: MetroServerQuote;
}

export type MetroCheckoutErrorCode =
  | 'INVALID_INPUT' // 400
  | 'PRICE_BOOK_UNCONFIRMED' // 403 — metro.priceBookConfirmed === false (unless server env override)
  | 'OUT_OF_AREA' // 422 — ZIP not in any zone of the metro
  | 'DATE_UNAVAILABLE' // 422 — deliveryDate not in the server's current day options
  | 'BELOW_MINIMUM' // 422
  | 'PRICE_CHANGED' // 409 — includes serverQuote
  | 'SERVER_ERROR'; // 500

export interface MetroCheckoutError {
  error: string;
  code: MetroCheckoutErrorCode;
  serverQuote?: MetroServerQuote;
}

export type MetroCheckoutResponse = MetroCheckoutSuccess | MetroCheckoutError;
