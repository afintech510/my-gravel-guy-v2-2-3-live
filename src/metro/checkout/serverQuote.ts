// Server-side re-quoting + validation for metro checkout. Pure, dependency-free-of-I/O TS —
// no Deno/Node/browser APIs, no fetch, no Supabase/Stripe imports. This file (plus its
// transitive src/metro/** imports) is what `scripts/metro/export-metro-checkout-bundle.mjs`
// bundles into `supabase/functions/_shared/metro-checkout.bundle.js` for the
// `create-metro-checkout` edge function (Deno can't import `@/`-aliased TS from src directly).
//
// Only relative imports are used throughout this module (matching the convention already
// established by scripts/metro/export-price-book.mjs's entry file) so the bundler needs no
// path-alias configuration. The one exception is a `import type` of the generated Supabase
// types for the `orders` insert shape — type-only imports are erased entirely by esbuild's
// TS transform, so they never affect the runtime bundle.

import type { MetroCheckoutErrorCode, MetroCheckoutRequest, MetroServerQuote } from './contract';
import {
  ALLOWED_UTM_KEYS,
  METRO_INPUT_CAPS,
  METRO_ORDER_ID_PREFIX,
  METRO_PRICE_TOLERANCE,
  METRO_QUANTITY_MAX,
  METRO_QUANTITY_STEP,
} from './contract';
import type { CategorySlug, LoadPlanEntry, SellUnit } from '../types';
import { getMetro } from '../config';
import { findZoneByZip, formatUnit, getCategory, getVariant, quote } from '../lib/pricing';
import { getDeliveryDayOptions } from '../lib/dates';
import type { Database } from '../../integrations/supabase/types';

export type MetroOrderInsertRow = Database['public']['Tables']['orders']['Insert'];

// ─── Result types ───

export interface MetroCheckoutOk {
  ok: true;
  quote: MetroServerQuote;
}

export interface MetroCheckoutErr {
  ok: false;
  code: MetroCheckoutErrorCode;
  error: string;
  status: number;
  serverQuote?: MetroServerQuote;
}

export type MetroCheckoutResult = MetroCheckoutOk | MetroCheckoutErr;

export interface ValidationOk {
  ok: true;
}

export type ValidationResult = ValidationOk | MetroCheckoutErr;

// ─── Sanitization + validateRequest — structural/shape checks only (no metro/pricing lookups).
// Hardens security-review findings F6 (unbounded quantity → DoS in planLoads), F7 (unbounded
// free-text fields → storage bloat / oversized emails), and F9 (unenforced quantity step),
// and — combined with emailTemplates.ts's escapeHtml at the point every field is finally
// rendered into an email — F4 (unescaped HTML injection into outbound emails). ───

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ZIP_RE = /^\d{5}$/;
const STATE_RE = /^[A-Za-z]{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// Digits plus the punctuation a US phone number is commonly typed with; deliberately permissive
// (not attempting full E.164 validation) but bounded by METRO_INPUT_CAPS.mobile.
const MOBILE_RE = /^[0-9()+\-.\s]{7,}$/;

/** Strips ASCII control characters (categories that can never legitimately appear in a name,
 * address line, or single-line field — header/log injection, terminal escapes, etc.).
 * `allowNewlines` keeps \n (but still strips \r and other control chars) for the one multi-line
 * field, dropNotes. */
const stripControlChars = (value: string, allowNewlines: boolean): string => {
  // eslint-disable-next-line no-control-regex
  const pattern = allowNewlines ? /[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/g : /[\x00-\x1F\x7F]/g;
  return value.replace(pattern, '');
};

const clean = (value: unknown, maxLen: number, allowNewlines = false): string => {
  if (typeof value !== 'string') return '';
  return stripControlChars(value.trim(), allowNewlines).slice(0, maxLen);
};

/** Filters+caps a client-supplied utmData object to ALLOWED_UTM_KEYS (contract.ts), trimming/
 * stripping/truncating every value to METRO_INPUT_CAPS.utmValue and capping the number of
 * accepted keys at METRO_INPUT_CAPS.maxUtmKeys (== ALLOWED_UTM_KEYS.length today, so in practice
 * every allowlisted key present is kept — the count cap is defense in depth against a future
 * larger allowlist, not something that currently drops data). Never throws; a non-object input
 * (or fully-empty result) returns {}. */
export const sanitizeUtmData = (utmData: unknown): Record<string, string> => {
  if (!utmData || typeof utmData !== 'object') return {};
  const result: Record<string, string> = {};
  for (const key of ALLOWED_UTM_KEYS) {
    if (Object.keys(result).length >= METRO_INPUT_CAPS.maxUtmKeys) break;
    const raw = (utmData as Record<string, unknown>)[key];
    if (typeof raw !== 'string') continue;
    const value = clean(raw, METRO_INPUT_CAPS.utmValue);
    if (value) result[key] = value;
  }
  return result;
};

/** Trims/strips-control-chars/truncates every free-text field on the request to
 * METRO_INPUT_CAPS, and filters utmData to the allowlist. Always returns a well-formed
 * MetroCheckoutRequest shape (never throws) so validateRequest can run its checks against
 * already-bounded strings — callers (buildServerQuote) run this FIRST, then validate the
 * result, then use the *sanitized* copy for every downstream lookup/DB write/metadata write. */
export const sanitizeCheckoutRequest = (request: MetroCheckoutRequest): MetroCheckoutRequest => {
  const r = (request ?? {}) as Partial<MetroCheckoutRequest>;
  const contact = r.contact ?? ({} as MetroCheckoutRequest['contact']);
  const address = r.address ?? ({} as MetroCheckoutRequest['address']);
  return {
    metroSlug: clean(r.metroSlug, 100),
    zip: clean(r.zip, METRO_INPUT_CAPS.zip),
    categorySlug: clean(r.categorySlug, 100),
    variantSlug: clean(r.variantSlug, 100),
    quantity: typeof r.quantity === 'number' ? r.quantity : NaN,
    deliveryDate: clean(r.deliveryDate, 20),
    contact: {
      name: clean(contact.name, METRO_INPUT_CAPS.name),
      email: clean(contact.email, METRO_INPUT_CAPS.email).toLowerCase(),
      mobile: clean(contact.mobile, METRO_INPUT_CAPS.mobile),
    },
    address: {
      street: clean(address.street, METRO_INPUT_CAPS.street),
      city: address.city !== undefined ? clean(address.city, METRO_INPUT_CAPS.city) : undefined,
      state: clean(address.state, METRO_INPUT_CAPS.state).toUpperCase(),
      zip: clean(address.zip, METRO_INPUT_CAPS.zip),
    },
    dropNotes: r.dropNotes !== undefined ? clean(r.dropNotes, METRO_INPUT_CAPS.dropNotes, true) : undefined,
    expectedTotal: typeof r.expectedTotal === 'number' ? r.expectedTotal : NaN,
    utmData: r.utmData !== undefined ? sanitizeUtmData(r.utmData) : undefined,
    cancelPath: r.cancelPath,
  };
};

const invalidInput = (error: string): MetroCheckoutErr => ({
  ok: false,
  code: 'INVALID_INPUT',
  error,
  status: 400,
});

/** Checks that `quantity` is a multiple of METRO_QUANTITY_STEP, tolerant of float error
 * (e.g. 1.4999999999999998 from repeated arithmetic). */
const isOnQuantityStep = (quantity: number): boolean => {
  const steps = quantity / METRO_QUANTITY_STEP;
  return Math.abs(steps - Math.round(steps)) < 1e-6;
};

/** Structural/shape validation — assumes the request has already been through
 * sanitizeCheckoutRequest (trimmed/capped/stripped); this function only checks presence, format,
 * and bounds. No metro/pricing lookups happen here. */
export const validateRequest = (request: MetroCheckoutRequest): ValidationResult => {
  if (!request || typeof request !== 'object') return invalidInput('Request body is required.');
  if (!isNonEmptyString(request.metroSlug)) return invalidInput('metroSlug is required.');
  if (!isNonEmptyString(request.zip) || !ZIP_RE.test(request.zip.trim())) {
    return invalidInput('A valid 5-digit zip is required.');
  }
  if (!isNonEmptyString(request.categorySlug)) return invalidInput('categorySlug is required.');
  if (!isNonEmptyString(request.variantSlug)) return invalidInput('variantSlug is required.');
  if (typeof request.quantity !== 'number' || !Number.isFinite(request.quantity) || request.quantity <= 0) {
    return invalidInput('quantity must be a positive number.');
  }
  if (request.quantity > METRO_QUANTITY_MAX) {
    return invalidInput(`quantity may not exceed ${METRO_QUANTITY_MAX}.`);
  }
  if (!isOnQuantityStep(request.quantity)) {
    return invalidInput(`quantity must be in increments of ${METRO_QUANTITY_STEP}.`);
  }
  if (!isNonEmptyString(request.deliveryDate) || !DATE_RE.test(request.deliveryDate.trim())) {
    return invalidInput('deliveryDate must be in YYYY-MM-DD format.');
  }
  if (!request.contact || !isNonEmptyString(request.contact.name)) {
    return invalidInput('contact.name is required.');
  }
  if (!request.contact || !isNonEmptyString(request.contact.email) || !EMAIL_RE.test(request.contact.email.trim())) {
    return invalidInput('A valid contact.email is required.');
  }
  if (!request.contact || !isNonEmptyString(request.contact.mobile) || !MOBILE_RE.test(request.contact.mobile.trim())) {
    return invalidInput('A valid contact.mobile is required.');
  }
  if (!request.address || !isNonEmptyString(request.address.street)) {
    return invalidInput('address.street is required.');
  }
  if (!request.address || !isNonEmptyString(request.address.state) || !STATE_RE.test(request.address.state.trim())) {
    return invalidInput('A valid 2-letter address.state is required.');
  }
  if (!request.address || !isNonEmptyString(request.address.zip) || !ZIP_RE.test(request.address.zip.trim())) {
    return invalidInput('A valid 5-digit address.zip is required.');
  }
  if (typeof request.expectedTotal !== 'number' || !Number.isFinite(request.expectedTotal) || request.expectedTotal < 0) {
    return invalidInput('expectedTotal must be a non-negative number.');
  }
  if (request.dropNotes !== undefined && typeof request.dropNotes !== 'string') {
    return invalidInput('dropNotes must be a string.');
  }
  if (request.utmData !== undefined && (typeof request.utmData !== 'object' || request.utmData === null)) {
    return invalidInput('utmData must be an object.');
  }
  if (request.cancelPath !== undefined) {
    if (
      typeof request.cancelPath !== 'string' ||
      !request.cancelPath.startsWith('/') ||
      request.cancelPath.startsWith('//')
    ) {
      return invalidInput("cancelPath must start with '/' and not '//'.");
    }
  }
  return { ok: true };
};

// ─── Truck plan label — human-readable summary of QuoteResult.loads for the orders.notes column ───

export const buildTruckPlanLabel = (loads: LoadPlanEntry[], unit: SellUnit): string =>
  loads.map(l => `${l.quantity} ${formatUnit(unit, l.quantity)} (${l.truck.name})`).join(' + ');

// ─── buildServerQuote — the authoritative re-quote. Never trusts client-supplied price,
// saturday/rush flags, or zone; derives everything from metroSlug/zip/deliveryDate/quantity. ───

export interface BuildServerQuoteOpts {
  /** METRO_CHECKOUT_ALLOW_UNCONFIRMED === 'true' — owner staging override, default false. */
  allowUnconfirmed: boolean;
}

export const buildServerQuote = (
  rawRequest: MetroCheckoutRequest,
  now: Date,
  opts: BuildServerQuoteOpts,
): MetroCheckoutResult => {
  // Sanitize FIRST (trim/strip-control-chars/cap-length/filter-utm), then validate the cleaned
  // copy, then use that same cleaned copy for every lookup below — never the raw request again.
  const request = sanitizeCheckoutRequest(rawRequest);
  const validation = validateRequest(request);
  if (validation.ok === false) return validation;

  const metro = getMetro(request.metroSlug);
  if (!metro) {
    return invalidInput(`Unknown metro: ${request.metroSlug}`);
  }

  if (metro.priceBookConfirmed === false && !opts.allowUnconfirmed) {
    return {
      ok: false,
      code: 'PRICE_BOOK_UNCONFIRMED',
      error: `Pricing for ${metro.name} has not been confirmed yet — checkout is not available.`,
      status: 403,
    };
  }

  const zone = findZoneByZip(metro, request.zip);
  if (!zone) {
    return {
      ok: false,
      code: 'OUT_OF_AREA',
      error: `ZIP ${request.zip} is outside the ${metro.name} delivery area.`,
      status: 422,
    };
  }

  const category = getCategory(metro, request.categorySlug as CategorySlug);
  const variant = category && getVariant(category, request.variantSlug);
  if (!category || !variant) {
    return invalidInput(`Unknown material: ${request.categorySlug}/${request.variantSlug}`);
  }

  const dayOptions = getDeliveryDayOptions(metro, now);
  const day = dayOptions.find(d => d.date === request.deliveryDate);
  if (!day) {
    return {
      ok: false,
      code: 'DATE_UNAVAILABLE',
      error: `${request.deliveryDate} is not an available delivery date for ${metro.name}.`,
      status: 422,
    };
  }

  const result = quote({
    metro,
    categorySlug: category.slug,
    variantSlug: variant.slug,
    quantity: request.quantity,
    zoneSlug: zone.slug,
    saturday: day.isSaturday,
    speed: day.isRush ? 'rush' : 'standard',
  });

  if (!result) {
    return invalidInput('Unable to calculate a price for this selection.');
  }

  const serverQuote: MetroServerQuote = {
    metroSlug: metro.slug,
    zoneSlug: zone.slug,
    zoneName: zone.name,
    categorySlug: category.slug,
    variantSlug: variant.slug,
    variantName: variant.name,
    unit: result.unit,
    quantity: result.quantity,
    deliveryDate: day.date,
    isSaturday: day.isSaturday,
    isRush: day.isRush,
    truckPlan: buildTruckPlanLabel(result.loads, result.unit),
    basePrice: result.basePrice,
    saturdayFee: result.saturdayFee,
    rushFee: result.rushFee,
    total: result.total,
    pricePerUnit: result.pricePerUnit,
  };

  if (result.belowMinimum) {
    return {
      ok: false,
      code: 'BELOW_MINIMUM',
      error: `The minimum order for this zone is ${result.minUnits} ${formatUnit(result.unit, result.minUnits)}.`,
      status: 422,
      serverQuote,
    };
  }

  if (Math.abs(request.expectedTotal - serverQuote.total) > METRO_PRICE_TOLERANCE) {
    return {
      ok: false,
      code: 'PRICE_CHANGED',
      error: 'The price for this order has changed. Please review the updated total.',
      status: 409,
      serverQuote,
    };
  }

  return { ok: true, quote: serverQuote };
};

// ─── Order ID generation — ORDER-METRO-<ts>-<rand>, per contract.ts's METRO_ORDER_ID_PREFIX.
// Generated ONCE, at checkout-session-creation time, and never renamed — there is no more
// CART- staging prefix (security-review F3 fix: no `orders` row exists until payment is
// verified, so there is nothing to rename). ───

export const generateMetroOrderId = (now: Date, random: () => number = Math.random): string => {
  const rand = random().toString(36).slice(2, 8).padEnd(6, '0');
  return `${METRO_ORDER_ID_PREFIX}${now.getTime()}-${rand}`;
};

// Note: the `orders` insert-row builder (product_id/material_slug conventions, notes format,
// etc.) now lives in conversion.ts as buildMetroOrderRowFromMetadata — it only ever runs at
// verified-payment time (verify-metro-payment / metro-stripe-webhook), never at checkout-session
// creation, since no DB row exists before payment (security-review F3 fix). See conversion.ts
// for the product_id/material_slug design rationale (unchanged from the original design here).

// ─── Cents math (security-review F8) — Stripe line items and `orders.total_price` used to be
// computed two different ways (each line item independently `Math.round`ed to cents; the DB
// total was a separate float sum), which could disagree by ±$0.01 in rare cases. Both now derive
// from the SAME integer-cents arithmetic: round each fee to cents, then reconcile any rounding
// remainder onto the base-price line (which always exists) so the three Stripe line items sum to
// *exactly* `amount_total`. ───

export const centsFromDollars = (dollars: number): number => Math.round(dollars * 100);

export interface MetroLineItemCents {
  basePriceCents: number;
  saturdayFeeCents: number;
  rushFeeCents: number;
  totalCents: number;
}

export const buildLineItemCents = (quote: MetroServerQuote): MetroLineItemCents => {
  const totalCents = centsFromDollars(quote.total);
  const saturdayFeeCents = quote.saturdayFee > 0 ? centsFromDollars(quote.saturdayFee) : 0;
  const rushFeeCents = quote.rushFee > 0 ? centsFromDollars(quote.rushFee) : 0;
  // Reconcile any rounding drift (should be 0 in the overwhelming majority of cases) onto the
  // base-price line, which is never zero/omitted, so the sum is always exact.
  const basePriceCents = totalCents - saturdayFeeCents - rushFeeCents;
  return { basePriceCents, saturdayFeeCents, rushFeeCents, totalCents };
};

// ─── Origin allowlist — used to build Stripe success_url/cancel_url safely (never trust the
// request Origin header blindly: that would be an open redirect via Stripe's redirect flow). ───

export const METRO_CHECKOUT_DEFAULT_ORIGIN = 'https://mygravelguy.com';

export const METRO_CHECKOUT_ALLOWED_ORIGINS = [
  'https://mygravelguy.com',
  'https://www.mygravelguy.com',
  'http://localhost:8080',
];

/**
 * Resolves the request's Origin header against an allowlist (the hardcoded production/dev
 * origins plus any comma-separated extras from METRO_CHECKOUT_EXTRA_ORIGINS). Falls back to
 * METRO_CHECKOUT_DEFAULT_ORIGIN when the header is missing or not allowlisted.
 */
export const resolveMetroCheckoutOrigin = (
  originHeader: string | null | undefined,
  extraOriginsEnv: string | null | undefined,
): string => {
  const extra = (extraOriginsEnv ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  const allowed = new Set([...METRO_CHECKOUT_ALLOWED_ORIGINS, ...extra]);
  if (originHeader && allowed.has(originHeader)) return originHeader;
  return METRO_CHECKOUT_DEFAULT_ORIGIN;
};

// Re-exported so the edge function (which only imports from the bundle, never from
// src/metro/checkout/contract.ts directly — Deno can't resolve that path) has everything it
// needs from a single module.
export { METRO_ORDER_ID_PREFIX, METRO_PRICE_TOLERANCE };
export type { MetroCheckoutErrorCode, MetroCheckoutRequest, MetroServerQuote };
