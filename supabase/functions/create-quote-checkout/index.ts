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

    const stripeKey = Deno.env.get("stripe");
    if (!stripeKey) throw new Error("stripe secret key is not set");
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
      .eq("status", "Quote");

    if (quoteError) throw new Error(`Failed to fetch quote: ${quoteError.message}`);
    if (!quoteItems || quoteItems.length === 0) throw new Error("Quote not found or not in quote status");
    logStep("Quote data retrieved", { itemCount: quoteItems.length });

    // Get unique product IDs to fetch product names
    const productIds = [...new Set(quoteItems.map(item => item.product_id))];
    logStep("Fetching product names", { productIds });

    // Fetch product details for name resolution
    const { data: products, error: productsError } = await supabaseClient
      .from("products")
      .select("id, name, short_description")
      .in("id", productIds);

    if (productsError) {
      logStep("Warning: Failed to fetch product names", { error: productsError.message });
    }

    // Create product name mapping
    const productNameMap = new Map();
    if (products) {
      products.forEach(product => {
        productNameMap.set(product.id, {
          name: product.name,
          description: product.short_description
        });
      });
    }
    logStep("Product name mapping created", { mappedProducts: productNameMap.size });

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

    // Format line items for Stripe with resolved product names
    const lineItems = quoteItems.map(item => {
      // Get product name from mapping or fallback to product ID
      const productInfo = productNameMap.get(item.product_id);
      const productName = productInfo?.name || item.product_id;
      const productDescription = productInfo?.description || '';
      
      // Build description with delivery info and product description
      let description = `Delivery to: ${item.delivery_street}, ${item.delivery_city}, ${item.delivery_state} ${item.delivery_zip}`;
      if (productDescription) {
        description = `${productDescription}\n${description}`;
      }
      
      logStep("Creating line item", { 
        productId: item.product_id, 
        productName, 
        totalPrice: item.total_price,
        unitPrice: item.unit_price,
        quantity: item.quantity 
      });

      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: `${productName} (${item.quantity} ${item.unit})`,
            description: description,
          },
          unit_amount: Math.round(item.total_price * 100), // Use total price, not unit price
        },
        quantity: 1, // We handle quantity in the product name and use total_price
      };
    });

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