// Shared I/O orchestration for turning a verified-paid metro Stripe Checkout Session into
// exactly one `orders` row — used by BOTH verify-metro-payment (called from the client's
// /metro-order-confirmed page) and metro-stripe-webhook (called by Stripe itself on
// checkout.session.completed / checkout.session.async_payment_succeeded, so the order still
// converts even if the customer closes the tab before the confirmation page's own call
// completes). Hand-written Deno TS (not bundled from src/ — this file talks directly to the
// Supabase client, which is Deno/esm.sh-specific), but every actual DECISION (session
// validation, payment-status mapping, metadata parsing, order-row shape, insert-race tie-break,
// email HTML) is pure logic imported from ./metro-checkout.bundle.js
// (scripts/metro/export-metro-checkout-bundle.mjs, bundled from src/metro/checkout/**) — this
// file is only the glue: Supabase reads/writes/deletes and the two `send-email` invokes.
//
// Not in the file-ownership list by exact name (only metro-checkout.bundle.js is named there),
// but it's essential shared infrastructure between the three edge functions
// (create-metro-checkout, verify-metro-payment, metro-stripe-webhook) this agent owns, so it
// lives alongside them under supabase/functions/_shared/.
//
// Also exports sendMetroConversionErrorAlert (G1, docs/metro/research/metro-checkout-rereview.md)
// — an internal owner-alert email for a genuine `orders` insert failure after a verified payment
// (as opposed to the expected `review_required`/`already_processed` outcomes). See that
// function's own doc comment below for the dedupe decision (only metro-stripe-webhook calls it).

// @deno-types="./metro-checkout.bundle.d.ts"
import {
  buildConfirmedOrder,
  buildCustomerConfirmationHtml,
  buildInternalNotificationHtml,
  buildMetroOrderRowFromMetadata,
  buildOrderInsertFailedInternalHtml,
  buildReviewRequiredInternalHtml,
  buildServerQuote,
  evaluateAmountAndPrice,
  extractPaymentIntentId,
  isUniqueViolation,
  mapPaymentIntentStatus,
  parseMetroCheckoutMetadata,
  resolveInsertRace,
  validateSession,
  type MetroOrderEmailData,
  type MetroOrderErrorAlertData,
  type MetroServerQuote,
  type MinimalStripeSession,
  type ParsedMetroCheckout,
} from "./metro-checkout.bundle.js";

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;
// deno-lint-ignore no-explicit-any
type MetroOrderRow = any;

export interface ConvertibleSession extends MinimalStripeSession {
  id: string;
}

export type ConversionOutcome =
  | { kind: "unpaid" }
  | { kind: "session_invalid"; status: "not_found" | "invalid"; message: string }
  | { kind: "metadata_invalid"; message: string }
  | { kind: "converted"; row: MetroOrderRow; paymentStatus: "authorized" | "paid" | "test"; alreadyProcessed: false; isTestMode: boolean }
  | { kind: "already_processed"; row: MetroOrderRow; alreadyProcessed: true }
  // isTestMode is only meaningful (and only ever read, by sendMetroConversionNotifications) when
  // alreadyProcessed is false — the three alreadyProcessed:true construction sites below (an
  // existing row found via the fast idempotency check, or either side of the insert-race
  // tie-break) never send notifications, so they omit it.
  | { kind: "review_required"; row: MetroOrderRow; alreadyProcessed: boolean; reason: string; isTestMode?: boolean }
  | { kind: "error"; message: string };

/** A quote-shaped fallback used only in the extremely unlikely case where the metro/category/
 * variant/zip recorded in metadata can no longer be resolved against the current price-book
 * config at all (e.g. a category was removed between checkout and payment) — lets the paid order
 * still be recorded (as review_required) instead of silently losing a real payment. */
function fallbackQuoteFromMetadata(parsed: ParsedMetroCheckout): MetroServerQuote {
  const { request, serverTotal, zoneSlug } = parsed;
  return {
    metroSlug: request.metroSlug,
    zoneSlug: zoneSlug || "unknown",
    zoneName: "Unknown (see notes)",
    categorySlug: request.categorySlug,
    variantSlug: request.variantSlug,
    variantName: request.variantSlug,
    unit: "ton",
    quantity: request.quantity,
    deliveryDate: request.deliveryDate,
    isSaturday: false,
    isRush: false,
    truckPlan: "Unknown — could not be resolved at conversion time",
    basePrice: serverTotal,
    saturdayFee: 0,
    rushFee: 0,
    total: serverTotal,
    pricePerUnit: request.quantity > 0 ? serverTotal / request.quantity : serverTotal,
  };
}

function toEmailData(row: MetroOrderRow): MetroOrderEmailData {
  return {
    orderId: row.order_id,
    customerName: row.delivery_name || row.billing_name || "Valued Customer",
    customerEmail: row.delivery_email || row.billing_email || "",
    variantName: buildConfirmedOrder(row).variantName,
    quantity: row.quantity ?? 0,
    unit: row.unit,
    totalAmount: row.total_price,
    deliveryDate: row.delivery_date,
    deliveryStreet: row.delivery_street,
    deliveryCity: row.delivery_city,
    deliveryState: row.delivery_state,
    deliveryZip: row.delivery_zip,
  };
}

/**
 * Converts a verified Stripe Checkout Session into exactly one `orders` row, idempotently.
 * Never throws for expected/business outcomes (unpaid, mismatch, already processed) — only for
 * genuinely unexpected Supabase errors, which callers should catch and log.
 */
export async function convertMetroSession(
  supabase: SupabaseClient,
  session: ConvertibleSession,
  expectedOrderId: string,
  opts: { allowUnconfirmed: boolean; isTestMode?: boolean },
): Promise<ConversionOutcome> {
  const isTestMode = opts.isTestMode === true;
  const sessionValidation = validateSession(session, expectedOrderId);
  if (!sessionValidation.ok) {
    return { kind: "session_invalid", status: sessionValidation.status as "not_found" | "invalid", message: sessionValidation.error };
  }

  const paymentStatus = mapPaymentIntentStatus(session);
  if (paymentStatus === "unpaid") {
    return { kind: "unpaid" };
  }
  const paymentIntentId = extractPaymentIntentId(session);

  // ─── Fast idempotency path: if ANY row already exists for this order_id, we're done — no
  // recompute, no insert, no notifications (whether this is a page reload, a retry, or the
  // webhook arriving after the page already converted it, or vice versa). ───
  const { data: existingRows, error: existingError } = await supabase
    .from("orders")
    .select("*")
    .eq("order_id", expectedOrderId);
  if (existingError) {
    return { kind: "error", message: `Failed to look up existing order: ${existingError.message ?? existingError}` };
  }
  if (existingRows && existingRows.length > 0) {
    const winner = existingRows.length === 1 ? existingRows[0] : resolveInsertRace(existingRows as { id: string; created_at: string | null }[], "").winner;
    if (winner.status === "review_required") {
      return { kind: "review_required", row: winner, alreadyProcessed: true, reason: "previously flagged for review" };
    }
    return { kind: "already_processed", row: winner, alreadyProcessed: true };
  }

  // ─── No row yet — parse the session metadata (server-written at create-metro-checkout time)
  // and re-derive the order. ───
  const parsed = parseMetroCheckoutMetadata(session.metadata);
  if (!parsed.ok) {
    return { kind: "metadata_invalid", message: parsed.error };
  }

  const sessionCreatedAt = typeof session.created === "number" ? new Date(session.created * 1000) : new Date();
  const recompute = buildServerQuote(
    { ...parsed.data.request, expectedTotal: parsed.data.serverTotal },
    sessionCreatedAt,
    opts,
  );
  const recomputedQuote = recompute.ok ? recompute.quote : recompute.serverQuote ?? null;
  const recomputedTotal = recomputedQuote ? recomputedQuote.total : null;
  const amountCheck = evaluateAmountAndPrice(session.amount_total, parsed.data.serverTotal, recomputedTotal);

  const quoteForRow = recomputedQuote ?? fallbackQuoteFromMetadata(parsed.data);
  // Test-mode (Stripe TEST checkout, never a real charge) always records as 'test', regardless of
  // the underlying PaymentIntent status — this keeps test rows visually/structurally distinct
  // from 'authorized'/'paid' in the orders table and any downstream fulfillment/accounting query.
  // An amount/price mismatch still routes to 'review_required' even in test mode (worth knowing
  // about — it usually means a stale/tampered metadata blob) but IS tagged 'test' below.
  const status = amountCheck.ok ? (isTestMode ? "test" : paymentStatus) : "review_required";

  const row = buildMetroOrderRowFromMetadata({
    orderId: parsed.data.orderId,
    serverQuote: quoteForRow,
    request: parsed.data.request,
    status,
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId,
    reviewReason: amountCheck.ok ? undefined : amountCheck.reason,
    isTestMode,
  });

  const { data: insertedRows, error: insertError } = await supabase.from("orders").insert(row).select("*");

  if (insertError) {
    if (isUniqueViolation(insertError)) {
      // A concurrent caller (the other of {page, webhook}) won the optional unique-index race
      // (see supabase/migrations/**_metro_orders_unique_session.sql) — look the row up instead.
      const { data: rows } = await supabase.from("orders").select("*").eq("order_id", expectedOrderId);
      const winner = rows && rows.length > 0 ? rows[0] : null;
      if (!winner) return { kind: "error", message: "Unique violation on insert but no row found on re-select." };
      if (winner.status === "review_required") {
        return { kind: "review_required", row: winner, alreadyProcessed: true, reason: "previously flagged for review" };
      }
      return { kind: "already_processed", row: winner, alreadyProcessed: true };
    }
    return { kind: "error", message: `Failed to insert order: ${insertError.message ?? insertError}` };
  }

  const myRow = insertedRows?.[0];
  if (!myRow) {
    return { kind: "error", message: "Insert returned no row." };
  }

  // ─── Race check: re-select everything sharing this order_id (in case the other caller
  // inserted its own row for the same order between our idempotency check above and this
  // insert) and keep only the earliest. Whichever caller is NOT the winner deletes its own
  // duplicate and reports alreadyProcessed with no notifications — only the winner notifies. ───
  const { data: allRows } = await supabase.from("orders").select("*").eq("order_id", expectedOrderId);
  const race = resolveInsertRace((allRows ?? [myRow]) as { id: string; created_at: string | null }[], myRow.id);

  if (!race.isWinner) {
    await supabase.from("orders").delete().eq("id", myRow.id);
    if (race.winner.status === "review_required") {
      return { kind: "review_required", row: race.winner, alreadyProcessed: true, reason: "previously flagged for review" };
    }
    return { kind: "already_processed", row: race.winner, alreadyProcessed: true };
  }

  if (race.losers.length > 0) {
    await supabase
      .from("orders")
      .delete()
      .in("id", race.losers.map((r: { id: string }) => r.id));
  }

  if (status === "review_required") {
    return { kind: "review_required", row: myRow, alreadyProcessed: false, reason: amountCheck.reason ?? "unknown mismatch", isTestMode };
  }
  return { kind: "converted", row: myRow, paymentStatus: status as "authorized" | "paid" | "test", alreadyProcessed: false, isTestMode };
}

/**
 * Sends the appropriate notification(s) for a first-time conversion outcome. Never throws —
 * failures are logged and reflected in the returned summary, but never fail the caller's
 * response (a customer whose payment succeeded should always get a success response even if
 * Resend is down). Call ONLY when the outcome's `alreadyProcessed` is false (both
 * verify-metro-payment and metro-stripe-webhook already gate on this).
 */
// deno-lint-ignore no-explicit-any
export async function sendMetroConversionNotifications(supabase: SupabaseClient, outcome: ConversionOutcome): Promise<any> {
  if (outcome.kind === "review_required") {
    const data = toEmailData(outcome.row);
    const subjectPrefix = outcome.isTestMode ? "[TEST] " : "";
    const result = await supabase.functions
      .invoke("send-email", {
        body: {
          to: "order.support@mygravelguy.com",
          subject: `${subjectPrefix}[REVIEW REQUIRED] Metro Order - ${data.customerName}`,
          html: buildReviewRequiredInternalHtml(data, outcome.reason),
          type: "internal_notification",
          orderData: data,
        },
      })
      .catch((err: unknown) => ({ error: err }));
    const internalEmail = !result?.error;
    if (!internalEmail) console.error("=== METRO CONVERSION: REVIEW-REQUIRED INTERNAL EMAIL FAILED (non-fatal) ===", result?.error);
    return { customerEmail: false, internalEmail, reviewRequired: true };
  }

  if (outcome.kind !== "converted") return null;

  const data = toEmailData(outcome.row);
  if (!data.customerEmail) {
    console.warn("=== METRO CONVERSION: NO CUSTOMER EMAIL, SKIPPING NOTIFICATIONS ===", data.orderId);
    return { customerEmail: false, internalEmail: false, skipped: "no_customer_email" };
  }

  // Test-mode (Stripe TEST checkout — never a real charge) still emails the customer, so the
  // whole flow (including the email templates) can be verified end-to-end on staging, but every
  // subject is prefixed so nobody mistakes it for a real order — see docs/metro/research/
  // metro-checkout-server.md "Staging / test mode".
  const subjectPrefix = outcome.isTestMode ? "[TEST] " : "";

  const [customerResult, internalResult] = await Promise.allSettled([
    supabase.functions.invoke("send-email", {
      body: {
        to: data.customerEmail,
        subject: `${subjectPrefix}Order Confirmation - ${data.orderId}`,
        html: buildCustomerConfirmationHtml(data),
        type: "customer_confirmation",
        orderData: data,
      },
    }),
    supabase.functions.invoke("send-email", {
      body: {
        to: "order.support@mygravelguy.com",
        subject: `${subjectPrefix}New Metro Order - ${data.customerName}`,
        html: buildInternalNotificationHtml(data),
        type: "internal_notification",
        orderData: data,
      },
    }),
  ]);

  const customerEmail = customerResult.status === "fulfilled" && !(customerResult.value as { error?: unknown })?.error;
  const internalEmail = internalResult.status === "fulfilled" && !(internalResult.value as { error?: unknown })?.error;

  if (!customerEmail) {
    console.error(
      "=== METRO CONVERSION: CUSTOMER EMAIL FAILED (non-fatal) ===",
      customerResult.status === "fulfilled" ? (customerResult.value as { error?: unknown })?.error : customerResult.reason,
    );
  }
  if (!internalEmail) {
    console.error(
      "=== METRO CONVERSION: INTERNAL EMAIL FAILED (non-fatal) ===",
      internalResult.status === "fulfilled" ? (internalResult.value as { error?: unknown })?.error : internalResult.reason,
    );
  }

  return { customerEmail, internalEmail };
}

function toErrorAlertData(session: ConvertibleSession, orderId: string, dbErrorMessage: string): MetroOrderErrorAlertData {
  const amountCents = typeof session.amount_total === "number" ? session.amount_total : null;
  return {
    orderId,
    stripeSessionId: session.id,
    stripePaymentIntentId: extractPaymentIntentId(session),
    amount: amountCents !== null ? amountCents / 100 : null,
    customerEmail: session.metadata?.userEmail || "",
    dbErrorMessage,
  };
}

/**
 * G1 (docs/metro/research/metro-checkout-rereview.md): sends an internal-only owner alert when
 * `convertMetroSession` returns `{ kind: "error" }` — a genuine (non-23505, non-idempotency)
 * `orders` insert failure AFTER Stripe has already confirmed/authorized the payment. Without
 * this, a paid order whose DB write genuinely fails (e.g. a transient DB outage) would be
 * recorded nowhere but function logs, and could be silently lost.
 *
 * Reuses the same internal-notification path as `sendMetroConversionNotifications`'s
 * `review_required` branch (a `send-email` invoke to order.support@mygravelguy.com, escaped
 * HTML, `type: "internal_notification"`), with a dedicated template
 * (`buildOrderInsertFailedInternalHtml`) since there's no order row to read customer/material
 * details from — only what's recoverable from the verified Stripe session (metadata + amount)
 * plus the DB error text.
 *
 * DEDUPE DECISION (per G1's "pick and document" ask): ONLY `metro-stripe-webhook` calls this —
 * `verify-metro-payment` (the customer's own confirmation-page call) deliberately does NOT, so a
 * correlated failure across both callers for the same session sends at most one alert path
 * instead of two independently-alerting callers. Rationale: the webhook fires whether or not the
 * customer ever reaches `/metro-order-confirmed` (tab closed, network drop, etc.), so it's the
 * more reliable of the two signals to treat as canonical, and it now also returns 500 on this
 * outcome (see metro-stripe-webhook/index.ts) so Stripe retries the delivery — a persistent
 * failure re-alerts on each retry, which is the desired behavior (silencing repeats would risk
 * silencing the one alert that gets through once the underlying issue clears enough for the
 * email send to succeed, even while the insert itself is still failing). The
 * verify-metro-payment page-call path still shows the customer a reassuring "payment received,
 * we're confirming your order" state on this outcome (MetroOrderConfirmedPage.tsx's `ErrorView`)
 * — it just doesn't ALSO fire a duplicate owner alert.
 *
 * Never throws — failures are logged only, exactly like every other notification send in this
 * file, so a Resend outage on top of a DB outage never compounds into an unhandled rejection.
 */
export async function sendMetroConversionErrorAlert(
  supabase: SupabaseClient,
  session: ConvertibleSession,
  orderId: string,
  dbErrorMessage: string,
  isTestMode = false,
): Promise<{ internalEmail: boolean }> {
  const data = toErrorAlertData(session, orderId, dbErrorMessage);
  const subjectPrefix = isTestMode ? "[TEST] " : "";
  const result = await supabase.functions
    .invoke("send-email", {
      body: {
        to: "order.support@mygravelguy.com",
        subject: `${subjectPrefix}[ORDER MAY BE LOST] Metro order insert failed - ${data.orderId}`,
        html: buildOrderInsertFailedInternalHtml(data),
        type: "internal_notification",
        orderData: data,
      },
    })
    .catch((err: unknown) => ({ error: err }));
  const internalEmail = !result?.error;
  if (!internalEmail) {
    console.error("=== METRO CONVERSION: ORDER-INSERT-FAILED ALERT EMAIL FAILED (non-fatal) ===", result?.error);
  }
  return { internalEmail };
}
