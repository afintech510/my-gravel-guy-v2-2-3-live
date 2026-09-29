// create-metro-checkout — server side of "metro orders pay through the existing Stripe flow".
//
// Mirrors create-auth-hold's Stripe session shape (manual-capture authorization hold, same
// metadata keys). This function's job is to (1) re-validate the price server-side from the
// metro price book so the client can never tamper with the amount actually charged, and
// (2) hand everything needed to build the order later to Stripe as Checkout Session metadata.
//
// UPDATE (2026-09-28, hardening pass — A1v3-METRO-CHECKOUT-HARDENING, per
// docs/metro/research/metro-checkout-security-review.md finding F3): this function used to
// insert an `orders` row with status='cart' BEFORE Stripe checkout even started, so that an
// unauthenticated, uncompleted checkout attempt already created a DB row with attacker-supplied
// delivery_email/delivery_phone — which process-abandoned-carts would later email/text
// unsolicited (a real spam/TCPA vector, and a DB-spam vector, against arbitrary victims with zero
// verification). It no longer inserts anything. The order id is generated once, here, and
// EVERYTHING needed to create the order later (the full validated+sanitized request plus the
// server-computed quote) is written into the Stripe Checkout Session's `metadata` instead — see
// src/metro/checkout/contract.ts's METRO_CHECKOUT_METADATA_KEYS for the exact key list and
// src/metro/checkout/conversion.ts's buildMetroCheckoutMetadata for the serialization. No
// `orders` row exists until a payment is actually verified (verify-metro-payment or
// metro-stripe-webhook — see docs/metro/research/metro-checkout-server.md for the full flow
// diagram), at which point the order is inserted idempotently, exactly once.
//
// See docs/metro/research/metro-checkout-server.md for the full design, the manual
// Stripe-TEST-mode test plan, and owner deploy steps.
//
// All quoting/validation/sanitization logic lives in src/metro/checkout/serverQuote.ts and is
// bundled into ../_shared/metro-checkout.bundle.js by
// scripts/metro/export-metro-checkout-bundle.mjs (Deno can't import `@/`-aliased TS out of src/
// directly). Re-run that script and redeploy whenever serverQuote.ts/conversion.ts (or anything
// they import under src/metro/**) changes — a vitest parity test
// (src/metro/checkout/bundleParity.test.ts) fails locally if the checked-in bundle drifts.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  buildLineItemCents,
  buildMetroCheckoutMetadata,
  buildServerQuote,
  generateMetroOrderId,
  resolveMetroCheckoutOrigin,
  sanitizeCheckoutRequest,
} from "../_shared/metro-checkout.bundle.js";
import { resolveStripeModeForOrigin } from "../_shared/stripe-mode.ts";

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

// Optional auth, same pattern as create-auth-hold / verify-payment — guest checkout is allowed.
const verifyAuth = async (authHeader: string | null, supabaseUrl: string, supabaseAnonKey: string) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
};

/** Sanitizes cancelPath the same way serverQuote.validateRequest already gated it: must start
 * with '/' and not '//'. buildServerQuote already rejects a bad cancelPath with INVALID_INPUT
 * before we get here, so this is just the default + defensive fallback. */
const resolveCancelPath = (cancelPath: unknown): string => {
  if (typeof cancelPath === "string" && cancelPath.startsWith("/") && !cancelPath.startsWith("//")) {
    return cancelPath;
  }
  return "/cart";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: "Server configuration error", code: "SERVER_ERROR" }, 500);
    }

    // Stripe live/test mode follows the request Origin (see ../_shared/stripe-mode.ts):
    // STAGING_ORIGINS is the ONLY thing that can put a request into test mode — everything else
    // (including a missing/unrecognized Origin) stays live, exactly as before this change.
    const originHeader = req.headers.get("origin");
    const { mode: stripeMode, secretKey: stripeSecretKey } = resolveStripeModeForOrigin(originHeader);
    if (!stripeSecretKey) {
      // Fail closed — never silently fall back to the live key for a staging/test-mode request,
      // and never proceed without a key at all for a live request either.
      console.error("=== METRO CHECKOUT: MISSING STRIPE SECRET KEY FOR MODE ===", { mode: stripeMode });
      return jsonResponse({ error: "Server configuration error", code: "SERVER_ERROR" }, 500);
    }

    const authHeader = req.headers.get("authorization");
    const user = await verifyAuth(authHeader, supabaseUrl, supabaseAnonKey);

    let rawRequest: Record<string, unknown>;
    try {
      rawRequest = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON in request body", code: "INVALID_INPUT" }, 400);
    }

    // METRO_CHECKOUT_ALLOW_UNCONFIRMED is an owner staging override to let checkout run against
    // an unconfirmed price book — it must never be able to enable that for a LIVE checkout, so
    // it's gated on test mode (i.e. the request Origin being in STAGING_ORIGINS) in addition to
    // the env var itself. A misconfigured/forgotten-on env var can therefore never expose
    // unconfirmed pricing to real customers; it only ever does anything on staging.
    const allowUnconfirmed = Deno.env.get("METRO_CHECKOUT_ALLOW_UNCONFIRMED") === "true" && stripeMode === "test";
    const now = new Date();

    // Sanitize once, up front — buildServerQuote also sanitizes internally (idempotent), but we
    // need the same cleaned copy afterwards to build Stripe metadata (never the raw request).
    // deno-lint-ignore no-explicit-any
    const request = sanitizeCheckoutRequest(rawRequest as any);
    const quoteResult = buildServerQuote(request, now, { allowUnconfirmed });

    if (!quoteResult.ok) {
      console.log("=== METRO CHECKOUT QUOTE REJECTED ===", {
        code: quoteResult.code,
        error: quoteResult.error,
        metroSlug: request.metroSlug,
      });
      return jsonResponse(
        { error: quoteResult.error, code: quoteResult.code, serverQuote: quoteResult.serverQuote },
        quoteResult.status,
      );
    }

    const serverQuote = quoteResult.quote;
    const orderId = generateMetroOrderId(now);

    // Origin allowlist for the success/cancel redirect URLs must include staging origins too
    // (STAGING_ORIGINS — same env var stripe-mode.ts reads to decide live vs test) so a staging
    // checkout doesn't fall back to the production METRO_CHECKOUT_DEFAULT_ORIGIN after payment.
    const extraOrigins = [Deno.env.get("METRO_CHECKOUT_EXTRA_ORIGINS"), Deno.env.get("STAGING_ORIGINS")]
      .filter(Boolean)
      .join(",");
    const origin = resolveMetroCheckoutOrigin(originHeader, extraOrigins);
    const cancelPath = resolveCancelPath(request.cancelPath);
    const contactEmail = request.contact.email;
    // Captured server-side from the real request header rather than trusted from the client
    // body — see contract.ts's ALLOWED_UTM_KEYS comment for why user_agent isn't in that list.
    const userAgent = (req.headers.get("user-agent") ?? "").slice(0, 200);

    const metadata = buildMetroCheckoutMetadata(request, orderId, serverQuote, {
      userId: user?.id || "guest",
      userEmail: user?.email || contactEmail || "",
      isGuest: !user,
      userAgent,
    });

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Integer-cents line items that sum EXACTLY to amount_total (security-review F8 fix) —
    // each independently-rounded fee used to risk a ±$0.01 drift from the DB total; now every
    // amount is derived from the same integer-cents arithmetic, with any rounding remainder
    // reconciled onto the base-price line.
    const cents = buildLineItemCents(serverQuote);

    const lineItems: Array<{
      price_data: {
        currency: string;
        product_data: { name: string; description?: string };
        unit_amount: number;
      };
      quantity: number;
    }> = [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${serverQuote.variantName} — ${serverQuote.quantity} ${serverQuote.unit}${serverQuote.quantity === 1 ? "" : "s"} delivered`,
            description: `${serverQuote.zoneName} · ${serverQuote.deliveryDate} · ${serverQuote.truckPlan}`,
          },
          unit_amount: cents.basePriceCents,
        },
        quantity: 1,
      },
    ];
    if (cents.saturdayFeeCents > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Saturday delivery fee" },
          unit_amount: cents.saturdayFeeCents,
        },
        quantity: 1,
      });
    }
    if (cents.rushFeeCents > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Rush/next-day delivery fee" },
          unit_amount: cents.rushFeeCents,
        },
        quantity: 1,
      });
    }

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        payment_intent_data: {
          capture_method: "manual", // authorization hold, same as create-auth-hold
        },
        line_items: lineItems,
        mode: "payment",
        // Metro is fully isolated from the shared /payment-success + verify-payment pipeline
        // (see docs/metro/research/verify-payment-paymentstatus-bug.md) — redirects to the
        // dedicated confirmation route (contract.ts's METRO_CONFIRMATION_PATH), which calls
        // verify-metro-payment (contract.ts's METRO_VERIFY_FUNCTION) directly.
        success_url: `${origin}/metro-order-confirmed?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
        cancel_url: `${origin}${cancelPath}`,
        metadata,
        customer_email: contactEmail,
        billing_address_collection: "required",
      });
    } catch (stripeError) {
      console.error("=== METRO CHECKOUT STRIPE SESSION FAILED ===", stripeError);
      // No DB row was ever created, so there's nothing to clean up here (unlike the pre-
      // hardening design, which had to best-effort delete a just-inserted cart row).
      return jsonResponse({ error: "Unable to start checkout", code: "SERVER_ERROR" }, 500);
    }

    console.log("=== METRO CHECKOUT SESSION CREATED ===", {
      sessionId: session.id,
      orderId,
      total: serverQuote.total,
      userType: user ? "authenticated" : "guest",
    });

    return jsonResponse(
      { url: session.url, session_id: session.id, order_id: orderId, serverQuote },
      200,
    );
  } catch (error) {
    console.error("=== METRO CHECKOUT UNHANDLED ERROR ===", error);
    return jsonResponse({ error: "Metro checkout failed", code: "SERVER_ERROR" }, 500);
  }
});
