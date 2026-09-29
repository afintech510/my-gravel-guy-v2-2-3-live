// v2 of create-auth-hold (S1-LIVE-CHECKOUT-FIX). create-auth-hold/index.ts is left byte-identical
// (`git diff HEAD -- supabase/functions/create-auth-hold` stays empty) — this is a side-by-side
// copy with the fixes, opt-in via src/services/checkoutFunctions.ts's
// VITE_CREATE_AUTH_HOLD_FUNCTION env var. See docs/metro/research/live-checkout-v2.md for the
// full design and docs/metro/research/metro-checkout-security-review.md for the finding this
// closes: create-auth-hold trusts every client-supplied item price entirely, so a tampered
// client can create an authorization hold for far less than the real order total.
//
// What's different from v1:
//  - Live/test Stripe key selection follows supabase/functions/_shared/stripe-mode.ts (by
//    request Origin) instead of always using the live "stripe" secret.
//  - Item prices are checked against the products table (see
//    src/services/checkoutV2/pricing.ts's module doc for why this is "detect a hard floor, flag
//    the rest" rather than a full price recompute — legacy ZIP-adjustment/coupon math isn't
//    centrally reproducible server-side the way metro's serverQuote.ts is). A submitted price
//    below 50% of the DB's canonical products.price is rejected outright (409 PRICE_CHANGED);
//    everything else is allowed through and labeled in Stripe metadata for verify-payment-v2 to
//    see, never silently trusted as "verified correct".
//  - The expected total (in cents, computed the same way Stripe will actually charge) and the
//    orderId are written into the Checkout Session's metadata (never client-editable after this
//    point) so verify-payment-v2 can bind the paid session back to this exact order (fixes F1).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveStripeModeForOrigin } from "../_shared/stripe-mode.ts";
// @deno-types="../_shared/checkout-v2.bundle.d.ts"
import {
  buildCheckoutV2Metadata,
  computeExpectedTotalCents,
  evaluateItemPrices,
  type StripeItemInput,
} from "../_shared/checkout-v2.bundle.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const verifyAuth = async (authHeader: string | null, supabaseUrl: string, supabaseAnonKey: string) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const origin = req.headers.get('origin');
    const { mode, secretKey: stripeSecretKey } = resolveStripeModeForOrigin(origin);
    if (!stripeSecretKey) {
      console.error(`create-auth-hold-v2: no Stripe secret key configured for mode "${mode}"`);
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const authHeader = req.headers.get('authorization');
    const user = await verifyAuth(authHeader, supabaseUrl, supabaseAnonKey);

    const { items, orderId, depositOption, cancelUrl } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid items provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const contactEmail = items.find((item: StripeItemInput) => item.metadata?.contactEmail)?.metadata?.contactEmail;
    if (!contactEmail) {
      return new Response(
        JSON.stringify({ error: "Contact email is required for checkout" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    let finalOrderId = orderId;
    if (orderId && orderId.startsWith('CART-')) {
      finalOrderId = orderId;
    } else if (!orderId) {
      finalOrderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // ─── Server-side price validation (the actual F-finding this function closes) ───
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const productIds = [...new Set(items.map((item: StripeItemInput) => String(item.id)))];
    let dbPrices: { id: string; price: number | null }[] = [];
    try {
      const { data: products, error: productsError } = await supabaseAdmin
        .from('products')
        .select('id, price')
        .in('id', productIds);
      if (productsError) {
        console.error('create-auth-hold-v2: products lookup failed, treating all items as unverifiable:', productsError.message);
        dbPrices = [];
      } else {
        dbPrices = (products ?? []).map((p: { id: string; price: number | null }) => ({ id: String(p.id), price: p.price }));
      }
    } catch (lookupError) {
      console.error('create-auth-hold-v2: products lookup threw, treating all items as unverifiable:', lookupError);
      dbPrices = [];
    }

    const priceEvaluation = evaluateItemPrices(items, dbPrices, !!depositOption);
    if (priceEvaluation.verdict === 'mismatch') {
      console.warn('create-auth-hold-v2: rejecting order due to price floor violation', {
        orderId: finalOrderId,
        details: priceEvaluation.items.filter((i) => i.verdict === 'mismatch'),
      });
      return new Response(
        JSON.stringify({
          error: "PRICE_CHANGED",
          code: "PRICE_CHANGED",
          message: "One or more item prices could not be verified. Please refresh your cart and try again.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 409 }
      );
    }

    const expectedTotalCents = computeExpectedTotalCents(items, !!depositOption);
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const metadata = buildCheckoutV2Metadata({
      orderId: finalOrderId,
      expectedTotalCents,
      depositOption: !!depositOption,
      priceCheck: priceEvaluation.verdict,
      items: items.map((item: StripeItemInput) => ({ id: item.id, price: item.price, quantity: item.quantity })),
      userId: user?.id || 'guest',
      userEmail: user?.email || contactEmail,
      isGuest: !user,
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      payment_intent_data: {
        capture_method: 'manual',
      },
      line_items: items.map((item: StripeItemInput) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description || '',
            metadata: {
              orderId: finalOrderId,
              userId: user?.id || 'guest',
              ...item.metadata,
            },
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${finalOrderId}`,
      cancel_url: `${req.headers.get('origin')}${cancelUrl || '/cart'}`,
      metadata,
      customer_email: contactEmail,
      billing_address_collection: 'required',
    });

    console.log('create-auth-hold-v2: session created', {
      sessionId: session.id,
      mode,
      orderId: finalOrderId,
      priceCheck: priceEvaluation.verdict,
      expectedTotalCents,
    });

    return new Response(
      JSON.stringify({
        url: session.url,
        session_id: session.id,
        order_id: finalOrderId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error('create-auth-hold-v2: processing error:', error);
    return new Response(
      JSON.stringify({ error: "Authorization hold processing failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
