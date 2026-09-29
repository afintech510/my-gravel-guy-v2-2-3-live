// Stripe checkout path for metro orders (create-metro-checkout, see ../checkout/contract.ts).
// Only used once a metro's price book is confirmed (see isMetroCheckoutEnabled) — until
// then metroQuoteService.ts's quote-request flow keeps running unchanged.
//
// NOTE (2026-09-28 hardening pass): create-metro-checkout no longer inserts any `orders` row —
// the `order_id` this module stores (METRO_PENDING_CHECKOUT_KEY) is the final ORDER-METRO- id
// from the very first response; there is no more CART-METRO- staging id to rename later.
//
// Metro checkout is FULLY ISOLATED from the live /cart -> /checkout -> /payment-success ->
// verify-payment pipeline (orchestrator decision — that live path has a latent bug and its
// own client-side fallback-insert behavior; touching it risks regressions to real orders).
// create-metro-checkout's success_url points at /metro-order-confirmed, which calls the
// dedicated verify-metro-payment edge function instead of verify-payment, and this service
// deliberately does NOT write any of the live flow's localStorage keys
// ('checkout-order-backup' / 'checkout-in-progress' / 'checkout-order-id' — see
// src/pages/Checkout.tsx, src/utils/paymentUtils.ts) since those are read by
// PaymentSuccess.tsx and could otherwise interfere with a live order in flight in another
// tab. Instead, on a successful redirect this writes a single small metro-only record under
// METRO_PENDING_CHECKOUT_KEY — used only as a display fallback / GA4 value source by
// MetroOrderConfirmedPage before (or if) its verify-metro-payment call returns.
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { getStoredUTMParams } from '@/utils/analytics';
import {
  METRO_CHECKOUT_FUNCTION,
  type MetroCheckoutError,
  type MetroCheckoutErrorCode,
  type MetroCheckoutRequest,
  type MetroCheckoutResponse,
  type MetroCheckoutSuccess,
  type MetroServerQuote,
} from '../checkout/contract';
import type { Metro } from '../types';
import type { MetroOrderSubmission } from './metroQuoteService';

/** localStorage key for the metro-only pending-checkout record (see module doc above). */
export const METRO_PENDING_CHECKOUT_KEY = 'mgg-metro-pending-checkout';

export interface MetroPendingCheckout {
  orderId: string;
  serverQuote: MetroServerQuote;
  createdAt: number;
}

/** Reads back the pending-checkout record written on redirect, or null if missing/invalid
 * (never throws — a corrupt/missing record just means no display fallback is available). */
export function getMetroPendingCheckout(): MetroPendingCheckout | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(METRO_PENDING_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MetroPendingCheckout;
    if (!parsed || typeof parsed.orderId !== 'string' || !parsed.serverQuote) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Clears the pending-checkout record — called once MetroOrderConfirmedPage has a
 * successful verify-metro-payment response and no longer needs the fallback. */
export function clearMetroPendingCheckout(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(METRO_PENDING_CHECKOUT_KEY);
  } catch {
    // ignore (e.g. storage disabled) — nothing to clean up
  }
}

/**
 * Gate for the checkout path: requires BOTH a confirmed price book for this metro AND the
 * env flag. Both DFW and Long Island are unconfirmed today, so this is false in production
 * regardless of the flag — callers must keep running the existing quote-request path
 * (submitMetroOrderRequest) unchanged until a metro's price book is confirmed.
 */
export function isMetroCheckoutEnabled(metro: Metro): boolean {
  return metro.priceBookConfirmed === true && import.meta.env.VITE_METRO_CHECKOUT_ENABLED === 'true';
}

export type MetroCheckoutResult =
  | { kind: 'redirect'; url: string }
  | { kind: 'price_changed'; serverQuote: MetroServerQuote }
  /** Server declined/couldn't confirm checkout for a non-customer-facing reason (price
   * book flag, transient server error, network failure) — caller should transparently
   * fall back to submitMetroOrderRequest instead of surfacing this to the customer. */
  | { kind: 'fallback_quote'; reason: string }
  /** Customer-facing rejection (bad input, out of area, date unavailable, below minimum)
   * — caller should show this instead of silently falling back. */
  | { kind: 'error'; code: MetroCheckoutErrorCode; message: string };

type InvokeFn = (body: MetroCheckoutRequest) => Promise<{ data: MetroCheckoutResponse | null; error: unknown }>;

export interface StartMetroCheckoutDeps {
  /** Replaces supabase.functions.invoke — used by tests to avoid the real client. */
  invoke?: InvokeFn;
  /** Replaces getStoredUTMParams()-based UTM extraction. */
  getUtmData?: () => Record<string, string> | undefined;
  /** Replaces the localStorage write of the metro-only pending-checkout record — used by
   * tests to capture what would have been written without touching real localStorage. */
  storePendingCheckout?: (record: MetroPendingCheckout) => void;
  /** Path Stripe returns to on cancel; defaults to the current page. */
  cancelPath?: string;
}

const defaultStorePendingCheckout = (record: MetroPendingCheckout): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(METRO_PENDING_CHECKOUT_KEY, JSON.stringify(record));
  } catch {
    // ignore (e.g. storage disabled/full) — MetroOrderConfirmedPage still works from the
    // verify-metro-payment response alone; this record is only a display fallback.
  }
};

const defaultInvoke: InvokeFn = body =>
  supabase.functions.invoke<MetroCheckoutResponse>(METRO_CHECKOUT_FUNCTION, { body });

const defaultGetUtmData = (): Record<string, string> | undefined => {
  const stored = getStoredUTMParams() as Record<string, unknown>;
  const entries = Object.entries(stored).filter(
    (pair): pair is [string, string] => pair[0] !== 'captured_at' && typeof pair[1] === 'string' && pair[1].length > 0,
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

function buildRequest(
  submission: MetroOrderSubmission,
  utmData: Record<string, string> | undefined,
  cancelPath: string,
): MetroCheckoutRequest {
  const { metro, zip, category, variant, quantity, day, street, dropNotes, name, email, mobile, quote } = submission;
  return {
    metroSlug: metro.slug,
    zip,
    categorySlug: category.slug,
    variantSlug: variant.slug,
    quantity,
    deliveryDate: day.date,
    contact: { name, email, mobile },
    address: { street, state: metro.state, zip },
    dropNotes: dropNotes || undefined,
    expectedTotal: quote.total,
    utmData,
    cancelPath,
  };
}

function mapErrorBody(body: MetroCheckoutError): MetroCheckoutResult {
  switch (body.code) {
    case 'PRICE_CHANGED':
      return body.serverQuote
        ? { kind: 'price_changed', serverQuote: body.serverQuote }
        : { kind: 'fallback_quote', reason: 'PRICE_CHANGED_missing_serverQuote' };
    case 'PRICE_BOOK_UNCONFIRMED':
    case 'SERVER_ERROR':
      return { kind: 'fallback_quote', reason: body.code };
    case 'OUT_OF_AREA':
    case 'DATE_UNAVAILABLE':
    case 'BELOW_MINIMUM':
    case 'INVALID_INPUT':
      return { kind: 'error', code: body.code, message: body.error || body.code };
    default:
      return { kind: 'fallback_quote', reason: (body as { code?: string }).code || 'unknown_error_code' };
  }
}

/**
 * Attempts Stripe checkout for a metro order. Never throws — every failure mode maps to a
 * MetroCheckoutResult so the caller can decide whether to fall back to the quote-request
 * path (fallback_quote / network or server trouble) or show a customer-facing message
 * (error). On success, writes the metro-only pending-checkout record (see module doc above
 * — deliberately NOT the live /checkout flow's localStorage keys) and returns the Stripe
 * URL to redirect to.
 */
export async function startMetroCheckout(
  submission: MetroOrderSubmission,
  deps: StartMetroCheckoutDeps = {},
): Promise<MetroCheckoutResult> {
  const invoke = deps.invoke ?? defaultInvoke;
  const getUtmData = deps.getUtmData ?? defaultGetUtmData;
  const storePendingCheckout = deps.storePendingCheckout ?? defaultStorePendingCheckout;
  const cancelPath = deps.cancelPath ?? (typeof window !== 'undefined' ? window.location.pathname : `/${submission.metro.slug}`);

  const utmData = getUtmData();
  const request = buildRequest(submission, utmData, cancelPath);

  let data: MetroCheckoutResponse | null;
  let error: unknown;
  try {
    ({ data, error } = await invoke(request));
  } catch (err) {
    return { kind: 'fallback_quote', reason: err instanceof Error ? err.message : 'invoke_threw' };
  }

  if (error) {
    if (error instanceof FunctionsHttpError) {
      try {
        const body = (await error.context.json()) as MetroCheckoutError;
        return mapErrorBody(body);
      } catch {
        return { kind: 'fallback_quote', reason: 'unparsable_error_response' };
      }
    }
    const message = error instanceof Error ? error.message : 'invoke_error';
    return { kind: 'fallback_quote', reason: message };
  }

  if (!data) {
    return { kind: 'fallback_quote', reason: 'empty_response' };
  }

  if ('url' in data && data.url) {
    const success = data as MetroCheckoutSuccess;
    storePendingCheckout({ orderId: success.order_id, serverQuote: success.serverQuote, createdAt: Date.now() });
    return { kind: 'redirect', url: success.url };
  }

  return mapErrorBody(data as MetroCheckoutError);
}
