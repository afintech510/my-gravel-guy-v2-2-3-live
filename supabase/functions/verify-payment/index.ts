
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const logger = {
  info: (message: string, data?: any) => {
    console.log(`[VERIFY-PAYMENT] ${new Date().toISOString()} INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[VERIFY-PAYMENT] ${new Date().toISOString()} ERROR: ${message}`, error);
  },
  debug: (message: string, data?: any) => {
    console.log(`[VERIFY-PAYMENT] ${new Date().toISOString()} DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logger.info("=== PAYMENT VERIFICATION STARTED ===");

  try {
    // Parse request body
    let requestBody;
    try {
      const rawBody = await req.text();
      requestBody = JSON.parse(rawBody);
      logger.debug("Request body parsed", requestBody);
    } catch (parseError) {
      logger.error("Failed to parse request body", parseError);
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid JSON in request body"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const { paymentIntentId, orderId, fallbackMode, backupData } = requestBody;
    
    // Environment validation
    const stripeKey = Deno.env.get("stripe");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      const missingVars = [];
      if (!stripeKey) missingVars.push("stripe");
      if (!supabaseUrl) missingVars.push("SUPABASE_URL");
      if (!supabaseServiceKey) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
      
      logger.error(`Missing environment variables: ${missingVars.join(', ')}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Missing required environment variables: ${missingVars.join(', ')}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    let paymentVerified = false;
    let customerEmail = null;
    let customerName = null;
    let finalOrderId = orderId;
    let usedFallback = fallbackMode || false;
    
    // Try to verify payment with Stripe if payment intent ID is provided
    if (paymentIntentId && !fallbackMode) {
      try {
        logger.info("Attempting payment intent verification", { paymentIntentId: paymentIntentId.substring(0, 20) + "..." });
        
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, { expand: ['customer'] });
        
        if (paymentIntent.status === 'succeeded') {
          paymentVerified = true;
          if (paymentIntent.customer && typeof paymentIntent.customer === 'object') {
            customerEmail = paymentIntent.customer.email;
            customerName = paymentIntent.customer.name;
          }
          logger.info("Payment intent verified successfully", {
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency
          });
        } else {
          logger.info(`Payment not completed. Status: ${paymentIntent.status}`);
          return new Response(JSON.stringify({
            success: false,
            payment_status: paymentIntent.status,
            message: "Payment not completed"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      } catch (stripeError) {
        logger.error("Stripe verification failed - using fallback", stripeError);
        usedFallback = true;
      }
    } else {
      usedFallback = true;
    }

    // Use fallback data if Stripe verification failed or wasn't attempted
    if (usedFallback) {
      logger.info("Using fallback mode with backup data");
      
      if (!backupData) {
        logger.error("Fallback required but no backup data provided");
        return new Response(JSON.stringify({
          success: false,
          error: "Payment verification failed and no backup data available"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
      
      finalOrderId = backupData.orderId || orderId;
      customerEmail = backupData.customerInfo?.email || "guest@mygravelguy.com";
      customerName = backupData.customerInfo?.name || "Guest User";
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Process order items from backup data
    let orderItems = [];
    if (backupData && backupData.items) {
      orderItems = backupData.items.map(item => ({
        product_id: item.id || item.name,
        material_category: item.materialCategory || item.category || 'Material',
        quantity_tons: item.tons || item.quantity || 1,
        quantity_yards: item.yards || null,
        unit_price: item.price || 0,
        total_price: (item.price || 0) * (item.tons || item.quantity || 1),
        material_size: item.materialSize || item.size || null,
        delivery_date: item.metadata?.deliveryDate || null,
        delivery_address_street: item.metadata?.deliveryAddress ? 
          (typeof item.metadata.deliveryAddress === 'string' ? 
            JSON.parse(item.metadata.deliveryAddress).street : 
            item.metadata.deliveryAddress.street) : null,
        delivery_address_city: item.metadata?.deliveryAddress ? 
          (typeof item.metadata.deliveryAddress === 'string' ? 
            JSON.parse(item.metadata.deliveryAddress).city : 
            item.metadata.deliveryAddress.city) : null,
        delivery_address_state: item.metadata?.deliveryAddress ? 
          (typeof item.metadata.deliveryAddress === 'string' ? 
            JSON.parse(item.metadata.deliveryAddress).state : 
            item.metadata.deliveryAddress.state) : null,
        delivery_address_zip: item.metadata?.deliveryAddress ? 
          (typeof item.metadata.deliveryAddress === 'string' ? 
            JSON.parse(item.metadata.deliveryAddress).zip : 
            item.metadata.deliveryAddress.zip) : null,
        contact_name: item.metadata?.contactName || customerName || null,
        contact_phone: item.metadata?.contactPhone || null,
        contact_email: item.metadata?.contactEmail || customerEmail || null,
        delivery_time_preference: item.metadata?.deliveryTimePreference || null,
        delivery_instructions: item.metadata?.deliveryInstructions || null
      }));
    }

    if (orderItems.length === 0) {
      logger.error("No order items found");
      return new Response(JSON.stringify({
        success: false,
        error: "No order items found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Create order records in database
    const paymentStatus = usedFallback ? 'processed' : (paymentVerified ? 'paid' : 'pending');
    
    const orderRecords = orderItems.map(item => ({
      order_id: finalOrderId,
      stripe_payment_intent_id: paymentIntentId || null,
      product_id: item.product_id,
      material_category: item.material_category,
      quantity_tons: item.quantity_tons,
      quantity_yards: item.quantity_yards,
      unit_price: item.unit_price,
      total_price: item.total_price,
      material_size: item.material_size,
      delivery_date: item.delivery_date,
      delivery_address_street: item.delivery_address_street,
      delivery_address_city: item.delivery_address_city,
      delivery_address_state: item.delivery_address_state,
      delivery_address_zip: item.delivery_address_zip,
      contact_name: item.contact_name,
      contact_phone: item.contact_phone,
      contact_email: item.contact_email,
      customer_email: customerEmail,
      customer_name: customerName,
      delivery_time_preference: item.delivery_time_preference,
      delivery_instructions: item.delivery_instructions,
      status: paymentStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    logger.debug("Order records prepared", { count: orderRecords.length, paymentStatus });

    let insertedOrders;
    try {
      const { data, error: insertError } = await supabase
        .from('orders')
        .insert(orderRecords)
        .select();

      if (insertError) {
        logger.error('Database insertion error', insertError);
        throw insertError;
      }
      
      insertedOrders = data;
      logger.info(`Successfully inserted ${insertedOrders?.length || 0} order records`);
    } catch (dbError) {
      logger.error('Failed to insert order records', dbError);
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to create order records in database"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Transform orders for response
    const transformedOrders = (insertedOrders || []).map(order => ({
      id: order.id,
      order_id: order.order_id,
      product_name: order.material_category || order.product_id,
      quantity: order.quantity_tons,
      total_price: order.total_price,
      delivery_date: order.delivery_date,
      delivery_address_street: order.delivery_address_street,
      delivery_address_city: order.delivery_address_city,
      delivery_address_state: order.delivery_address_state,
      delivery_address_zip: order.delivery_address_zip,
      contact_name: order.contact_name,
      contact_email: order.contact_email,
      contact_phone: order.contact_phone,
      delivery_time_preference: order.delivery_time_preference,
      delivery_instructions: order.delivery_instructions,
      status: order.status
    }));
    
    const response = {
      success: true,
      payment_status: paymentStatus,
      orderId: finalOrderId,
      orders: transformedOrders,
      customer_email: customerEmail,
      customer_name: customerName,
      payment_intent_id: paymentIntentId,
      emailsSent: false, // Simplified for now
      total_amount: orderItems.reduce((sum, item) => sum + (item.total_price || 0), 0),
      timestamp: new Date().toISOString(),
      verification_method: usedFallback ? 'fallback' : 'stripe_verified',
      used_fallback: usedFallback
    };

    logger.info("=== PAYMENT VERIFICATION COMPLETED ===", {
      orderId: response.orderId,
      verification_method: response.verification_method,
      orders_count: response.orders.length
    });

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    logger.error("=== PAYMENT VERIFICATION FAILED ===", {
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
