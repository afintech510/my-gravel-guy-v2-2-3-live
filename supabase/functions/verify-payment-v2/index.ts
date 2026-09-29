// v2 of verify-payment (S1-LIVE-CHECKOUT-FIX). verify-payment/index.ts is left byte-identical
// (`git diff HEAD -- supabase/functions/verify-payment` stays empty) — this is a side-by-side
// copy with the fixes, opt-in via src/services/checkoutFunctions.ts's
// VITE_VERIFY_PAYMENT_FUNCTION env var. Full design: docs/metro/research/live-checkout-v2.md.
//
// Fixes applied here (v1 findings, both in docs/metro/research/):
//  F2 (verify-payment-paymentstatus-bug.md) — `paymentStatus` is referenced but never declared
//     in v1, so its DB-write block always throws and is silently swallowed. Fixed by using
//     src/services/checkoutV2/statusMapping.ts's computeOrderStatus/computeOrderStatusWithReview
//     (the correctly-declared equivalent of v1's `orderStatus` variable).
//  F1 (metro-checkout-security-review.md) — v1 never binds the verified Stripe session to the
//     requested orderId and never checks the paid amount, so a cheap real payment can be
//     resubmitted against a different, more expensive order. Fixed for sessions created by
//     create-auth-hold-v2 (checked against session metadata) and for quote conversions (checked
//     against the DB's own stored quote total) — see src/services/checkoutV2/binding.ts's module
//     doc for what's NOT bindable (the landing page's separate, un-migrated `create-payment`
//     function) and why, and live-checkout-v2.md for the full v1-vs-v2 behavior table.
//
// Also implements: idempotency (returns existing rows + alreadyProcessed instead of re-inserting/
// re-emailing when a stripe_session_id has already been processed), and moves the customer +
// internal confirmation emails server-side (src/pages/PaymentSuccess.tsx's client-side
// `handleDatabaseInsert`/`handleEmailSending` no longer run on the v2 path at all).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { resolveStripeModeForOrigin, resolveStripeModeForSessionId } from "../_shared/stripe-mode.ts";
// @deno-types="../_shared/checkout-v2.bundle.d.ts"
import {
  buildCustomerEmailSubject,
  buildFreshOrderRecords,
  buildInternalEmailSubject,
  buildOrderEmailData,
  buildQuoteConversionUpdate,
  buildReviewRequiredAlertHtml,
  buildReviewRequiredAlertSubject,
  classifySessionOrigin,
  computeOrderStatusWithReview,
  decideIdempotency,
  evaluateBinding,
  generateCustomerConfirmationEmail,
  generateInternalNotificationEmail,
  parseCheckoutV2Metadata,
  type BackupItem,
  type CheckoutBackupV2,
  type OrderStatus,
} from "../_shared/checkout-v2.bundle.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INTERNAL_NOTIFICATION_EMAIL = "order.support@mygravelguy.com";

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

const isUUID = (str: string): boolean => str.includes('-') && str.length > 30;

const transformRowForResponse = (order: Record<string, any>) => ({
  id: order.id,
  order_id: order.order_id,
  product_name: order.product_name || order.product_id,
  quantity: order.quantity,
  total_price: order.total_price,
  delivery_date: order.delivery_date,
  delivery_address_street: order.delivery_street,
  delivery_address_city: order.delivery_city,
  delivery_address_state: order.delivery_state,
  delivery_address_zip: order.delivery_zip,
  contact_name: order.delivery_name,
  contact_email: order.delivery_email,
  contact_phone: order.delivery_phone,
  delivery_time_preference: order.delivery_time_preference,
  delivery_instructions: order.delivery_instructions,
  status: order.status,
  is_deposit_payment: order.is_deposit_payment,
  deposit_amount: order.deposit_amount,
  balance_due: order.balance_due,
});

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
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const authHeader = req.headers.get('authorization');
    const user = await verifyAuth(authHeader, supabaseUrl, supabaseAnonKey);
    const origin = req.headers.get('origin');

    let parsedData: any;
    try {
      parsedData = JSON.parse(await req.text());
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid JSON in request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const {
      paymentIntentId,
      orderId: requestedOrderId,
      fallbackMode = false,
      backupData,
      skipDbInsert = false,
    }: { paymentIntentId?: string; orderId?: string; fallbackMode?: boolean; backupData?: CheckoutBackupV2; skipDbInsert?: boolean } = parsedData;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    let verificationResult: any = {
      success: false,
      paymentVerified: false,
      verification_method: 'unknown',
      used_fallback: false,
      orderId: requestedOrderId,
      sessionId: null as string | null,
      paymentIntentId: null as string | null,
      error: null as string | null,
      isAuthorized: false,
    };

    let stripeSession: any = null;
    let isCheckoutSession = false;

    // ─── Primary verification: Stripe ───
    if (paymentIntentId && !fallbackMode) {
      try {
        const { mode, secretKey: stripeSecretKey } = paymentIntentId.startsWith('cs_')
          ? resolveStripeModeForSessionId(paymentIntentId)
          : resolveStripeModeForOrigin(origin);

        if (!stripeSecretKey) {
          throw new Error(`No Stripe secret key configured for mode "${mode}"`);
        }
        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

        let stripeObject: any;
        if (paymentIntentId.startsWith('cs_')) {
          stripeObject = await stripe.checkout.sessions.retrieve(paymentIntentId);
          isCheckoutSession = true;
          stripeSession = stripeObject;
        } else if (paymentIntentId.startsWith('pi_')) {
          stripeObject = await stripe.paymentIntents.retrieve(paymentIntentId);
        } else {
          throw new Error(`Unknown payment identifier format: ${paymentIntentId}`);
        }

        if (user && isCheckoutSession) {
          if (stripeObject.customer_email !== user.email) {
            return new Response(
              JSON.stringify({ success: false, error: "Payment does not belong to authenticated user" }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
            );
          }
        }

        let paymentSuccess = false;
        let isAuthorized = false;
        if (isCheckoutSession) {
          paymentSuccess = stripeObject.status === 'complete' && stripeObject.payment_status === 'paid';
          verificationResult.sessionId = stripeObject.id;
          verificationResult.paymentIntentId = stripeObject.payment_intent;
        } else {
          paymentSuccess = stripeObject.status === 'succeeded';
          isAuthorized = stripeObject.status === 'requires_capture';
          verificationResult.paymentIntentId = stripeObject.id;
        }

        if (isCheckoutSession && stripeObject.payment_intent) {
          try {
            const paymentIntent = await stripe.paymentIntents.retrieve(stripeObject.payment_intent);
            isAuthorized = paymentIntent.status === 'requires_capture';
          } catch (piError) {
            console.warn('verify-payment-v2: failed to retrieve payment intent from checkout session:', piError);
          }
        }

        if (paymentSuccess || isAuthorized) {
          verificationResult.success = true;
          verificationResult.paymentVerified = true;
          verificationResult.verification_method = 'stripe_verified';
          verificationResult.isAuthorized = isAuthorized;
        } else {
          verificationResult.error = `Payment not successful. Status: ${stripeObject.status}`;
        }
      } catch (stripeError: any) {
        console.error('verify-payment-v2: Stripe verification error:', stripeError);
        verificationResult.error = `Stripe verification failed: ${stripeError.message}`;
      }
    }

    // ─── Fallback verification (no Stripe id, or Stripe call failed) — same trust model as v1:
    // there is no Stripe session to bind against here at all, so this path stays unbound in v2
    // too (not a new regression; see live-checkout-v2.md). ───
    if ((fallbackMode || !verificationResult.paymentVerified) && backupData) {
      if (backupData.items && Array.isArray(backupData.items) && backupData.items.length > 0) {
        if (user && backupData.customerInfo?.email !== user.email) {
          return new Response(
            JSON.stringify({ success: false, error: "Backup data does not match authenticated user" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        }
        if (!user && !backupData.customerInfo?.email) {
          return new Response(
            JSON.stringify({ success: false, error: "Guest checkout requires customer email in backup data" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }

        verificationResult.success = true;
        verificationResult.paymentVerified = true;
        verificationResult.verification_method = 'fallback';
        verificationResult.used_fallback = true;
        verificationResult.orderId = backupData.orderId;
        verificationResult.error = null;

        if (paymentIntentId) {
          if (paymentIntentId.startsWith('cs_')) verificationResult.sessionId = paymentIntentId;
          else if (paymentIntentId.startsWith('pi_')) verificationResult.paymentIntentId = paymentIntentId;
        }
      } else {
        verificationResult.error = 'Invalid backup data: missing or empty items';
      }
    }

    if (skipDbInsert) {
      return new Response(JSON.stringify(verificationResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (!verificationResult.success) {
      return new Response(JSON.stringify(verificationResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const verificationInfo = {
      paymentVerified: verificationResult.paymentVerified,
      isAuthorized: verificationResult.isAuthorized,
      usedFallback: verificationResult.used_fallback,
    };

    // ─── Idempotency: has this stripe_session_id (or, for a direct pi_ retrieval, payment
    // intent id) already been converted into order rows? ───
    const idempotencyKeyColumn = verificationResult.sessionId ? 'stripe_session_id' : 'stripe_payment_intent_id';
    const idempotencyKeyValue = verificationResult.sessionId || verificationResult.paymentIntentId;
    let existingRows: any[] = [];
    if (idempotencyKeyValue) {
      const { data: existing, error: existingError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq(idempotencyKeyColumn, idempotencyKeyValue);
      if (existingError) {
        console.error('verify-payment-v2: idempotency lookup failed:', existingError.message);
      } else {
        existingRows = existing ?? [];
      }
    }
    const idempotency = decideIdempotency(existingRows);
    if (idempotency.alreadyProcessed) {
      const orders = idempotency.rows.map(transformRowForResponse);
      return new Response(
        JSON.stringify({
          success: true,
          alreadyProcessed: true,
          payment_status: idempotency.rows[0]?.status,
          orderId: idempotency.rows[0]?.order_id,
          orders,
          customer_email: idempotency.rows[0]?.delivery_email || idempotency.rows[0]?.billing_email,
          customer_name: idempotency.rows[0]?.delivery_name || idempotency.rows[0]?.billing_name,
          payment_intent_id: verificationResult.paymentIntentId,
          total_amount: idempotency.rows.reduce((sum: number, r: any) => sum + (r.total_price || 0), 0),
          timestamp: new Date().toISOString(),
          verification_method: verificationResult.verification_method,
          used_fallback: verificationResult.used_fallback,
          user_type: user ? 'authenticated' : 'guest',
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    const origin_ = isCheckoutSession ? classifySessionOrigin(stripeSession?.metadata ?? null) : { kind: 'unrecognized' as const };

    // ─── CASE A: a real checkout-v2 session (create-auth-hold-v2) ───
    if (origin_.kind === 'checkout-v2') {
      const parsed = parseCheckoutV2Metadata(stripeSession?.metadata ?? null);
      if (!parsed.ok) {
        verificationResult.error = `checkout-v2 session metadata invalid: ${parsed.error}`;
        return new Response(JSON.stringify(verificationResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      const meta = parsed.data;
      const expectedTotalCents = Number(meta.expectedTotalCents);
      const binding = evaluateBinding(meta.orderId, requestedOrderId, stripeSession?.amount_total, expectedTotalCents);
      const reviewRequired = !binding.ok;
      const isDepositPayment = meta.depositOption === 'true';
      const status: OrderStatus = computeOrderStatusWithReview(verificationInfo, isDepositPayment, reviewRequired);

      if (!backupData) {
        verificationResult.error = 'No backup data available to create order rows.';
        return new Response(JSON.stringify(verificationResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
        });
      }

      const billingEmail = user?.email || backupData.customerInfo?.email || 'guest@mygravelguy.com';
      const billingName = backupData.customerInfo?.name || 'Guest User';
      const couponDiscount = backupData.couponInfo?.applied ? backupData.couponInfo.discount : 0;
      const couponCode = backupData.couponInfo?.applied ? backupData.couponInfo.code : null;
      // Money already changed hands under the session's REAL orderId — always insert under
      // meta.orderId (never the client-requested one) so a mismatched request can't attach a
      // review_required row to an unrelated order id it doesn't actually own.
      const insertOrderId = meta.orderId;

      const rows = buildFreshOrderRecords({
        orderId: insertOrderId,
        items: backupData.items as BackupItem[],
        status,
        stripeSessionId: verificationResult.sessionId,
        stripePaymentIntentId: verificationResult.paymentIntentId,
        billingName,
        billingEmail,
        couponCode,
        couponDiscount,
        depositOption: isDepositPayment,
        utmData: backupData.utmData,
      }).map((row) => (reviewRequired ? { ...row, notes: binding.reason ?? 'Binding check failed.' } : row));

      const { data: inserted, error: insertError } = await supabaseAdmin.from('orders').insert(rows).select();
      if (insertError) {
        console.error('verify-payment-v2: order insert failed:', insertError.message);
        verificationResult.error = 'Database insertion failed';
        return new Response(JSON.stringify(verificationResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
        });
      }

      const orders = (inserted ?? []).map(transformRowForResponse);
      const totalAmount = (inserted ?? []).reduce((sum: number, r: any) => sum + (r.total_price || 0), 0);

      if (reviewRequired) {
        await supabaseAdmin.functions.invoke('send-email', {
          body: {
            to: INTERNAL_NOTIFICATION_EMAIL,
            subject: buildReviewRequiredAlertSubject(insertOrderId),
            html: buildReviewRequiredAlertHtml({
              orderId: insertOrderId,
              reason: binding.reason ?? 'unknown',
              sessionId: verificationResult.sessionId,
            }),
            type: 'internal_notification',
          },
        }).catch((e: unknown) => console.error('verify-payment-v2: review-required alert email failed:', e));
      } else {
        await sendOrderEmails(supabaseAdmin, insertOrderId, inserted ?? [], billingEmail, billingName, {
          couponInfo: couponCode ? { code: couponCode, discount: couponDiscount } : null,
          isDepositPayment,
          depositAmount: inserted?.[0]?.deposit_amount ?? undefined,
          balanceDue: inserted?.[0]?.balance_due ?? undefined,
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          alreadyProcessed: false,
          payment_status: status,
          orderId: insertOrderId,
          orders,
          customer_email: billingEmail,
          customer_name: billingName,
          payment_intent_id: verificationResult.paymentIntentId,
          total_amount: totalAmount,
          timestamp: new Date().toISOString(),
          verification_method: verificationResult.verification_method,
          used_fallback: verificationResult.used_fallback,
          user_type: user ? 'authenticated' : 'guest',
          review_required: reviewRequired,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ─── CASE B: quote conversion (create-quote-checkout, unmodified) ───
    if (origin_.kind === 'quote-conversion') {
      const quoteId = origin_.quoteId;
      const { data: quoteRows, error: quoteError } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('order_id', quoteId)
        .eq('status', 'Quote');

      if (quoteError || !quoteRows || quoteRows.length === 0) {
        verificationResult.error = 'Quote not found or already converted.';
        return new Response(JSON.stringify(verificationResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
        });
      }

      const expectedTotalCents = Math.round(quoteRows.reduce((sum: number, r: any) => sum + (r.total_price || 0), 0) * 100);
      const binding = evaluateBinding(quoteId, requestedOrderId, stripeSession?.amount_total, expectedTotalCents);
      const reviewRequired = !binding.ok;
      const status: OrderStatus = computeOrderStatusWithReview(verificationInfo, false, reviewRequired);
      const orderIdFromQuote = quoteId.replace(/^QUOTE-/, 'ORDER-');

      const update = buildQuoteConversionUpdate({
        orderIdFromQuote,
        status,
        stripeSessionId: verificationResult.sessionId,
        stripePaymentIntentId: verificationResult.paymentIntentId,
        utmData: backupData?.utmData,
      });
      const updatePayload: Record<string, unknown> = { ...update };
      if (reviewRequired) updatePayload.notes = binding.reason ?? 'Binding check failed.';

      const { data: updated, error: updateError } = await supabaseAdmin
        .from('orders')
        .update(updatePayload)
        .eq('order_id', quoteId)
        .eq('status', 'Quote')
        .select();

      if (updateError || !updated || updated.length === 0) {
        console.error('verify-payment-v2: quote conversion update failed:', updateError?.message);
        verificationResult.error = 'Quote conversion failed';
        return new Response(JSON.stringify(verificationResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
        });
      }

      const billingEmail = updated[0].delivery_email || updated[0].billing_email || 'guest@mygravelguy.com';
      const billingName = updated[0].delivery_name || updated[0].billing_name || 'Valued Customer';
      const orders = updated.map(transformRowForResponse);
      const totalAmount = updated.reduce((sum: number, r: any) => sum + (r.total_price || 0), 0);

      if (reviewRequired) {
        await supabaseAdmin.functions.invoke('send-email', {
          body: {
            to: INTERNAL_NOTIFICATION_EMAIL,
            subject: buildReviewRequiredAlertSubject(orderIdFromQuote),
            html: buildReviewRequiredAlertHtml({
              orderId: orderIdFromQuote,
              reason: binding.reason ?? 'unknown',
              sessionId: verificationResult.sessionId,
            }),
            type: 'internal_notification',
          },
        }).catch((e: unknown) => console.error('verify-payment-v2: review-required alert email failed:', e));
      } else {
        await sendOrderEmails(supabaseAdmin, orderIdFromQuote, updated, billingEmail, billingName, {});
      }

      return new Response(
        JSON.stringify({
          success: true,
          alreadyProcessed: false,
          payment_status: status,
          orderId: orderIdFromQuote,
          orders,
          customer_email: billingEmail,
          customer_name: billingName,
          payment_intent_id: verificationResult.paymentIntentId,
          total_amount: totalAmount,
          timestamp: new Date().toISOString(),
          verification_method: verificationResult.verification_method,
          used_fallback: verificationResult.used_fallback,
          user_type: user ? 'authenticated' : 'guest',
          review_required: reviewRequired,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ─── CASE C: unrecognized session origin (landing page's `create-payment`, or fallbackMode
    // with no Stripe session at all) — no server-controlled artifact exists to bind against, so
    // this stays v1-equivalent: trust the client-supplied orderId/backupData, no binding, but
    // still gets the F2 status fix, idempotency, and server-side email sending. See
    // src/services/checkoutV2/binding.ts's module doc + live-checkout-v2.md for why this gap
    // exists and what would close it. ───
    if (!backupData) {
      verificationResult.error = 'No backup data available to create order rows.';
      return new Response(JSON.stringify(verificationResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const fallbackOrderId = verificationResult.orderId || requestedOrderId || backupData.orderId;
    const billingEmail = user?.email || backupData.customerInfo?.email || 'guest@mygravelguy.com';
    const billingName = backupData.customerInfo?.name || 'Guest User';
    const couponDiscount = backupData.couponInfo?.applied ? backupData.couponInfo.discount : 0;
    const couponCode = backupData.couponInfo?.applied ? backupData.couponInfo.code : null;
    const isDepositPayment = !!backupData.depositOption;
    const status: OrderStatus = computeOrderStatusWithReview(verificationInfo, isDepositPayment, false);

    const rows = buildFreshOrderRecords({
      orderId: fallbackOrderId,
      items: backupData.items as BackupItem[],
      status,
      stripeSessionId: verificationResult.sessionId,
      stripePaymentIntentId: verificationResult.paymentIntentId,
      billingName,
      billingEmail,
      couponCode,
      couponDiscount,
      depositOption: isDepositPayment,
      utmData: backupData.utmData,
    });

    const { data: inserted, error: insertError } = await supabaseAdmin.from('orders').insert(rows).select();
    if (insertError) {
      console.error('verify-payment-v2: order insert failed (unrecognized origin):', insertError.message);
      verificationResult.error = 'Database insertion failed';
      return new Response(JSON.stringify(verificationResult), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200,
      });
    }

    const orders = (inserted ?? []).map(transformRowForResponse);
    const totalAmount = (inserted ?? []).reduce((sum: number, r: any) => sum + (r.total_price || 0), 0);

    await sendOrderEmails(supabaseAdmin, fallbackOrderId, inserted ?? [], billingEmail, billingName, {
      couponInfo: couponCode ? { code: couponCode, discount: couponDiscount } : null,
      isDepositPayment,
      depositAmount: inserted?.[0]?.deposit_amount ?? undefined,
      balanceDue: inserted?.[0]?.balance_due ?? undefined,
    });

    return new Response(
      JSON.stringify({
        success: true,
        alreadyProcessed: false,
        payment_status: status,
        orderId: fallbackOrderId,
        orders,
        customer_email: billingEmail,
        customer_name: billingName,
        payment_intent_id: verificationResult.paymentIntentId,
        total_amount: totalAmount,
        timestamp: new Date().toISOString(),
        verification_method: verificationResult.verification_method,
        used_fallback: verificationResult.used_fallback,
        user_type: user ? 'authenticated' : 'guest',
        review_required: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error('verify-payment-v2: unhandled error:', error);
    return new Response(
      JSON.stringify({ success: false, error: "Payment verification failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

/** Resolves product names (best-effort, matches PaymentSuccess.tsx's isUUID -> getProductById
 * fallback behavior) and sends the customer confirmation + internal notification emails via the
 * existing `send-email` function, using the exact templates src/utils/emailTemplates.ts already
 * ships (re-exported through the checkout-v2 bundle), with every field escaped
 * (src/services/checkoutV2/emailPayload.ts). Runs only on first creation — never on an
 * alreadyProcessed idempotent replay. */
async function sendOrderEmails(
  supabaseAdmin: ReturnType<typeof createClient>,
  orderId: string,
  rows: any[],
  customerEmail: string,
  customerName: string,
  opts: {
    couponInfo?: { code: string; discount: number } | null;
    isDepositPayment?: boolean;
    depositAmount?: number;
    balanceDue?: number;
  },
) {
  if (!rows.length) return;
  try {
    const productIds = [...new Set(rows.map((r) => r.product_id).filter((id): id is string => !!id && isUUID(id)))];
    const nameById = new Map<string, string>();
    if (productIds.length > 0) {
      const { data: products } = await supabaseAdmin.from('products').select('id, name').in('id', productIds);
      for (const p of products ?? []) nameById.set(p.id, p.name);
    }

    const emailRows = rows.map((r) => ({
      product_name: nameById.get(r.product_id) || r.product_id,
      quantity: r.quantity,
      total_price: r.total_price,
      delivery_date: r.delivery_date,
      delivery_street: r.delivery_street,
      delivery_city: r.delivery_city,
      delivery_state: r.delivery_state,
      delivery_zip: r.delivery_zip,
      delivery_name: r.delivery_name,
      delivery_email: r.delivery_email,
      delivery_phone: r.delivery_phone,
      delivery_time_preference: r.delivery_time_preference,
      delivery_instructions: r.delivery_instructions,
    }));

    const orderEmailData = buildOrderEmailData({
      orderId,
      rows: emailRows,
      customerEmail,
      customerName,
      couponInfo: opts.couponInfo ?? null,
      isDepositPayment: opts.isDepositPayment,
      depositAmount: opts.depositAmount,
      balanceDue: opts.balanceDue,
    });

    await Promise.all([
      supabaseAdmin.functions.invoke('send-email', {
        body: {
          to: customerEmail,
          subject: buildCustomerEmailSubject(orderId),
          html: generateCustomerConfirmationEmail(orderEmailData),
          type: 'customer_confirmation',
          orderData: orderEmailData,
        },
      }),
      supabaseAdmin.functions.invoke('send-email', {
        body: {
          to: INTERNAL_NOTIFICATION_EMAIL,
          subject: buildInternalEmailSubject(customerName),
          html: generateInternalNotificationEmail(orderEmailData),
          type: 'internal_notification',
          orderData: orderEmailData,
        },
      }),
    ]);
  } catch (emailError) {
    console.error('verify-payment-v2: sendOrderEmails failed:', emailError);
  }
}
