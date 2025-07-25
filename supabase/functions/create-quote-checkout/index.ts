import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-QUOTE-CHECKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    // Use service role key to access quote data
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { quoteId } = await req.json();
    if (!quoteId) throw new Error("Quote ID is required");
    logStep("Quote ID received", { quoteId });

    // Fetch quote details from database
    const { data: quoteItems, error: quoteError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("order_id", quoteId)
      .eq("status", "quote");

    if (quoteError) throw new Error(`Failed to fetch quote: ${quoteError.message}`);
    if (!quoteItems || quoteItems.length === 0) throw new Error("Quote not found or not in quote status");
    logStep("Quote data retrieved", { itemCount: quoteItems.length });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists in Stripe
    const customerEmail = quoteItems[0].delivery_email || quoteItems[0].billing_email;
    if (!customerEmail) throw new Error("No customer email found for quote");

    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Existing Stripe customer found", { customerId });
    }

    // Format line items for Stripe
    const lineItems = quoteItems.map(item => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: `${item.product_id} (${item.quantity} ${item.unit})`,
          description: `Delivery to: ${item.delivery_street}, ${item.delivery_city}, ${item.delivery_state} ${item.delivery_zip}`,
        },
        unit_amount: Math.round(item.unit_price * 100), // Convert to cents
      },
      quantity: 1, // We handle quantity in the product name
    }));

    logStep("Line items formatted", { lineItemsCount: lineItems.length });

    const origin = req.headers.get("origin") || "https://easternbuilding.supply";
    
    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?quote_id=${quoteId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/quote-checkout/${quoteId}`,
      metadata: {
        quote_id: quoteId,
        type: "quote_conversion"
      },
      payment_intent_data: {
        metadata: {
          quote_id: quoteId,
          type: "quote_conversion"
        }
      }
    });

    logStep("Stripe checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-quote-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});