
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Enhanced debug logging function
const debugLog = (stage: string, data?: any) => {
  console.log(`[DEBUG-${stage}]`, data ? JSON.stringify(data, null, 2) : '');
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    debugLog('FUNCTION_START', { method: req.method });
    
    // Parse request body with enhanced error handling
    const requestBody = await req.text();
    debugLog('RAW_REQUEST_BODY', { body: requestBody, length: requestBody.length });
    
    let parsedData;
    try {
      parsedData = JSON.parse(requestBody);
      debugLog('PARSED_DATA', { 
        hasItems: !!parsedData.items, 
        itemsLength: parsedData.items?.length || 0,
        hasOrderId: !!parsedData.orderId 
      });
    } catch (parseError) {
      debugLog('JSON_PARSE_ERROR', { error: parseError.message, body: requestBody });
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body", details: parseError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    const { items, orderId } = parsedData;
    
    // Validate environment variables
    const stripeKey = Deno.env.get("stripe");
    if (!stripeKey) {
      debugLog('STRIPE_KEY_ERROR', { message: 'Environment variable "stripe" not found' });
      return new Response(
        JSON.stringify({ error: "Stripe configuration missing" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    debugLog('STRIPE_KEY_CHECK', { hasKey: !!stripeKey, keyLength: stripeKey.length });
    
    // Initialize Stripe with error handling
    let stripe;
    try {
      stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
      debugLog('STRIPE_INIT', { success: true });
    } catch (stripeError) {
      debugLog('STRIPE_INIT_ERROR', { error: stripeError.message });
      return new Response(
        JSON.stringify({ error: "Stripe initialization failed", details: stripeError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Validate input data
    if (!items || !Array.isArray(items) || items.length === 0) {
      debugLog('ITEMS_VALIDATION_ERROR', { items, type: typeof items, isArray: Array.isArray(items) });
      return new Response(
        JSON.stringify({ error: "Invalid or empty items array" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Generate order ID
    const finalOrderId = orderId || `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    debugLog('ORDER_ID', { orderId: finalOrderId });

    // Process line items with minimal metadata (temporarily)
    const validatedLineItems = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      debugLog(`ITEM_${i}_PROCESSING`, { 
        name: item.name, 
        price: item.price, 
        quantity: item.quantity,
        hasMetadata: !!item.metadata 
      });
      
      try {
        // Validate required fields
        if (!item.name || typeof item.price !== 'number' || !item.quantity) {
          throw new Error(`Invalid item at index ${i}: missing required fields`);
        }
        
        // Clean name for Stripe
        const cleanName = String(item.name).replace(/['"\\]/g, '').substring(0, 50);
        
        // Validate price and quantity
        const unitAmount = Math.round(item.price * 100);
        const quantity = parseInt(item.quantity);
        
        if (unitAmount < 50) { // Stripe minimum $0.50
          throw new Error(`Price too low for item ${i}: $${item.price}`);
        }
        
        if (quantity < 1 || quantity > 999999) {
          throw new Error(`Invalid quantity for item ${i}: ${quantity}`);
        }
        
        // Process image with validation
        let imageArray = [];
        if (item.image) {
          try {
            new URL(item.image); // Validate URL format
            imageArray = [item.image];
          } catch (urlError) {
            debugLog(`ITEM_${i}_IMAGE_ERROR`, { url: item.image, error: urlError.message });
          }
        }
        
        validatedLineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: cleanName,
              images: imageArray,
            },
            unit_amount: unitAmount,
          },
          quantity: quantity,
        });
        
        debugLog(`ITEM_${i}_SUCCESS`, { 
          name: cleanName, 
          unitAmount, 
          quantity,
          hasImage: imageArray.length > 0 
        });
      } catch (itemError) {
        debugLog(`ITEM_${i}_ERROR`, { error: itemError.message, item });
        return new Response(
          JSON.stringify({ 
            error: `Item validation error: ${itemError.message}`,
            itemIndex: i 
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
      }
    }

    debugLog('LINE_ITEMS_VALIDATED', { count: validatedLineItems.length });

    // Get origin for URLs
    const origin = req.headers.get("origin") || "http://localhost:3000";
    debugLog('ORIGIN', { origin });

    // Create Stripe checkout session with simplified configuration
    debugLog('STRIPE_SESSION_CREATE_START');
    
    try {
      const sessionConfig = {
        payment_method_types: ["card"], // Start with just cards
        line_items: validatedLineItems,
        mode: "payment",
        success_url: `${origin}/payment-success?payment_intent={CHECKOUT_SESSION_ID}&order_id=${finalOrderId}`,
        cancel_url: `${origin}/cart`,
        metadata: { 
          order_id: finalOrderId,
          item_count: String(items.length)
        }, // Minimal metadata
        billing_address_collection: 'required',
        customer_creation: 'always',
      };
      
      debugLog('SESSION_CONFIG', sessionConfig);
      
      const session = await stripe.checkout.sessions.create(sessionConfig);
      
      debugLog('STRIPE_SESSION_SUCCESS', { 
        sessionId: session.id, 
        url: session.url,
        paymentStatus: session.payment_status 
      });

      return new Response(
        JSON.stringify({ 
          url: session.url, 
          orderId: finalOrderId,
          sessionId: session.id
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (stripeSessionError) {
      debugLog('STRIPE_SESSION_ERROR', { 
        error: stripeSessionError.message,
        type: stripeSessionError.type,
        code: stripeSessionError.code,
        decline_code: stripeSessionError.decline_code,
        param: stripeSessionError.param
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to create checkout session",
          details: stripeSessionError.message,
          stripeErrorType: stripeSessionError.type,
          stripeErrorCode: stripeSessionError.code
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
  } catch (error) {
    debugLog('FUNCTION_ERROR', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      type: typeof error
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "Unknown error occurred",
        errorName: error.name,
        timestamp: new Date().toISOString(),
        stage: "general_error"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
