// metro-stripe-webhook — NEW function (A1v3-METRO-CHECKOUT-HARDENING), the second entry point
// into the shared metro order-conversion path (see supabase/functions/_shared/metro-conversion-
// runner.ts). Listens for `checkout.session.completed` and
// `checkout.session.async_payment_succeeded` on the mygravelguy.com Stripe account and converts
// a paid metro session into an `orders` row exactly the same way verify-metro-payment does —
// idempotently, via the same shared insert-race-safe logic — so an order still gets recorded
// even if the customer pays and then closes the tab / loses connectivity before
// /metro-order-confirmed's own call to verify-metro-payment completes. This closes the one gap
// explicitly flagged as a known follow-up in the original design
// (docs/metro/research/metro-checkout-server.md's "Risks / open decisions" section).
//
// `verify_jwt = false` (supabase/config.toml) — Stripe calls this endpoint directly, with no
// Supabase auth; the ONLY trust boundary is the Stripe webhook signature, verified below via
// `stripe.webhooks.constructEventAsync` + `Stripe.createSubtleCryptoProvider()` (the Deno-
// compatible crypto provider — Stripe's default Node `constructEvent` relies on Node's `crypto`
// module, which isn't available the same way under Deno's edge runtime). Verification runs
// against the RAW request body — never the parsed JSON — since the signature is computed over
// the exact bytes Stripe sent.
//
// Always returns 2xx quickly once the signature is valid for every OUTCOME EXCEPT a genuine
// `orders` insert failure after a verified payment (`convertMetroSession`'s `kind: "error"` —
// e.g. a transient DB outage; NOT the unique-violation / already-processed paths, which are
// handled inside convertMetroSession and never reach this branch). That one outcome returns 500
// instead (G1, docs/metro/research/metro-checkout-rereview.md) so Stripe's own retry mechanism
// (up to 3 days) gets a chance to self-heal a transient DB issue instead of the order being lost
// after a single silently-swallowed 200. A retry landing after the order eventually gets
// recorded — by this webhook's own later retry, or by the customer's own verify-metro-payment
// call in the meantime — is a no-op: convertMetroSession's fast idempotency check (by order_id)
// returns `already_processed` for it, so re-delivery is always safe. Every other ignored/
// business-as-usual outcome (wrong event type, non-metro session, unpaid, metadata_invalid,
// session_invalid) still gets a fast 2xx so Stripe doesn't retry/backoff unnecessarily for
// something a retry can't fix. Only a genuinely invalid signature gets a 400.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { isMetroCheckoutWebhookEvent } from "../_shared/metro-checkout.bundle.js";
import {
  convertMetroSession,
  sendMetroConversionErrorAlert,
  sendMetroConversionNotifications,
} from "../_shared/metro-conversion-runner.ts";
import { resolveStripeModeForLivemode } from "../_shared/stripe-mode.ts";

const jsonResponse = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" }, status });

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeLiveSecretKey = Deno.env.get("stripe");
  // Two signing secrets — one per Stripe account mode, since a TEST-mode Checkout Session (from
  // staging) and a LIVE one are signed with different endpoint secrets even on the same webhook
  // URL. See ../_shared/stripe-mode.ts for the mode-selection contract this mirrors.
  const webhookSecretLive = Deno.env.get("STRIPE_METRO_WEBHOOK_SECRET");
  const webhookSecretTest = Deno.env.get("STRIPE_METRO_WEBHOOK_SECRET_TEST");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!stripeLiveSecretKey || !supabaseUrl || !supabaseServiceRoleKey || (!webhookSecretLive && !webhookSecretTest)) {
    console.error("=== METRO STRIPE WEBHOOK: SERVER CONFIGURATION ERROR ===");
    // Still 500 here (not a signature problem) — Stripe will retry, which is desirable once
    // the misconfiguration is fixed.
    return jsonResponse({ error: "Server configuration error" }, 500);
  }

  const signature = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  // Only used to verify the signature below (constructEventAsync does no API call, so any
  // syntactically-valid key string works here) — the REAL key used for subsequent Stripe API
  // calls (paymentIntents.retrieve) is chosen below, once event.livemode is known.
  const verifier = new Stripe(stripeLiveSecretKey, { apiVersion: "2023-10-16" });
  const cryptoProvider = Stripe.createSubtleCryptoProvider();

  let event: Stripe.Event | undefined;
  let lastVerifyError: unknown;
  if (!signature) {
    console.error("=== METRO STRIPE WEBHOOK: SIGNATURE VERIFICATION FAILED ===", "Missing stripe-signature header");
    return jsonResponse({ error: "Invalid signature" }, 400);
  }
  // Try the live signing secret first, then the test one — fail closed (400) if neither verifies.
  // This never falls back to trusting an unverified payload; it only tries two known-good secrets.
  for (const webhookSecret of [webhookSecretLive, webhookSecretTest]) {
    if (!webhookSecret) continue;
    try {
      event = await verifier.webhooks.constructEventAsync(rawBody, signature, webhookSecret, undefined, cryptoProvider);
      break;
    } catch (err) {
      lastVerifyError = err;
    }
  }
  if (!event) {
    console.error("=== METRO STRIPE WEBHOOK: SIGNATURE VERIFICATION FAILED ===", lastVerifyError);
    return jsonResponse({ error: "Invalid signature" }, 400);
  }

  // event.livemode is Stripe's own authoritative live/test signal — pick the matching API secret
  // key for every Stripe call from here on (paymentIntents.retrieve below). Fail closed if the
  // resolved mode's key isn't configured (e.g. a test event arrives but STRIPE_TEST_SECRET_KEY was
  // never set) rather than silently using the wrong-mode key, which Stripe would reject anyway.
  // Uses stripe-mode.ts's own default env getter (Deno.env.get) — reads the same "stripe"/
  // STRIPE_TEST_SECRET_KEY env vars used everywhere else in this file/module.
  const { mode: stripeMode, secretKey: stripeSecretKey } = resolveStripeModeForLivemode(event.livemode);
  if (!stripeSecretKey) {
    console.error("=== METRO STRIPE WEBHOOK: MISSING STRIPE SECRET KEY FOR MODE ===", { mode: stripeMode });
    return jsonResponse({ error: "Server configuration error" }, 500);
  }
  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

  // deno-lint-ignore no-explicit-any
  if (!isMetroCheckoutWebhookEvent(event as any)) {
    // Wrong event type, or not a metro-checkout session — ack fast, nothing to do.
    return jsonResponse({ received: true, ignored: true }, 200);
  }

  try {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.error("=== METRO STRIPE WEBHOOK: SESSION METADATA MISSING orderId ===", { sessionId: session.id });
      return jsonResponse({ received: true, ignored: true }, 200);
    }

    // Webhook payloads never carry an expanded payment_intent — retrieve it separately so
    // mapPaymentIntentStatus (shared with verify-metro-payment) sees a real `.status`.
    let paymentIntent: Stripe.PaymentIntent | null = null;
    const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
    if (piId) {
      try {
        paymentIntent = await stripe.paymentIntents.retrieve(piId);
      } catch (piError) {
        console.error("=== METRO STRIPE WEBHOOK: PAYMENT INTENT RETRIEVE FAILED ===", piError);
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Same fail-closed gating as create-metro-checkout/verify-metro-payment: the unconfirmed-
    // price-book bypass can only ever do anything for a TEST-mode event (event.livemode === false).
    const isTestMode = event.livemode === false;
    const allowUnconfirmed = Deno.env.get("METRO_CHECKOUT_ALLOW_UNCONFIRMED") === "true" && isTestMode;
    const minimalSession = {
      id: session.id,
      metadata: session.metadata,
      amount_total: session.amount_total,
      created: session.created,
      payment_intent: paymentIntent ? { id: paymentIntent.id, status: paymentIntent.status } : null,
      livemode: event.livemode,
    };

    const outcome = await convertMetroSession(supabase, minimalSession, orderId, { allowUnconfirmed, isTestMode });

    if (outcome.kind === "converted" || (outcome.kind === "review_required" && !outcome.alreadyProcessed)) {
      await sendMetroConversionNotifications(supabase, outcome).catch((err) => {
        console.error("=== METRO STRIPE WEBHOOK: NOTIFICATION THREW (non-fatal) ===", err);
      });
    }

    if (outcome.kind === "error") {
      // Genuine DB-level insert failure after a verified payment — see G1. Alert the owner (this
      // is the ONLY caller that does, by design — see sendMetroConversionErrorAlert's doc
      // comment for the dedupe decision) and return 500 so Stripe retries.
      console.error("=== METRO STRIPE WEBHOOK: CONVERSION ERROR (insert failed, payment already verified) ===", outcome.message, {
        orderId,
        sessionId: session.id,
      });
      await sendMetroConversionErrorAlert(supabase, minimalSession, orderId, outcome.message, isTestMode).catch((err) => {
        console.error("=== METRO STRIPE WEBHOOK: ERROR ALERT THREW (non-fatal) ===", err);
      });
      return jsonResponse({ received: true, error: "internal error recording order, will retry" }, 500);
    }

    console.log("=== METRO STRIPE WEBHOOK: PROCESSED ===", { sessionId: session.id, orderId, outcomeKind: outcome.kind });
    return jsonResponse({ received: true }, 200);
  } catch (error) {
    console.error("=== METRO STRIPE WEBHOOK: UNHANDLED ERROR ===", error);
    // 200 anyway — we don't want Stripe hammering retries for a bug on our side that a retry
    // won't fix; the same order can still be converted via verify-metro-payment (the customer's
    // own confirmation-page call) as a fallback, or by a manual re-drive of this event from the
    // Stripe dashboard once the bug is fixed.
    return jsonResponse({ received: true, error: "internal error, see function logs" }, 200);
  }
});
