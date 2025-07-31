import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Function version for deployment tracking
const FUNCTION_VERSION = "v1.1.0-metadata-fix";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-QUOTE-CHECKOUT-${FUNCTION_VERSION}] ${step}${detailsStr}`);
};

// Helper to validate metadata size for Stripe (500 char limit)
const validateMetadataSize = (metadata: Record<string, string>, context: string) => {
  for (const [key, value] of Object.entries(metadata)) {
    if (value && value.length > 500) {
      logStep(`WARNING: ${context} metadata key '${key}' exceeds 500 chars`, { 
        keyLength: value.length, 
        truncated: value.substring(0, 50) + '...' 
      });
      throw new Error(`Metadata key '${key}' exceeds Stripe's 500 character limit (${value.length} chars)`);
    }
  }
  logStep(`Metadata validation passed for ${context}`, { keys: Object.keys(metadata) });
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

    // Fetch quote details from database (use pattern matching to get all related items)
    const { data: quoteItems, error: quoteError } = await supabaseClient
      .from("orders")
      .select("*")
      .like("order_id", `${quoteId}%`)
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
    
    // Prepare backup data for localStorage (similar to cart checkout)
    const quoteBackupData = {
      orderId: quoteId,
      items: quoteItems.map(item => ({
        id: item.product_id,
        name: productNameMap.get(item.product_id)?.name || item.product_id,
        category: 'aggregates',
        price: item.unit_price,
        quantity: item.quantity,
        tons: item.quantity,
        deliveryDate: item.delivery_date,
        deliveryAddress: {
          street: item.delivery_street || '',
          city: item.delivery_city || '',
          state: item.delivery_state || '',
          zip: item.delivery_zip || ''
        },
        contactInfo: {
          name: item.delivery_name || '',
          email: item.delivery_email || '',
          phone: item.delivery_phone || ''
        },
        deliveryTimePreference: item.delivery_time_preference,
        deliveryInstructions: item.delivery_instructions,
        metadata: {
          unit: item.unit,
          unitPrice: item.unit_price,
          totalPrice: item.total_price,
          supplierCharges: item.supplier_charges,
          zipAdjust: item.zip_adjust
        }
      })),
      total: quoteItems.reduce((sum, item) => sum + item.total_price, 0),
      timestamp: Date.now(),
      cartItems: [], // Empty for quotes
      customerInfo: {
        email: customerEmail,
        name: quoteItems[0].delivery_name || quoteItems[0].billing_name || ''
      },
      isQuoteConversion: true,
      originalQuoteId: quoteId
    };
    
    logStep("Quote backup data prepared", { itemCount: quoteBackupData.items.length, total: quoteBackupData.total });

    // Prepare and validate metadata for Stripe
    const sessionMetadata = {
      quote_id: quoteId,
      type: "quote_conversion"
    };
    
    const paymentIntentMetadata = {
      quote_id: quoteId,
      type: "quote_conversion"
    };

    // Validate metadata size before sending to Stripe
    validateMetadataSize(sessionMetadata, "session");
    validateMetadataSize(paymentIntentMetadata, "payment_intent");

    logStep("Creating Stripe checkout session", { 
      customerId, 
      customerEmail: customerId ? "existing" : customerEmail,
      lineItemCount: lineItems.length 
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: lineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?quote_id=${quoteId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/quote-checkout/${quoteId}`,
      metadata: sessionMetadata,
      payment_intent_data: {
        metadata: paymentIntentMetadata
      }
    });

    logStep("Stripe checkout session created", { sessionId: session.id, url: session.url });

    // Return both the session URL and the backup data for localStorage
    return new Response(JSON.stringify({ 
      url: session.url, 
      sessionId: session.id,
      backupData: quoteBackupData
    }), {
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