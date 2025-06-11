
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

// Enhanced environment validation
function validateEnvironment() {
  const stripeKey = Deno.env.get("stripe");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  const missing = [];
  if (!stripeKey) missing.push("stripe");
  if (!supabaseUrl) missing.push("SUPABASE_URL");
  if (!supabaseServiceKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  return { stripeKey, supabaseUrl, supabaseServiceKey };
}

// Enhanced backup data processing
function processBackupData(backupData: any) {
  if (!backupData || !backupData.items || !Array.isArray(backupData.items)) {
    throw new Error("Invalid backup data structure: missing or invalid items array");
  }
  
  return backupData.items.map((item: any, index: number) => {
    // Validate required fields
    if (!item.id && !item.name) {
      throw new Error(`Item ${index}: missing both id and name`);
    }
    
    const quantity = item.tons || item.quantity || 1;
    const price = item.price || 0;
    
    if (quantity <= 0 || price < 0) {
      throw new Error(`Item ${index}: invalid quantity (${quantity}) or price (${price})`);
    }
    
    // Parse delivery address safely
    let deliveryAddress = null;
    if (item.metadata?.deliveryAddress) {
      try {
        deliveryAddress = typeof item.metadata.deliveryAddress === 'string' 
          ? JSON.parse(item.metadata.deliveryAddress)
          : item.metadata.deliveryAddress;
      } catch (e) {
        logger.error(`Failed to parse delivery address for item ${index}`, e);
      }
    }
    
    return {
      product_id: item.id?.toString() || item.name,
      unit_price: price,
      total_price: price * quantity,
      quantity: quantity,
      unit: 'tons',
      delivery_date: item.metadata?.deliveryDate || null,
      delivery_street: deliveryAddress?.street || null,
      delivery_city: deliveryAddress?.city || null,
      delivery_state: deliveryAddress?.state || null,
      delivery_zip: deliveryAddress?.zip || null,
      delivery_name: item.metadata?.contactName || null,
      delivery_phone: item.metadata?.contactPhone || null,
      delivery_email: item.metadata?.contactEmail || null,
      delivery_time_preference: item.metadata?.deliveryTimePreference || null,
      delivery_instructions: item.metadata?.deliveryInstructions || null
    };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logger.info("=== PAYMENT VERIFICATION STARTED ===");

  try {
    // Validate environment first
    const { stripeKey, supabaseUrl, supabaseServiceKey } = validateEnvironment();
    logger.info("Environment variables validated successfully");

    // Parse and validate request body
    let requestBody;
    try {
      const rawBody = await req.text();
      if (!rawBody.trim()) {
        throw new Error("Empty request body");
      }
      requestBody = JSON.parse(rawBody);
      logger.debug("Request body parsed successfully", { 
        hasPaymentIntentId: !!requestBody.paymentIntentId,
        hasOrderId: !!requestBody.orderId,
        hasFallbackMode: !!requestBody.fallbackMode,
        hasBackupData: !!requestBody.backupData
      });
    } catch (parseError) {
      logger.error("Failed to parse request body", parseError);
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid JSON in request body",
        details: parseError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const { paymentIntentId, orderId, fallbackMode, backupData } = requestBody;
    
    // Validate required data
    if (!orderId) {
      throw new Error("Order ID is required");
    }
    
    if (fallbackMode && !backupData) {
      throw new Error("Backup data is required when using fallback mode");
    }

    let paymentVerified = false;
    let customerEmail = "guest@mygravelguy.com";
    let customerName = "Guest User";
    let finalOrderId = orderId;
    let usedFallback = fallbackMode || false;
    
    // Try to verify payment with Stripe if payment intent ID is provided
    if (paymentIntentId && !fallbackMode) {
      try {
        logger.info("Attempting Stripe payment verification", { 
          paymentIntentId: paymentIntentId.substring(0, 20) + "..." 
        });
        
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, { 
          expand: ['customer'] 
        });
        
        logger.debug("Payment intent retrieved", {
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        });
        
        if (paymentIntent.status === 'succeeded') {
          paymentVerified = true;
          if (paymentIntent.customer && typeof paymentIntent.customer === 'object') {
            customerEmail = paymentIntent.customer.email || customerEmail;
            customerName = paymentIntent.customer.name || customerName;
          }
          logger.info("Payment verification successful");
        } else {
          logger.info(`Payment not completed. Status: ${paymentIntent.status}`);
          return new Response(JSON.stringify({
            success: false,
            payment_status: paymentIntent.status,
            message: "Payment not completed",
            orderId: finalOrderId
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
      } catch (stripeError) {
        logger.error("Stripe verification failed, switching to fallback", stripeError);
        usedFallback = true;
      }
    } else {
      logger.info("Using fallback mode (no Stripe verification)");
      usedFallback = true;
    }

    // Process backup data
    let orderItems = [];
    if (backupData) {
      try {
        orderItems = processBackupData(backupData);
        logger.info(`Processed ${orderItems.length} items from backup data`);
        
        // Extract customer info from backup if available
        if (backupData.customerInfo) {
          customerEmail = backupData.customerInfo.email || customerEmail;
          customerName = backupData.customerInfo.name || customerName;
        }
      } catch (backupError) {
        logger.error("Failed to process backup data", backupError);
        throw new Error(`Backup data processing failed: ${backupError.message}`);
      }
    }

    if (orderItems.length === 0) {
      throw new Error("No valid order items found in backup data");
    }

    // Initialize Supabase client with enhanced error handling
    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      logger.debug("Supabase client initialized");
    } catch (supabaseError) {
      logger.error("Failed to initialize Supabase client", supabaseError);
      throw new Error("Database connection failed");
    }

    // Prepare order records for insertion
    const paymentStatus = usedFallback ? 'processed' : (paymentVerified ? 'paid' : 'pending');
    
    const orderRecords = orderItems.map(item => ({
      order_id: finalOrderId,
      stripe_payment_intent_id: paymentIntentId || null,
      product_id: item.product_id,
      unit: item.unit,
      unit_price: item.unit_price,
      total_price: item.total_price,
      quantity: item.quantity,
      delivery_date: item.delivery_date,
      delivery_street: item.delivery_street,
      delivery_city: item.delivery_city,
      delivery_state: item.delivery_state,
      delivery_zip: item.delivery_zip,
      delivery_name: item.delivery_name,
      delivery_phone: item.delivery_phone,
      delivery_email: item.delivery_email,
      delivery_time_preference: item.delivery_time_preference,
      delivery_instructions: item.delivery_instructions,
      billing_name: customerName,
      billing_email: customerEmail,
      status: paymentStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    logger.debug("Order records prepared for insertion", { 
      count: orderRecords.length, 
      paymentStatus,
      orderId: finalOrderId
    });

    // Insert order records with enhanced error handling
    let insertedOrders;
    try {
      const { data, error: insertError } = await supabase
        .from('orders')
        .insert(orderRecords)
        .select();

      if (insertError) {
        logger.error('Database insertion error details', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw new Error(`Database insertion failed: ${insertError.message}`);
      }
      
      insertedOrders = data;
      logger.info(`Successfully inserted ${insertedOrders?.length || 0} order records`);
    } catch (dbError) {
      logger.error('Database operation failed', dbError);
      throw new Error(`Database operation failed: ${dbError.message}`);
    }

    // Transform orders for response
    const transformedOrders = (insertedOrders || []).map(order => ({
      id: order.id,
      order_id: order.order_id,
      product_name: order.product_id,
      quantity: order.quantity,
      total_price: order.total_price,
      delivery_date: order.delivery_date,
      delivery_address_street: order.delivery_street,
      delivery_address_city: order.delivery_city,
      delivery_address_state: order.delivery_state,
      delivery_address_zip: order.delivery_zip,
      contact_name: order.delivery_name,
      contact_email: order.delivery_email,
      contact_phone: order.delivery_phone,
      delivery_time_preference: order.delivery_time_preference,
      delivery_instructions: order.delivery_instructions,
      status: order.status
    }));
    
    const totalAmount = orderItems.reduce((sum, item) => sum + item.total_price, 0);
    
    const response = {
      success: true,
      payment_status: paymentStatus,
      orderId: finalOrderId,
      orders: transformedOrders,
      customer_email: customerEmail,
      customer_name: customerName,
      payment_intent_id: paymentIntentId,
      total_amount: totalAmount,
      timestamp: new Date().toISOString(),
      verification_method: usedFallback ? 'fallback' : 'stripe_verified',
      used_fallback: usedFallback
    };

    logger.info("=== PAYMENT VERIFICATION COMPLETED SUCCESSFULLY ===", {
      orderId: response.orderId,
      verification_method: response.verification_method,
      orders_count: response.orders.length,
      total_amount: response.total_amount
    });

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    logger.error("=== PAYMENT VERIFICATION FAILED ===", {
      message: errorMessage,
      details: errorDetails
    });
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        debug_info: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
