// verify-metro-payment — converts a verified-paid metro Stripe Checkout Session into an `orders`
// row, idempotently, fully isolated from the live verify-payment function.
//
// UPDATE (2026-09-28, hardening pass — A1v3-METRO-CHECKOUT-HARDENING, per
// docs/metro/research/metro-checkout-security-review.md finding F3): there is no more
// `CART-METRO-…` row to look up and flip to `ORDER-METRO-…` — create-metro-checkout no longer
// inserts anything before payment. This function now re-derives the entire order from the
// Stripe session's metadata (written once, server-side, at session-creation time — see
// src/metro/checkout/conversion.ts) and inserts the ONE `orders` row itself, the first time a
// payment for that order is verified. A second call (page reload, retry) finds the row already
// exists and returns it with `alreadyProcessed: true`, no notifications resent. The exact same
// conversion path is also reachable via the new `metro-stripe-webhook` function (Stripe's own
// `checkout.session.completed`/`async_payment_succeeded` events) — see
// supabase/functions/_shared/metro-conversion-runner.ts, which both functions call into, for the
// shared insert-race handling that keeps this idempotent no matter which of the two gets there
// first (e.g. the customer closes the tab right after paying, before this function's own call
// completes — the webhook still converts the order).
//
// Why a brand-new function instead of reusing verify-payment: the original metro-checkout
// design relied on verify-payment's existing CART- branch. That branch is dead code on
// production `main` today — a pre-existing, undeclared `paymentStatus` reference throws inside
// a swallowed try/catch on every request, regardless of order prefix (see
// docs/metro/research/verify-payment-paymentstatus-bug.md for the full trace). The orchestrator
// decided NOT to patch verify-payment (any change to that shared, live function carries
// regression risk to the real /cart→/checkout→/payment-success flow, which already has its own
// working client-side fallback). So metro gets its own conversion path end-to-end: its own
// success_url (METRO_CONFIRMATION_PATH, a new client route), its own verify function (this one),
// and its own notifications.
//
// Request: { sessionId, orderId } — orderId must be the ORDER-METRO- id create-metro-checkout
// returned (no more CART-/ORDER- dual form — there's only ever one id now).
//
// Response contract (src/metro/checkout/contract.ts's MetroVerifyResponse) is UNCHANGED from the
// original design, so MetroOrderConfirmedPage.tsx needed no behavioral changes beyond the id
// prefix. `unpaid` and `not_found` now have precise, narrower meanings than before: `unpaid`
// means the Stripe PaymentIntent genuinely hasn't authorized/captured yet (no DB effects at all —
// there's no row to not-touch); `not_found` means the Stripe session itself doesn't exist or
// isn't a metro-checkout session — never "no DB row yet", since that's no longer a distinct state
// (the row is derived from the session, not looked up separately).
//
// All decision logic (session/request validation, status mapping, metadata (de)serialization,
// order-row shaping, insert-race resolution, response/HTTP-status shaping) is pure and lives in
// src/metro/checkout/verifyLogic.ts + conversion.ts, bundled into
// ../_shared/metro-checkout.bundle.js by scripts/metro/export-metro-checkout-bundle.mjs. This
// file + ../_shared/metro-conversion-runner.ts are the I/O shell: Stripe retrieve, Supabase
// reads/writes, and notification dispatch.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  buildErrorResponse,
  buildReviewRequiredResponse,
  buildSuccessResponse,
  httpStatusForResponse,
  validateVerifyRequest,
} from "../_shared/metro-checkout.bundle.js";
import { convertMetroSession, sendMetroConversionNotifications } from "../_shared/metro-conversion-runner.ts";
import { resolveStripeModeForSessionId } from "../_shared/stripe-mode.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      const response = buildErrorResponse("error", "Server configuration error");
      return jsonResponse(response, httpStatusForResponse(response));
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      const response = buildErrorResponse("invalid", "Invalid JSON in request body.");
      return jsonResponse(response, httpStatusForResponse(response));
    }

    // deno-lint-ignore no-explicit-any
    const requestValidation = validateVerifyRequest(body as any);
    if (!requestValidation.ok) {
      const response = buildErrorResponse(requestValidation.status, requestValidation.error);
      return jsonResponse(response, httpStatusForResponse(response));
    }
    const { orderId } = requestValidation;
    const sessionId = (body.sessionId as string).trim();

    // Key selection follows the session id Stripe itself issued (cs_test_… vs cs_…) — see
    // ../_shared/stripe-mode.ts. Fail closed if the resolved mode's key isn't configured, same as
    // create-metro-checkout: never silently retry with the other mode's key.
    const { mode: stripeMode, secretKey: stripeSecretKey } = resolveStripeModeForSessionId(sessionId);
    if (!stripeSecretKey) {
      console.error("=== VERIFY METRO PAYMENT: MISSING STRIPE SECRET KEY FOR MODE ===", { mode: stripeMode });
      const response = buildErrorResponse("error", "Server configuration error");
      return jsonResponse(response, httpStatusForResponse(response));
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["payment_intent"] });
    } catch (stripeError) {
      console.error("=== VERIFY METRO PAYMENT: STRIPE RETRIEVE FAILED ===", stripeError);
      const response = buildErrorResponse("not_found", "Stripe session not found.");
      return jsonResponse(response, httpStatusForResponse(response));
    }

    // session.livemode is Stripe's own authoritative live/test signal (more reliable than the
    // cs_test_ id-prefix heuristic used above to pick the retrieval key) — used to gate both the
    // METRO_CHECKOUT_ALLOW_UNCONFIRMED bypass and the order status/tags/notification prefix below.
    const isTestMode = session.livemode === false;
    const allowUnconfirmed = Deno.env.get("METRO_CHECKOUT_ALLOW_UNCONFIRMED") === "true" && isTestMode;
    // deno-lint-ignore no-explicit-any
    const outcome = await convertMetroSession(supabase, session as any, orderId, { allowUnconfirmed, isTestMode });

    switch (outcome.kind) {
      case "unpaid": {
        const response = buildErrorResponse("unpaid", "Payment has not completed yet.");
        return jsonResponse(response, httpStatusForResponse(response));
      }
      case "session_invalid": {
        const response = buildErrorResponse(outcome.status, outcome.message);
        return jsonResponse(response, httpStatusForResponse(response));
      }
      case "metadata_invalid": {
        console.error("=== VERIFY METRO PAYMENT: METADATA INVALID ===", outcome.message, { orderId, sessionId });
        const response = buildErrorResponse("error", "Payment verification failed.");
        return jsonResponse(response, httpStatusForResponse(response));
      }
      case "error": {
        // Genuine DB-level insert failure after a verified payment (G1,
        // docs/metro/research/metro-checkout-rereview.md) — NOT a 23505 unique violation (that's
        // handled inside convertMetroSession as already_processed/review_required and never
        // reaches this branch). Deliberately does NOT send an owner alert here — see
        // sendMetroConversionErrorAlert's doc comment in metro-conversion-runner.ts for the
        // dedupe decision: only metro-stripe-webhook alerts, so a correlated failure across both
        // callers for the same session doesn't fire two alert emails. httpStatusForResponse maps
        // this to 500, and MetroOrderConfirmedPage.tsx's ErrorView shows the customer a
        // reassuring "payment received, we're confirming your order" message rather than the raw
        // error, with the order id as a reference for support.
        console.error("=== VERIFY METRO PAYMENT: CONVERSION ERROR (insert failed, payment already verified) ===", outcome.message, {
          orderId,
          sessionId,
        });
        const response = buildErrorResponse("error", "Failed to record the order.");
        return jsonResponse(response, httpStatusForResponse(response));
      }
      case "review_required": {
        // Never surfaced as a success — never send the customer confirmation email either.
        if (!outcome.alreadyProcessed) {
          console.error("=== VERIFY METRO PAYMENT: REVIEW REQUIRED ===", outcome.reason, { orderId, sessionId });
          const notifications = await sendMetroConversionNotifications(supabase, outcome).catch((err) => {
            console.error("=== VERIFY METRO PAYMENT: REVIEW-REQUIRED NOTIFICATION THREW (non-fatal) ===", err);
            return null;
          });
          const response = buildReviewRequiredResponse();
          return jsonResponse({ ...response, notifications }, httpStatusForResponse(response));
        }
        const response = buildReviewRequiredResponse();
        return jsonResponse({ ...response, notifications: null }, httpStatusForResponse(response));
      }
      case "already_processed": {
        const status = outcome.row.status === "paid" ? "paid" : outcome.row.status === "test" ? "test" : "authorized";
        const response = buildSuccessResponse(outcome.row, status, true);
        return jsonResponse({ ...response, notifications: null }, httpStatusForResponse(response));
      }
      case "converted": {
        const notifications = await sendMetroConversionNotifications(supabase, outcome).catch((err) => {
          console.error("=== VERIFY METRO PAYMENT: NOTIFICATIONS THREW (non-fatal) ===", err);
          return { customerEmail: false, internalEmail: false, error: String(err) };
        });
        const response = buildSuccessResponse(outcome.row, outcome.paymentStatus, false);
        return jsonResponse({ ...response, notifications }, httpStatusForResponse(response));
      }
      default: {
        const response = buildErrorResponse("error", "Payment verification failed.");
        return jsonResponse(response, httpStatusForResponse(response));
      }
    }
  } catch (error) {
    console.error("=== VERIFY METRO PAYMENT: UNHANDLED ERROR ===", error);
    const response = buildErrorResponse("error", "Payment verification failed.");
    return jsonResponse(response, httpStatusForResponse(response));
  }
});
