
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkRateLimit, getClientId } from "./rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  // Rate limiting check
  const clientId = getClientId(req);
  const rateLimitResult = await checkRateLimit('create-payment', clientId);
  
  if (!rateLimitResult.allowed) {
    console.log('Rate limit exceeded for create-payment:', clientId);
    return new Response(
      JSON.stringify({ 
        error: "Too many requests. Please try again later.",
        rateLimitExceeded: true
      }),
      {
        headers: { 
          ...corsHeaders, 
          ...rateLimitResult.rateLimitHeaders,
          "Content-Type": "application/json" 
        },
        status: 429,
      }
    );
  }

  try {
    console.log('=== GUEST CHECKOUT CREATE-PAYMENT START ===');
    
    // Parse request body with better error handling
    const requestBody = await req.text();
    console.log('Raw request body received:', requestBody);
    
    let parsedData;
    try {
      parsedData = JSON.parse(requestBody);
      console.log('Successfully parsed JSON data');
    } catch (parseError) {
      console.error('JSON parsing error:', parseError.message);
      console.error('Raw body that failed to parse:', requestBody);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          headers: { 
            ...corsHeaders, 
            ...rateLimitResult.rateLimitHeaders,
            "Content-Type": "application/json" 
          },
          status: 400,
        }
      );
    }
    
    const { items, orderId, customerInfo } = parsedData;
    console.log('Extracted data:', { 
      itemsCount: items?.length, 
      orderId, 
      customerInfo: customerInfo ? 'present' : 'missing'
    });
    
    // Validate Stripe secret key first
    const stripeKey = Deno.env.get("stripe");
    console.log('Stripe key check:', stripeKey ? 'present' : 'MISSING');
    if (!stripeKey) {
      console.error('CRITICAL: Stripe secret key is missing from environment');
      return new Response(
        JSON.stringify({ 
          error: "Payment service configuration error - Stripe key missing" 
        }),
        {
          headers: { 
            ...corsHeaders, 
            ...rateLimitResult.rateLimitHeaders,
            "Content-Type": "application/json" 
          },
          status: 500,
        }
      );
    }
    
    console.log('Initializing Stripe with key...');
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    console.log('Stripe initialized successfully');

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid items array:', items);
      return new Response(
        JSON.stringify({ error: "Invalid or empty items array" }),
        {
          headers: { 
            ...corsHeaders, 
            ...rateLimitResult.rateLimitHeaders,
            "Content-Type": "application/json" 
          },
          status: 400,
        }
      );
    }

    console.log('Processing customer information...');
    // Extract customer information for guest checkout
    let customerEmail = customerInfo?.email;
    let customerName = customerInfo?.name;
    
    // Fallback: try to get customer info from items
    if (!customerEmail || !customerName) {
      console.log('Fallback: extracting customer info from items metadata');
      for (const item of items) {
        if (item.metadata?.contactEmail && !customerEmail) {
          customerEmail = item.metadata.contactEmail;
        }
        if (item.metadata?.contactName && !customerName) {
          customerName = item.metadata.contactName;
        }
      }
    }
    
    // Final fallback for guest checkout
    if (!customerEmail) {
      customerEmail = 'guest@mygravelguy.com';
    }
    if (!customerName) {
      customerName = 'Guest Customer';
    }
    
    console.log('Customer info resolved:', { customerEmail, customerName });

    // Validate and transform each item
    console.log('Validating and transforming items...');
    const validatedLineItems = [];
    let orderMetadata = { 
      order_id: orderId || `ORDER-${Date.now()}`,
      customer_email: customerEmail,
      customer_name: customerName,
      is_guest: 'true'
    };
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      console.log(`Processing item ${i + 1}:`, { 
        name: item.name, 
        price: item.price, 
        quantity: item.quantity 
      });
      
      try {
        if (!item.name || typeof item.price !== 'number' || !item.quantity) {
          console.error(`Invalid item at index ${i}:`, item);
          throw new Error(`Invalid item at index ${i}: missing required fields`);
        }
        
        const cleanName = String(item.name).replace(/['"\\]/g, '');
        
        // Process image URL safely
        let imageArray = [];
        if (item.image) {
          try {
            new URL(item.image);
            imageArray = [item.image];
            console.log(`Valid image URL for item ${i + 1}`);
          } catch (urlError) {
            console.warn(`Invalid image URL for item ${i}: ${item.image}`);
          }
        }

        // Add metadata for order tracking
        orderMetadata[`item_${i+1}_product_id`] = String(item.id || '');
        orderMetadata[`item_${i+1}_quantity_tons`] = String(item.quantity || 0);
        orderMetadata[`item_${i+1}_unit_price`] = String(item.price || 0);
        orderMetadata[`item_${i+1}_total_price`] = String((item.price * item.quantity) || 0);

        // Add delivery metadata if available
        if (item.metadata) {
          if (item.metadata.deliveryDate) {
            orderMetadata[`item_${i+1}_delivery_date`] = item.metadata.deliveryDate;
          }
          
          if (item.metadata.deliveryAddress) {
            try {
              const address = typeof item.metadata.deliveryAddress === 'string' ? 
                JSON.parse(item.metadata.deliveryAddress) : item.metadata.deliveryAddress;
              
              orderMetadata[`item_${i+1}_delivery_address_street`] = address.street || '';
              orderMetadata[`item_${i+1}_delivery_address_city`] = address.city || '';
              orderMetadata[`item_${i+1}_delivery_address_state`] = address.state || '';
              orderMetadata[`item_${i+1}_delivery_address_zip`] = address.zip || '';
            } catch (addressError) {
              console.warn(`Failed to parse delivery address for item ${i}:`, addressError);
            }
          }
        }
        
        const unitAmount = Math.max(50, Math.round(item.price * 100));
        console.log(`Item ${i + 1} unit amount: ${unitAmount} cents`);
        
        validatedLineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: cleanName,
              images: imageArray,
            },
            unit_amount: unitAmount,
          },
          quantity: item.quantity,
        });
        
        console.log(`Item ${i + 1} processed successfully`);
      } catch (validationError) {
        console.error(`Item validation error for item ${i}:`, validationError);
        throw new Error(`Item validation error: ${validationError.message}`);
      }
    }

    console.log('Creating Stripe checkout session...');
    console.log('Line items count:', validatedLineItems.length);
    console.log('Order metadata keys:', Object.keys(orderMetadata).length);

    // Get origin for success/cancel URLs
    const origin = req.headers.get("origin") || "http://localhost:3000";
    console.log('Using origin for URLs:', origin);

    // Create Stripe checkout session for guest
    console.log('Calling Stripe API to create checkout session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        "card",
        "klarna",
        "afterpay_clearpay",
        "affirm"
      ],
      line_items: validatedLineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?payment_intent={CHECKOUT_SESSION_ID}&order_id=${orderMetadata.order_id}`,
      cancel_url: `${origin}/cart`,
      metadata: orderMetadata,
      payment_intent_data: {
        metadata: orderMetadata
      },
      customer_email: customerEmail,
      billing_address_collection: 'required',
      customer_creation: 'always',
      payment_method_options: {
        klarna: {
          preferred_locale: "en-US"
        },
        afterpay_clearpay: {
          reference: orderMetadata.order_id
        },
        affirm: {
          preferred_locale: "en-US"
        }
      }
    });

    console.log('Stripe checkout session created successfully:', session.id);
    console.log('Session URL:', session.url);
    console.log('=== GUEST CHECKOUT CREATE-PAYMENT SUCCESS ===');

    return new Response(
      JSON.stringify({ 
        url: session.url, 
        orderId: orderMetadata.order_id,
        customerType: 'guest'
      }),
      {
        headers: { 
          ...corsHeaders, 
          ...rateLimitResult.rateLimitHeaders,
          "Content-Type": "application/json" 
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("=== GUEST CHECKOUT ERROR ===");
    console.error("Error type:", error.constructor.name);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    // Check if it's a Stripe-specific error
    if (error.type) {
      console.error("Stripe error type:", error.type);
      console.error("Stripe error code:", error.code);
      console.error("Stripe error param:", error.param);
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || "An error occurred during checkout",
        details: "Guest checkout processing failed",
        errorType: error.constructor.name
      }),
      {
        headers: { 
          ...corsHeaders, 
          ...rateLimitResult.rateLimitHeaders,
          "Content-Type": "application/json" 
        },
        status: 500,
      }
    );
  }
});
