
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    console.log('Verifying payment for session:', sessionId);

    // Initialize Stripe
    const stripeKey = Deno.env.get("stripe");
    if (!stripeKey) {
      throw new Error("Stripe secret key not found");
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer']
    });

    console.log('Retrieved Stripe session:', {
      id: session.id,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      metadata: session.metadata
    });

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

    // Check if payment was successful
    if (session.payment_status === 'paid') {
      console.log('Payment confirmed as paid, updating order status');
      
      // Extract order ID from metadata
      const orderId = session.metadata?.order_id;
      if (!orderId) {
        console.error('No order_id found in session metadata');
        throw new Error('Order ID not found in payment session');
      }

      // Update order status to 'paid' and add payment intent ID
      const { data: updateData, error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'paid',
          stripe_payment_intent_id: session.payment_intent?.id || null,
          customer_email: session.customer_details?.email || null,
          updated_at: new Date().toISOString()
        })
        .eq('stripe_session_id', sessionId)
        .select();

      if (updateError) {
        console.error('Failed to update order status:', updateError);
        throw new Error(`Failed to update order: ${updateError.message}`);
      }

      console.log('Successfully updated order status to paid:', updateData);

      // If there are items with incomplete data, try to extract from metadata
      if (session.metadata) {
        console.log('Checking for additional order data in metadata...');
        
        // Extract item data from metadata and update any missing fields
        const metadataKeys = Object.keys(session.metadata);
        const itemUpdates = [];

        // Group metadata by item number
        const itemData = {};
        metadataKeys.forEach(key => {
          const match = key.match(/^item_(\d+)_(.+)$/);
          if (match) {
            const itemIndex = match[1];
            const fieldName = match[2];
            if (!itemData[itemIndex]) {
              itemData[itemIndex] = {};
            }
            itemData[itemIndex][fieldName] = session.metadata[key];
          }
        });

        console.log('Extracted item data from metadata:', itemData);

        // Update each order record with missing data
        for (const [itemIndex, data] of Object.entries(itemData)) {
          const updateFields = {};
          
          // Map metadata fields to database fields with correct names
          if (data.product_id) updateFields.product_id = data.product_id;
          if (data.product_name) updateFields.product_name = data.product_name;
          if (data.material_category) updateFields.material_category = data.material_category;
          if (data.quantity_tons) updateFields.quantity_tons = parseFloat(data.quantity_tons);
          if (data.quantity_yards) updateFields.quantity_yards = parseFloat(data.quantity_yards);
          if (data.unit_price) updateFields.unit_price = parseFloat(data.unit_price);
          if (data.total_price) updateFields.total_price = parseFloat(data.total_price);
          if (data.material_size) updateFields.material_size = data.material_size;
          if (data.delivery_date) updateFields.delivery_date = data.delivery_date;
          if (data.delivery_address_street) updateFields.delivery_address_street = data.delivery_address_street;
          if (data.delivery_address_city) updateFields.delivery_address_city = data.delivery_address_city;
          if (data.delivery_address_state) updateFields.delivery_address_state = data.delivery_address_state;
          if (data.delivery_address_zip) updateFields.delivery_address_zip = data.delivery_address_zip;
          if (data.contact_name) updateFields.contact_name = data.contact_name;
          if (data.contact_phone) updateFields.contact_phone = data.contact_phone;
          if (data.contact_email) updateFields.contact_email = data.contact_email;
          if (data.delivery_time_preference) updateFields.delivery_time_preference = data.delivery_time_preference;
          if (data.delivery_instructions) updateFields.delivery_instructions = data.delivery_instructions;

          // Also set customer_name and customer_email if available
          if (data.contact_name) updateFields.customer_name = data.contact_name;
          if (data.contact_email) updateFields.customer_email = data.contact_email;

          updateFields.updated_at = new Date().toISOString();

          if (Object.keys(updateFields).length > 1) { // More than just updated_at
            console.log(`Updating order record ${itemIndex} with:`, updateFields);
            
            const { error: itemUpdateError } = await supabase
              .from('orders')
              .update(updateFields)
              .eq('order_id', orderId)
              .eq('stripe_session_id', sessionId);

            if (itemUpdateError) {
              console.error(`Failed to update item ${itemIndex}:`, itemUpdateError);
            } else {
              console.log(`Successfully updated item ${itemIndex}`);
            }
          }
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          payment_status: session.payment_status,
          order_id: orderId,
          customer_email: session.customer_details?.email
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      console.log('Payment not completed, status:', session.payment_status);
      
      return new Response(
        JSON.stringify({
          success: false,
          payment_status: session.payment_status,
          message: "Payment not completed"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

  } catch (error) {
    console.error("Payment verification error:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
