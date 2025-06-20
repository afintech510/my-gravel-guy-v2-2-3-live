
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

    // Validate and transform each item with detailed error logging
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

        // Enhanced metadata collection for proper database mapping
        orderMetadata[`item_${i+1}_product_id`] = String(item.id || '');
        orderMetadata[`item_${i+1}_material_category`] = item.materialCategory || item.category || '';
        orderMetadata[`item_${i+1}_quantity_tons`] = String(item.quantity || item.tons || 0);
        orderMetadata[`item_${i+1}_quantity_yards`] = String(item.yards || 0);
        orderMetadata[`item_${i+1}_unit_price`] = String(item.price || 0);
        orderMetadata[`item_${i+1}_total_price`] = String((item.price * item.quantity) || 0);
        orderMetadata[`item_${i+1}_material_size`] = item.materialSize || item.size || '';

        // Add delivery and contact metadata from item metadata
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
          
          if (item.metadata.contactPhone) {
            orderMetadata[`item_${i+1}_contact_phone`] = item.metadata.contactPhone;
          }

          if (item.metadata.contactName) {
            orderMetadata[`item_${i+1}_contact_name`] = item.metadata.contactName;
          }

          if (item.metadata.contactEmail) {
            orderMetadata[`item_${i+1}_contact_email`] = item.metadata.contactEmail;
          }
          
          if (item.metadata.deliveryTimePreference) {
            orderMetadata[`item_${i+1}_delivery_time_preference`] = item.metadata.deliveryTimePreference;
          }
          
          if (item.metadata.deliveryInstructions) {
            // Truncate long instructions for metadata limits
            const instructions = item.metadata.deliveryInstructions;
            orderMetadata[`item_${i+1}_delivery_instructions`] = 
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
        
        console.log(`Successfully processed item ${i}:`, cleanName);
      } catch (validationError) {
        console.error(`Item validation error for item ${i}:`, validationError);
        throw new Error(`Item validation error: ${validationError.message}`);
      }
    }

    console.log('Creating Stripe checkout session with items:', validatedLineItems.length);
    console.log('Order metadata:', orderMetadata);

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

    // TEMPORARILY DISABLED: Database insertion to isolate the error
    console.log('=== DATABASE INSERTION TEMPORARILY DISABLED ===');
    console.log('Would have created order records for:', finalOrderId);
    console.log('Items count:', items.length);
    
    /*
    // After successful Stripe session creation, create order records
    try {
      console.log('=== STARTING DATABASE INSERTION ===');
      
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

      // Prepare order records for each cart item with CORRECTED field mapping to match orders table schema
      const orderRecords = items.map((item, index) => {
        console.log(`Preparing order record ${index + 1} for item:`, item.name);
        
        let deliveryAddress = null;

        if (item.metadata?.deliveryAddress) {
          try {
            deliveryAddress = typeof item.metadata.deliveryAddress === 'string' ? 
              JSON.parse(item.metadata.deliveryAddress) : item.metadata.deliveryAddress;
          } catch (e) {
            console.warn(`Failed to parse delivery address for item ${index}:`, e);
          }
        }

        // FIXED: Map to actual orders table schema
        const record = {
          order_id: finalOrderId,
          stripe_session_id: session.id,
          product_id: String(item.id || ''),
          unit: 'tons', // Fixed field name
          unit_price: item.price,
          total_price: item.price * (item.quantity || item.tons || 0),
          quantity: item.quantity || item.tons || 0, // Fixed field name
          status: 'pending_payment',
          delivery_name: item.metadata?.contactName || null,
          delivery_phone: item.metadata?.contactPhone || null,
          delivery_email: item.metadata?.contactEmail || null,
          billing_name: item.metadata?.contactName || null,
          billing_email: item.metadata?.contactEmail || null,
          delivery_date: item.metadata?.deliveryDate || null,
          delivery_street: deliveryAddress?.street || null,
          delivery_city: deliveryAddress?.city || null,
          delivery_state: deliveryAddress?.state || null,
          delivery_zip: deliveryAddress?.zip || null,
          delivery_time_preference: item.metadata?.deliveryTimePreference || null,
          delivery_instructions: item.metadata?.deliveryInstructions || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log(`Order record ${index + 1} prepared:`, record);
        return record;
      });

      console.log('All order records prepared, inserting into database...');

      // Insert order records into the database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderRecords)
        .select();

      if (orderError) {
        console.error('Database insertion error details:', {
          message: orderError.message,
          details: orderError.details,
          hint: orderError.hint,
          code: orderError.code
        });
        // Log the error but don't fail the payment - we can handle this in the success page
      } else {
        console.log('Successfully created order records:', orderData?.length || 0, 'records');
      }

    } catch (dbError) {
      console.error('Database error when creating orders:', dbError);
      console.error('Database error stack:', dbError.stack);
      // Don't fail the payment process - we can handle order creation in the success page
    }
    */

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
