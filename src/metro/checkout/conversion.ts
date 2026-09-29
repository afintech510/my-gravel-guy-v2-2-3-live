// Pure logic for the "no DB row before payment" flow (security-review F3 fix). Everything here
// is I/O-free and shared, via bundleEntry.ts, between create-metro-checkout (which only *writes*
// metadata, via buildMetroCheckoutMetadata) and verify-metro-payment / metro-stripe-webhook
// (which *read* it back, via parseMetroCheckoutMetadata, and turn a verified-paid session into
// exactly one `orders` row, via buildMetroOrderRowFromMetadata + resolveInsertRace).
import {
  ALLOWED_UTM_KEYS,
  METRO_CHECKOUT_METADATA_KEYS,
  METRO_PRICE_TOLERANCE,
  type MetroCheckoutRequest,
  type MetroServerQuote,
} from './contract';
import type { MetroOrderInsertRow } from './serverQuote';

// ─── buildMetroCheckoutMetadata — the entire order, serialized into Stripe Checkout Session
// metadata (flat string→string, ≤50 keys, key ≤40 chars, value ≤500 chars — see contract.ts's
// METRO_CHECKOUT_METADATA_KEYS for the full accounting). Called once, by create-metro-checkout,
// with the ALREADY-SANITIZED request (sanitizeCheckoutRequest in serverQuote.ts) and the
// server-computed quote. ───

export interface MetroCheckoutMetadataExtra {
  userId: string;
  userEmail: string;
  isGuest: boolean;
  userAgent: string;
}

export const buildMetroCheckoutMetadata = (
  request: MetroCheckoutRequest,
  orderId: string,
  serverQuote: MetroServerQuote,
  extra: MetroCheckoutMetadataExtra,
): Record<string, string> => {
  const utm = request.utmData ?? {};
  const metadata: Record<string, string> = {
    source: 'metro-checkout',
    orderId,
    metroSlug: serverQuote.metroSlug,
    zip: request.zip,
    categorySlug: serverQuote.categorySlug,
    variantSlug: serverQuote.variantSlug,
    quantity: String(serverQuote.quantity),
    deliveryDate: serverQuote.deliveryDate,
    zoneSlug: serverQuote.zoneSlug,
    name: request.contact.name,
    mobile: request.contact.mobile,
    street: request.address.street,
    city: request.address.city ?? '',
    state: request.address.state,
    dropNotes: request.dropNotes ?? '',
    serverTotal: String(serverQuote.total),
    expectedTotal: String(request.expectedTotal),
    userId: extra.userId,
    userEmail: extra.userEmail,
    isGuest: String(extra.isGuest),
    depositOption: 'false',
    fullOrderAmount: String(serverQuote.total),
    user_agent: extra.userAgent,
  };
  for (const key of ALLOWED_UTM_KEYS) {
    metadata[key] = utm[key] ?? '';
  }
  return metadata;
};

// ─── parseMetroCheckoutMetadata — the inverse. Defensive: metadata was server-written at
// creation time (never client-editable — Stripe holds it, the client only ever sees the
// resulting checkout URL), but still validated for shape/presence here since a partial/corrupt
// metadata blob (a bug in a future change, a manually-created test session, etc.) must fail
// closed rather than produce a malformed `orders` row. ───

export interface ParsedMetroCheckout {
  orderId: string;
  request: MetroCheckoutRequest;
  zoneSlug: string;
  serverTotal: number;
  userId: string;
  userEmail: string;
  isGuest: boolean;
}

export type ParseMetadataResult = { ok: true; data: ParsedMetroCheckout } | { ok: false; error: string };

const str = (metadata: Record<string, string | null | undefined>, key: string): string => metadata[key] ?? '';

export const parseMetroCheckoutMetadata = (
  metadata: Record<string, string | null | undefined> | null | undefined,
): ParseMetadataResult => {
  if (!metadata || typeof metadata !== 'object') {
    return { ok: false, error: 'Missing Stripe session metadata.' };
  }
  if (metadata.source !== 'metro-checkout') {
    return { ok: false, error: 'Not a metro-checkout session.' };
  }
  const orderId = str(metadata, 'orderId');
  if (!orderId) return { ok: false, error: 'Metadata missing orderId.' };

  const quantity = Number(str(metadata, 'quantity'));
  const serverTotal = Number(str(metadata, 'serverTotal'));
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { ok: false, error: 'Metadata has an invalid quantity.' };
  }
  if (!Number.isFinite(serverTotal) || serverTotal < 0) {
    return { ok: false, error: 'Metadata has an invalid serverTotal.' };
  }

  const metroSlug = str(metadata, 'metroSlug');
  const zip = str(metadata, 'zip');
  const categorySlug = str(metadata, 'categorySlug');
  const variantSlug = str(metadata, 'variantSlug');
  const deliveryDate = str(metadata, 'deliveryDate');
  const name = str(metadata, 'name');
  const email = str(metadata, 'userEmail');
  const mobile = str(metadata, 'mobile');
  const street = str(metadata, 'street');
  const state = str(metadata, 'state');
  if (!metroSlug || !zip || !categorySlug || !variantSlug || !deliveryDate || !name || !street || !state) {
    return { ok: false, error: 'Metadata is missing one or more required order fields.' };
  }

  const city = str(metadata, 'city');
  const dropNotes = str(metadata, 'dropNotes');

  const utmData: Record<string, string> = {};
  for (const key of ALLOWED_UTM_KEYS) {
    const value = str(metadata, key);
    if (value) utmData[key] = value;
  }

  const request: MetroCheckoutRequest = {
    metroSlug,
    zip,
    categorySlug,
    variantSlug,
    quantity,
    deliveryDate,
    contact: { name, email, mobile },
    address: { street, city: city || undefined, state, zip },
    dropNotes: dropNotes || undefined,
    expectedTotal: serverTotal,
    utmData: Object.keys(utmData).length > 0 ? utmData : undefined,
  };

  return {
    ok: true,
    data: {
      orderId,
      request,
      zoneSlug: str(metadata, 'zoneSlug'),
      serverTotal,
      userId: str(metadata, 'userId'),
      userEmail: email,
      isGuest: str(metadata, 'isGuest') !== 'false',
    },
  };
};

/** Every key buildMetroCheckoutMetadata writes — exported for a metadata build/parse round-trip
 * test (contract.ts's METRO_CHECKOUT_METADATA_KEYS documents the same list for humans). */
export const metadataKeyCount = METRO_CHECKOUT_METADATA_KEYS.length;

// ─── buildMetroOrderRowFromMetadata — maps a verified-paid session's parsed metadata + the
// server-recomputed quote (at session-creation time; see verifyLogic.ts's evaluateConversion)
// into an `orders` insert row. Runs exactly once per successful conversion (verify-metro-payment
// or metro-stripe-webhook, whichever gets there first — see resolveInsertRace below for the
// concurrent-caller tie-break).
//
// product_id decision carried over unchanged from the original (pre-hardening) design: no FK on
// orders.product_id (confirmed by reading every migration + generated types.ts —
// `Relationships: []`); product_id = `metro:<metroSlug>:<categorySlug>:<variantSlug>`,
// material_slug = `<categorySlug>/<variantSlug>` (per-material dashboard grouping independent of
// metro), market_slug = metroSlug. ───

export interface BuildOrderRowOpts {
  orderId: string;
  serverQuote: MetroServerQuote;
  request: MetroCheckoutRequest;
  status: 'authorized' | 'paid' | 'review_required';
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  /** Set when status === 'review_required' — appended to notes, never sent to the customer. */
  reviewReason?: string;
}

export const buildMetroOrderRowFromMetadata = (opts: BuildOrderRowOpts): MetroOrderInsertRow => {
  const { orderId, serverQuote, request, status, stripeSessionId, stripePaymentIntentId, reviewReason } = opts;
  const utm = request.utmData ?? {};
  const notes = [
    `Zone: ${serverQuote.zoneName} (${serverQuote.zoneSlug}).`,
    `Truck plan: ${serverQuote.truckPlan}.`,
    serverQuote.saturdayFee > 0 ? `Saturday fee: $${serverQuote.saturdayFee.toFixed(2)}.` : null,
    serverQuote.rushFee > 0 ? `Rush fee: $${serverQuote.rushFee.toFixed(2)}.` : null,
    'metro-checkout v2 (post-payment insert).',
    reviewReason ? `[REVIEW REQUIRED] ${reviewReason}` : null,
  ]
    .filter((s): s is string => Boolean(s))
    .join(' ');

  return {
    order_id: orderId,
    status,
    product_id: `metro:${serverQuote.metroSlug}:${serverQuote.categorySlug}:${serverQuote.variantSlug}`,
    unit: serverQuote.unit,
    unit_price: serverQuote.pricePerUnit,
    base_price: serverQuote.basePrice,
    total_price: serverQuote.total,
    quantity: serverQuote.quantity,
    delivery_date: serverQuote.deliveryDate,
    delivery_street: request.address.street,
    delivery_city: request.address.city ?? null,
    delivery_state: request.address.state,
    delivery_zip: request.address.zip,
    delivery_name: request.contact.name,
    delivery_phone: request.contact.mobile,
    delivery_email: request.contact.email,
    delivery_instructions: request.dropNotes ?? null,
    notes,
    market_slug: serverQuote.metroSlug,
    material_slug: `${serverQuote.categorySlug}/${serverQuote.variantSlug}`,
    saturday_fee_amount: serverQuote.saturdayFee,
    expedite_fee_amount: serverQuote.rushFee,
    tags: ['metro', serverQuote.metroSlug],
    billing_name: request.contact.name,
    billing_email: request.contact.email,
    stripe_session_id: stripeSessionId,
    stripe_payment_intent_id: stripePaymentIntentId,
    gclid: utm.gclid ?? null,
    gbraid: utm.gbraid ?? null,
    wbraid: utm.wbraid ?? null,
    utm_source: utm.utm_source ?? null,
    utm_medium: utm.utm_medium ?? null,
    utm_campaign: utm.utm_campaign ?? null,
    utm_term: utm.utm_term ?? null,
    utm_content: utm.utm_content ?? null,
    landing_page_url: utm.landing_page_url ?? null,
    referrer: utm.referrer ?? null,
    user_agent: utm.user_agent ?? null,
  };
};

/** True for a Postgres unique-violation error (code '23505') — used to treat a concurrent
 * insert racing the optional partial unique index (see the migration under
 * supabase/migrations/**_metro_orders_unique_session.sql) as "someone else already converted
 * this session" instead of a hard failure. Accepts the loosely-typed error shape supabase-js
 * surfaces (PostgrestError | unknown) without requiring a Deno/Postgres type import here. */
export const isUniqueViolation = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505';

// ─── resolveInsertRace — decides, for a given order_id, which of possibly-several rows (inserted
// by verify-metro-payment and/or metro-stripe-webhook racing each other with no DB-level
// uniqueness guarantee unless the optional migration is applied) is the "winner" that should be
// kept and send notifications, vs. the "losers" that should be deleted.
//
// Tie-break: earliest `created_at`, falling back to the lowest `id` (string compare) if
// `created_at` values are identical or missing — `orders.id` is a random UUID in this schema
// (not a sortable/sequential id), so "keep the earliest id" from the original brief is
// implemented here as "keep the earliest created_at" instead, which is the meaningful
// chronological signal this schema actually has; the `id` compare is only a deterministic
// last-resort tie-break for the (extremely unlikely) same-millisecond case. Documented residual
// risk: this is a best-effort race resolution, not a substitute for the optional unique-index
// migration — without that index, a pathological interleaving could theoretically still leave
// two rows visible to a third reader between one caller's insert and its own re-select/cleanup
// pass. ───

export interface RaceRow {
  id: string;
  created_at: string | null;
}

export interface RaceResolution<T extends RaceRow> {
  winner: T;
  losers: T[];
  /** True when `myInsertedId` is the winner. */
  isWinner: boolean;
}

export const resolveInsertRace = <T extends RaceRow>(rows: T[], myInsertedId: string): RaceResolution<T> => {
  const sorted = [...rows].sort((a, b) => {
    const at = a.created_at ?? '';
    const bt = b.created_at ?? '';
    if (at !== bt) return at < bt ? -1 : 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
  const winner = sorted[0];
  const losers = sorted.slice(1);
  return { winner, losers, isWinner: winner.id === myInsertedId };
};

// ─── evaluateAmountAndPrice — the two-part check described in the orchestrator brief: (a) the
// Stripe session's amount_total must equal the metadata's serverTotal in cents, and (b) the price
// recomputed at the session's *creation* time (never "now" — a delivery date can go from
// available to DATE_UNAVAILABLE purely by the clock moving forward) for the same inputs must also
// equal serverTotal within METRO_PRICE_TOLERANCE. Both must pass for a normal conversion; either
// failing routes to 'review_required'. Pure — the caller supplies the recomputed total (from
// buildServerQuote, which lives in serverQuote.ts and needs `now`/metro-config, so isn't called
// from here) rather than this function computing it itself. ───

export interface AmountCheckResult {
  ok: boolean;
  reason?: string;
}

export const evaluateAmountAndPrice = (
  sessionAmountTotalCents: number | null | undefined,
  metadataServerTotal: number,
  recomputedTotal: number | null,
): AmountCheckResult => {
  const expectedCents = Math.round(metadataServerTotal * 100);
  if (typeof sessionAmountTotalCents !== 'number' || sessionAmountTotalCents !== expectedCents) {
    return {
      ok: false,
      reason: `amount_total (${sessionAmountTotalCents ?? 'null'} cents) does not match metadata.serverTotal (${expectedCents} cents).`,
    };
  }
  if (recomputedTotal === null) {
    return { ok: false, reason: 'Unable to recompute price at session-creation time (metro/zone/variant no longer resolvable).' };
  }
  if (Math.abs(recomputedTotal - metadataServerTotal) > METRO_PRICE_TOLERANCE) {
    return {
      ok: false,
      reason: `Recomputed price at session creation (${recomputedTotal}) does not match metadata.serverTotal (${metadataServerTotal}).`,
    };
  }
  return { ok: true };
};
