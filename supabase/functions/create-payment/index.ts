
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

    // Generate a unique order ID for this entire order
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Generated order ID:', orderId);

    // Validate and transform each item with detailed error logging
    const validatedLineItems = [];
    let orderMetadata = { order_id: orderId };
    
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

    // Create a Stripe checkout session with BNPL payment methods
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        "card",
        "klarna",
        "afterpay_clearpay",
        "affirm"
      ],
      line_items: validatedLineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${origin}/cart`,
      metadata: orderMetadata,
      payment_intent_data: {
        metadata: orderMetadata
      },
      // Configure BNPL options
      payment_method_options: {
        klarna: {
          preferred_locale: "en-US"
        },
        afterpay_clearpay: {
          reference: orderId
        },
        affirm: {
          preferred_locale: "en-US"
        }
      }
    });

    console.log('Stripe checkout session created:', session.id);

    // After successful Stripe session creation, create order records
    try {
      // Create Supabase client with service role key to bypass RLS
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Prepare order records for each cart item
      const orderRecords = items.map((item, index) => {
        let deliveryAddress = null;
        let contactInfo = null;

        if (item.metadata?.deliveryAddress) {
          try {
            deliveryAddress = JSON.parse(item.metadata.deliveryAddress);
          } catch (e) {
            console.warn(`Failed to parse delivery address for item ${index}:`, e);
          }
        }

        // Extract contact info from metadata
        if (item.metadata?.contactPhone || deliveryAddress) {
          contactInfo = {
            phone: item.metadata?.contactPhone,
            // We'll need to get name and email from the session or cart context
            name: "Customer", // Placeholder - should come from cart context
            email: "customer@example.com" // Placeholder - should come from cart context
          };
        }

        return {
          order_id: orderId,
          stripe_session_id: session.id,
          product_id: item.id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          delivery_date: item.metadata?.deliveryDate || null,
          delivery_address: deliveryAddress,
          contact_info: contactInfo,
          delivery_time_preference: item.metadata?.deliveryTimePreference || null,
          delivery_instructions: item.metadata?.deliveryInstructions || null,
          status: 'pending_payment',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });

      console.log('Creating order records:', orderRecords);

      // Insert order records into the database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderRecords)
        .select();

      if (orderError) {
        console.error('Failed to create order records:', orderError);
        // Log the error but don't fail the payment - we can handle this in the success page
      } else {
        console.log('Successfully created order records:', orderData);
      }

    } catch (dbError) {
      console.error('Database error when creating orders:', dbError);
      // Don't fail the payment process - we can handle order creation in the success page
    }

    // Return the checkout URL
    return new Response(
      JSON.stringify({ url: session.url, orderId }),
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
