
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

  try {
    console.log('=== CREATE-PAYMENT FUNCTION START ===');
    
    // Parse request body
    const requestBody = await req.text();
    console.log('Received request body:', requestBody);
    
    let parsedData;
    try {
      parsedData = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError.message);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    const { items, orderId } = parsedData;
    console.log('Parsed items count:', items?.length || 0);
    console.log('Order ID:', orderId);
    
    // Access Stripe secret key and validate it exists
    const stripeKey = Deno.env.get("stripe");
    if (!stripeKey) {
      console.error('Stripe secret key is missing');
      return new Response(
        JSON.stringify({ 
          error: "Stripe secret key not found in environment variables" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid items array:', items);
      return new Response(
        JSON.stringify({ error: "Invalid or empty items array" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Use provided order ID or generate a new one
    const finalOrderId = orderId || `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Final order ID:', finalOrderId);

    // Validate and transform each item with enhanced error handling
    const validatedLineItems = [];
    let orderMetadata = { order_id: finalOrderId };
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        console.log(`Processing item ${i}:`, item);
        
        if (!item.name || typeof item.price !== 'number' || !item.quantity) {
          console.error(`Invalid item at index ${i}:`, item);
          throw new Error(`Invalid item at index ${i}: missing required fields or invalid types`);
        }
        
        // Use a clean name for Stripe (no special chars)
        const cleanName = String(item.name).replace(/['"\\]/g, '');
        
        // Process image URL
        let imageArray = [];
        if (item.image) {
          try {
            // Validate that the image URL is properly formatted
            const url = new URL(item.image);
            imageArray = [item.image];
          } catch (urlError) {
            console.warn(`Invalid image URL for item ${i}: ${item.image}. Skipping image.`);
            // Don't include the image if the URL is invalid, don't throw an error
          }
        }

        // ENHANCED: Better metadata collection with proper validation and fallbacks
        orderMetadata[`item_${i+1}_product_id`] = String(item.id || '');
        orderMetadata[`item_${i+1}_material_category`] = item.materialCategory || item.category || '';
        orderMetadata[`item_${i+1}_quantity_tons`] = String(item.quantity || item.tons || 0);
        orderMetadata[`item_${i+1}_quantity_yards`] = String(item.yards || 0);
        orderMetadata[`item_${i+1}_unit_price`] = String(item.price || 0);
        orderMetadata[`item_${i+1}_total_price`] = String((item.price * item.quantity) || 0);
        orderMetadata[`item_${i+1}_material_size`] = item.materialSize || item.size || '';

        // ENHANCED: Process metadata with better error handling and validation
        if (item.metadata) {
          console.log(`Processing metadata for item ${i}:`, item.metadata);
          
          // Contact information - FIXED: Handle contact info properly
          if (item.metadata.contactName) {
            orderMetadata[`item_${i+1}_contact_name`] = String(item.metadata.contactName).substring(0, 100);
          }
          
          if (item.metadata.contactPhone) {
            orderMetadata[`item_${i+1}_contact_phone`] = String(item.metadata.contactPhone).substring(0, 50);
          }

          if (item.metadata.contactEmail) {
            orderMetadata[`item_${i+1}_contact_email`] = String(item.metadata.contactEmail).substring(0, 100);
          }
          
          // Delivery date
          if (item.metadata.deliveryDate) {
            try {
              const deliveryDate = new Date(item.metadata.deliveryDate);
              if (!isNaN(deliveryDate.getTime())) {
                orderMetadata[`item_${i+1}_delivery_date`] = deliveryDate.toISOString().split('T')[0];
              }
            } catch (dateError) {
              console.warn(`Invalid delivery date for item ${i}:`, item.metadata.deliveryDate);
            }
          }
          
          // Delivery address
          if (item.metadata.deliveryAddress) {
            try {
              const address = typeof item.metadata.deliveryAddress === 'string' ? 
                JSON.parse(item.metadata.deliveryAddress) : item.metadata.deliveryAddress;
              
              if (address && typeof address === 'object') {
                orderMetadata[`item_${i+1}_delivery_address_street`] = String(address.street || '').substring(0, 100);
                orderMetadata[`item_${i+1}_delivery_address_city`] = String(address.city || '').substring(0, 50);
                orderMetadata[`item_${i+1}_delivery_address_state`] = String(address.state || '').substring(0, 20);
                orderMetadata[`item_${i+1}_delivery_address_zip`] = String(address.zip || '').substring(0, 10);
              }
            } catch (addressError) {
              console.warn(`Failed to parse delivery address for item ${i}:`, addressError);
            }
          }
          
          // Delivery preferences
          if (item.metadata.deliveryTimePreference) {
            orderMetadata[`item_${i+1}_delivery_time_preference`] = String(item.metadata.deliveryTimePreference).substring(0, 50);
          }
          
          if (item.metadata.deliveryInstructions) {
            const instructions = String(item.metadata.deliveryInstructions);
            orderMetadata[`item_${i+1}_delivery_instructions`] = 
              instructions.length > 100 ? instructions.substring(0, 97) + '...' : instructions;
          }
        } else {
          console.warn(`No metadata found for item ${i}`);
        }
        
        validatedLineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: cleanName,
              images: imageArray,
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: item.quantity,
        });
        
        console.log(`Successfully processed item ${i}:`, cleanName);
      } catch (validationError) {
        console.error(`Item validation error for item ${i}:`, validationError);
        throw new Error(`Item validation error: ${validationError.message}`);
      }
    }

    console.log('Creating Stripe checkout session with items:', validatedLineItems.length);
    console.log('Order metadata keys:', Object.keys(orderMetadata));

    // Get origin for success/cancel URLs
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create a Stripe checkout session with BNPL payment methods and customer email collection
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        "card",
        "klarna",
        "afterpay_clearpay",
        "affirm"
      ],
      line_items: validatedLineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?payment_intent={CHECKOUT_SESSION_ID}&order_id=${finalOrderId}`,
      cancel_url: `${origin}/cart`,
      metadata: orderMetadata,
      payment_intent_data: {
        metadata: orderMetadata
      },
      // Enable customer email collection
      customer_email: undefined, // Let Stripe prompt for email
      billing_address_collection: 'required',
      customer_creation: 'always',
      // Configure BNPL options
      payment_method_options: {
        klarna: {
          preferred_locale: "en-US"
        },
        afterpay_clearpay: {
          reference: finalOrderId
        },
        affirm: {
          preferred_locale: "en-US"
        }
      }
    });

    console.log('Stripe checkout session created successfully:', session.id);
    console.log('Customer email collection enabled for session');

    console.log('=== CREATE-PAYMENT FUNCTION SUCCESS ===');
    
    // Return the checkout URL
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
  } catch (error) {
    console.error("=== CREATE-PAYMENT FUNCTION ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Full error object:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "A detailed error occurred during the checkout process",
        fullError: error.toString(),
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
