
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
    
    const { items } = parsedData;
    
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

    // Validate and transform each item with detailed error logging
    const validatedLineItems = [];
    let orderMetadata = {};
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
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

        // Add this item's metadata to the order metadata
        if (item.metadata) {
          orderMetadata[`item_${i+1}_id`] = item.id;
          orderMetadata[`item_${i+1}_name`] = cleanName;
          
          if (item.metadata.deliveryDate) {
            orderMetadata[`item_${i+1}_delivery_date`] = item.metadata.deliveryDate;
          }
          
          if (item.metadata.deliveryAddress) {
            const address = JSON.parse(item.metadata.deliveryAddress);
            orderMetadata[`item_${i+1}_address`] = 
              `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
          }
          
          if (item.metadata.contactPhone) {
            orderMetadata[`item_${i+1}_phone`] = item.metadata.contactPhone;
          }
          
          if (item.metadata.deliveryTimePreference) {
            orderMetadata[`item_${i+1}_time_preference`] = item.metadata.deliveryTimePreference;
          }
          
          if (item.metadata.deliveryInstructions) {
            // Truncate long instructions for metadata limits
            const instructions = item.metadata.deliveryInstructions;
            orderMetadata[`item_${i+1}_instructions`] = 
              instructions.length > 100 ? instructions.substring(0, 97) + '...' : instructions;
          }
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
      } catch (validationError) {
        console.error(`Item validation error for item ${i}:`, validationError);
        throw new Error(`Item validation error: ${validationError.message}`);
      }
    }

    console.log('Creating Stripe checkout session with items:', validatedLineItems);
    console.log('Order metadata:', orderMetadata);

    // Get origin for success/cancel URLs
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create a Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: validatedLineItems,
      mode: "payment",
      success_url: `${origin}/payment-success`,
      cancel_url: `${origin}/cart`,
      metadata: orderMetadata,
      payment_intent_data: {
        metadata: orderMetadata
      }
    });

    console.log('Stripe checkout session created:', session.id);

    // Return the checkout URL
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Detailed Checkout Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      details: error.toString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "A detailed error occurred during the checkout process",
        fullError: error.toString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
