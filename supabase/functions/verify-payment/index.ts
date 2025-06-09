
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Enhanced logging system with timestamps and detailed context
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[VERIFY-PAYMENT] ${new Date().toISOString()} INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[VERIFY-PAYMENT] ${new Date().toISOString()} ERROR: ${message}`, error);
  },
  debug: (message: string, data?: any) => {
    console.log(`[VERIFY-PAYMENT] ${new Date().toISOString()} DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  step: (stepNumber: number, description: string, data?: any) => {
    console.log(`[VERIFY-PAYMENT] ${new Date().toISOString()} STEP ${stepNumber}: ${description}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// Simple payment intent ID validation
const validatePaymentIntentId = (paymentIntentId: string): { isValid: boolean; error?: string } => {
  if (!paymentIntentId) {
    return { isValid: false, error: "Payment Intent ID is required" };
  }
  
  if (typeof paymentIntentId !== 'string') {
    return { isValid: false, error: "Payment Intent ID must be a string" };
  }
  
  // Stripe payment intent IDs typically start with 'pi_'
  if (!paymentIntentId.startsWith('pi_')) {
    return { isValid: false, error: "Invalid payment intent ID format - must start with 'pi_'" };
  }
  
  if (paymentIntentId.length < 20) {
    return { isValid: false, error: "Payment intent ID appears too short" };
  }
  
  return { isValid: true };
};

// Legacy session ID validation (for fallback)
const validateSessionId = (sessionId: string): { isValid: boolean; error?: string } => {
  if (!sessionId) {
    return { isValid: false, error: "Session ID is required" };
  }
  
  if (typeof sessionId !== 'string') {
    return { isValid: false, error: "Session ID must be a string" };
  }
  
  if (!sessionId.startsWith('cs_')) {
    return { isValid: false, error: "Invalid session ID format - must start with 'cs_'" };
  }
  
  if (sessionId.length < 50) {
    return { isValid: false, error: "Session ID appears too short" };
  }
  
  return { isValid: true };
};

// Retry logic for Stripe API calls
const retryStripeCall = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Stripe API attempt ${attempt}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error;
      logger.error(`Stripe API attempt ${attempt} failed`, {
        error: error.message,
        statusCode: error.statusCode,
        type: error.type
      });
      
      if (attempt < maxRetries) {
        logger.debug(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  }
  
  throw lastError;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logger.info("=== VERIFY PAYMENT FUNCTION STARTED ===");

  try {
    // Step 1: Enhanced environment validation
    logger.step(1, "Validating environment variables");
    
    const stripeKey = Deno.env.get("stripe");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    logger.debug("Environment check", {
      stripeKeyExists: !!stripeKey,
      stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 12) + "..." : "not found",
      stripeKeyLength: stripeKey ? stripeKey.length : 0,
      supabaseUrlExists: !!supabaseUrl,
      supabaseServiceKeyExists: !!supabaseServiceKey,
      resendApiKeyExists: !!resendApiKey
    });
    
    // Critical environment variables check
    const missingVars = [];
    if (!stripeKey) missingVars.push("stripe");
    if (!supabaseUrl) missingVars.push("SUPABASE_URL");
    if (!supabaseServiceKey) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
    
    if (missingVars.length > 0) {
      const error = `Missing required environment variables: ${missingVars.join(', ')}`;
      logger.error(error);
      return new Response(JSON.stringify({ 
        success: false, 
        error,
        debug: "Check Supabase Edge Function secrets configuration"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    // Validate Stripe key format
    if (!stripeKey.startsWith('sk_')) {
      logger.error("Invalid Stripe key format", { keyPrefix: stripeKey.substring(0, 10) });
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Invalid Stripe secret key format",
        debug: "Stripe secret key should start with 'sk_'"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }
    
    logger.info("Environment variables validated successfully");

    // Step 2: Enhanced request parsing and validation
    logger.step(2, "Parsing and validating request");
    
    let requestBody;
    try {
      const rawBody = await req.text();
      logger.debug("Raw request body received", { bodyLength: rawBody.length, preview: rawBody.substring(0, 200) });
      requestBody = JSON.parse(rawBody);
      logger.debug("Request body parsed successfully", requestBody);
    } catch (parseError) {
      logger.error("Failed to parse request body", parseError);
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid JSON in request body",
        debug: parseError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    const { paymentIntentId, sessionId, orderId, fallbackMode, backupData } = requestBody;
    
    // Validate input - prioritize payment intent over session
    let validationResult = { isValid: true };
    let primaryId = null;
    let verificationMode = 'fallback';
    
    if (!fallbackMode) {
      if (paymentIntentId) {
        validationResult = validatePaymentIntentId(paymentIntentId);
        primaryId = paymentIntentId;
        verificationMode = 'payment_intent';
      } else if (sessionId) {
        validationResult = validateSessionId(sessionId);
        primaryId = sessionId;
        verificationMode = 'session';
      } else {
        validationResult = { isValid: false, error: "Either paymentIntentId or sessionId is required" };
      }
      
      if (!validationResult.isValid) {
        logger.error("ID validation failed", { paymentIntentId, sessionId, error: validationResult.error });
        return new Response(JSON.stringify({
          success: false,
          error: validationResult.error,
          debug: "Please check the payment identifier format"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    }
    
    logger.info(`Processing payment verification`, { 
      verificationMode,
      primaryId: primaryId ? `${primaryId.substring(0, 20)}...` : 'none',
      orderId,
      fallbackMode,
      hasBackupData: !!backupData
    });

    // Step 3: Initialize Stripe with enhanced error handling
    logger.step(3, "Initializing Stripe client");
    
    let stripe;
    try {
      stripe = new Stripe(stripeKey, { 
        apiVersion: "2023-10-16",
        timeout: 30000,
        maxNetworkRetries: 2
      });
      logger.info("Stripe client initialized successfully");
    } catch (stripeInitError) {
      logger.error("Failed to initialize Stripe", stripeInitError);
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to initialize payment service",
        debug: stripeInitError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Step 4: Retrieve and validate payment information
    logger.step(4, "Retrieving payment information from Stripe");
    
    let paymentData;
    let customerEmail = null;
    let customerName = null;
    let finalOrderId = orderId;
    
    if (!fallbackMode && primaryId) {
      try {
        if (verificationMode === 'payment_intent') {
          // Use Payment Intent API
          paymentData = await retryStripeCall(async () => {
            logger.debug("Attempting to retrieve payment intent", { paymentIntentId: `${primaryId.substring(0, 20)}...` });
            return await stripe.paymentIntents.retrieve(primaryId, {
              expand: ['customer']
            });
          });
          
          logger.info("Payment intent retrieved successfully", {
            id: paymentData.id,
            status: paymentData.status,
            amount: paymentData.amount,
            currency: paymentData.currency,
            customer: paymentData.customer?.email || 'no customer data'
          });
          
          // Extract customer information if available
          if (paymentData.customer && typeof paymentData.customer === 'object') {
            customerEmail = paymentData.customer.email;
            customerName = paymentData.customer.name;
          }
          
        } else if (verificationMode === 'session') {
          // Fallback to session API
          paymentData = await retryStripeCall(async () => {
            logger.debug("Attempting to retrieve session", { sessionId: `${primaryId.substring(0, 20)}...` });
            return await stripe.checkout.sessions.retrieve(primaryId, {
              expand: ['payment_intent', 'customer']
            });
          });
          
          logger.info("Session retrieved successfully", {
            id: paymentData.id,
            payment_status: paymentData.payment_status,
            customer_email: paymentData.customer_details?.email,
            amount_total: paymentData.amount_total
          });
          
          customerEmail = paymentData.customer_details?.email;
          customerName = paymentData.customer_details?.name;
          finalOrderId = paymentData.metadata?.order_id || orderId;
        }
        
      } catch (stripeError) {
        logger.error("Failed to retrieve payment information", {
          error: stripeError.message,
          statusCode: stripeError.statusCode,
          type: stripeError.type,
          requestId: stripeError.requestId
        });
        
        let userMessage = "Failed to retrieve payment information";
        let debugInfo = stripeError.message;
        
        if (stripeError.statusCode === 404) {
          userMessage = "Payment not found or expired";
          debugInfo = "The payment ID may be invalid or the payment may have expired";
        } else if (stripeError.statusCode === 401) {
          userMessage = "Authentication failed with payment provider";
          debugInfo = "Check Stripe API key configuration";
        } else if (stripeError.statusCode === 400) {
          userMessage = "Invalid request to payment provider";
          debugInfo = "The payment ID format may be incorrect";
        }
        
        return new Response(JSON.stringify({
          success: false,
          error: userMessage,
          debug: debugInfo,
          stripeError: {
            type: stripeError.type,
            code: stripeError.code,
            statusCode: stripeError.statusCode
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }
    } else {
      logger.info("Fallback mode - proceeding without Stripe verification");
    }

    // Step 5: Verify payment status
    logger.step(5, "Verifying payment status");
    
    let paymentStatus = 'pending';
    
    if (paymentData) {
      if (verificationMode === 'payment_intent') {
        // Payment Intent status check
        if (paymentData.status !== 'succeeded') {
          logger.info(`Payment not completed. Status: ${paymentData.status}`);
          return new Response(JSON.stringify({
            success: false,
            payment_status: paymentData.status,
            message: "Payment not completed",
            payment_intent_id: paymentIntentId
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        paymentStatus = 'paid';
      } else if (verificationMode === 'session') {
        // Session status check
        if (paymentData.payment_status !== 'paid') {
          logger.info(`Payment not completed. Status: ${paymentData.payment_status}`);
          return new Response(JSON.stringify({
            success: false,
            payment_status: paymentData.payment_status,
            message: "Payment not completed",
            session_id: sessionId
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          });
        }
        paymentStatus = 'paid';
      }
      
      logger.info("Payment confirmed as successful");
    }

    // Step 6: Handle order data
    logger.step(6, "Processing order data");
    
    let orderItems = [];
    
    if (paymentData && verificationMode === 'session' && paymentData.metadata) {
      // Extract order items from session metadata (legacy)
      const itemIndices = new Set();
      
      Object.keys(paymentData.metadata).forEach(key => {
        const match = key.match(/^item_(\d+)_/);
        if (match) {
          itemIndices.add(parseInt(match[1]));
        }
      });
      
      logger.info(`Found ${itemIndices.size} items in session metadata`);
      
      itemIndices.forEach(index => {
        const item = {
          product_id: paymentData.metadata[`item_${index}_product_id`] || '',
          material_category: paymentData.metadata[`item_${index}_material_category`] || null,
          quantity_tons: parseFloat(paymentData.metadata[`item_${index}_quantity_tons`]) || 0,
          quantity_yards: paymentData.metadata[`item_${index}_quantity_yards`] ? parseFloat(paymentData.metadata[`item_${index}_quantity_yards`]) : null,
          unit_price: parseFloat(paymentData.metadata[`item_${index}_unit_price`]) || 0,
          total_price: parseFloat(paymentData.metadata[`item_${index}_total_price`]) || 0,
          material_size: paymentData.metadata[`item_${index}_material_size`] || null,
          delivery_date: paymentData.metadata[`item_${index}_delivery_date`] || null,
          delivery_address_street: paymentData.metadata[`item_${index}_delivery_address_street`] || null,
          delivery_address_city: paymentData.metadata[`item_${index}_delivery_address_city`] || null,
          delivery_address_state: paymentData.metadata[`item_${index}_delivery_address_state`] || null,
          delivery_address_zip: paymentData.metadata[`item_${index}_delivery_address_zip`] || null,
          contact_name: paymentData.metadata[`item_${index}_contact_name`] || customerName || null,
          contact_phone: paymentData.metadata[`item_${index}_contact_phone`] || null,
          contact_email: paymentData.metadata[`item_${index}_contact_email`] || customerEmail || null,
          delivery_time_preference: paymentData.metadata[`item_${index}_delivery_time_preference`] || null,
          delivery_instructions: paymentData.metadata[`item_${index}_delivery_instructions`] || null
        };
        
        orderItems.push(item);
      });
      
    } else if (backupData) {
      // Use backup data when session is not available or for payment intent mode
      logger.info("Using backup data for order processing", { backupData });
      finalOrderId = backupData.orderId || orderId;
      orderItems = backupData.items || [];
      customerEmail = customerEmail || "guest@mygravelguy.com";
      customerName = customerName || "Guest User";
    }
    
    if (orderItems.length === 0) {
      logger.error("No order items found", { hasPaymentData: !!paymentData, hasBackupData: !!backupData });
      return new Response(JSON.stringify({
        success: false,
        error: "No order items found"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logger.info(`Successfully processed ${orderItems.length} order items`);

    // Step 7: Initialize Supabase client
    logger.step(7, "Initializing Supabase client");
    
    let supabase;
    try {
      supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      logger.info("Supabase client initialized successfully");
    } catch (supabaseError) {
      logger.error("Failed to initialize Supabase", supabaseError);
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to initialize database service"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Step 8: Create order records in database
    logger.step(8, "Creating order records in database");
    
    const orderRecords = orderItems.map(item => ({
      order_id: finalOrderId,
      stripe_session_id: sessionId || null,
      stripe_payment_intent_id: paymentIntentId || paymentData?.id || null,
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

    logger.debug("Order records prepared for insertion", { 
      count: orderRecords.length,
      sampleRecord: orderRecords[0]
    });

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

    // Step 9: Handle email notifications
    logger.step(9, "Handling email notifications");
    
    let emailResults = {
      customerEmailSent: false,
      internalEmailSent: false,
      emailError: null
    };

    try {
      if (resendApiKey && customerEmail && customerEmail !== "guest@mygravelguy.com") {
        const totalAmount = orderItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
        
        const emailData = {
          order_id: finalOrderId,
          items: orderItems,
          total_amount: totalAmount,
          customer_email: customerEmail,
          customer_name: customerName,
          payment_intent_id: paymentIntentId || paymentData?.id,
          session_id: sessionId
        };
        
        // Send customer confirmation email
        logger.debug("Sending customer confirmation email");
        try {
          const customerEmailResult = await supabase.functions.invoke('send-email', {
            body: {
              to: emailData.customer_email,
              subject: `Order Confirmation - ${emailData.order_id}`,
              html: generateCustomerEmailTemplate(emailData),
              type: 'customer_confirmation'
            }
          });
          emailResults.customerEmailSent = !customerEmailResult.error;
          if (customerEmailResult.error) {
            logger.error("Customer email failed", customerEmailResult.error);
          }
        } catch (emailError) {
          logger.error("Customer email exception", emailError);
        }
        
        // Send internal notification email
        logger.debug("Sending internal notification email");
        try {
          const internalEmailResult = await supabase.functions.invoke('send-email', {
            body: {
              to: 'order.support@mygravelguy.com',
              subject: `New Order: ${emailData.order_id} - $${totalAmount.toFixed(2)}`,
              html: generateInternalEmailTemplate(emailData),
              type: 'internal_notification'
            }
          });
          emailResults.internalEmailSent = !internalEmailResult.error;
          if (internalEmailResult.error) {
            logger.error("Internal email failed", internalEmailResult.error);
          }
        } catch (emailError) {
          logger.error("Internal email exception", emailError);
        }
        
        logger.info("Email sending completed", emailResults);
      } else {
        logger.info("Email service skipped", { 
          hasResendKey: !!resendApiKey,
          customerEmail,
          reason: !resendApiKey ? "No API key" : "Guest checkout"
        });
        emailResults.emailError = !resendApiKey ? "Email service not configured" : "Guest checkout - no email sent";
      }
      
    } catch (error) {
      logger.error("Email processing failed", error);
      emailResults.emailError = error.message;
    }

    // Step 10: Generate response
    logger.step(10, "Preparing success response");
    
    // Transform insertedOrders to match PaymentSuccess.tsx expectations
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
      payment_status: paymentData?.status || paymentData?.payment_status || 'processed',
      orderId: finalOrderId,
      orders: transformedOrders,
      customer_email: customerEmail,
      customer_name: customerName,
      payment_intent_id: paymentIntentId || paymentData?.id,
      session_id: sessionId,
      emailsSent: emailResults.customerEmailSent && emailResults.internalEmailSent,
      total_amount: orderItems.reduce((sum, item) => sum + (item.total_price || 0), 0),
      timestamp: new Date().toISOString()
    };

    logger.info("=== VERIFY PAYMENT FUNCTION COMPLETED SUCCESSFULLY ===", response);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    logger.error("=== VERIFY PAYMENT FUNCTION FAILED ===", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString()
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

// Email template functions
const generateCustomerEmailTemplate = (orderData: any): string => {
  try {
    const itemsList = orderData.items?.map((item: any) => 
      `<li>${item.material_category || 'Material'} - ${item.quantity_tons} tons - $${(item.total_price || 0).toFixed(2)}</li>`
    ).join('') || '<li>Order details processing</li>';

    return `
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Order Confirmation</h2>
        <p>Thank you for your order!</p>
        <p><strong>Order ID:</strong> ${orderData.order_id || 'Processing'}</p>
        <p><strong>Total:</strong> $${(orderData.total_amount || 0).toFixed(2)}</p>
        <h3>Items:</h3>
        <ul>${itemsList}</ul>
        <p>We will contact you within 24 hours with delivery details.</p>
      </body>
      </html>
    `;
  } catch (error) {
    return `<h2>Order Confirmation</h2><p>Order ID: ${orderData.order_id || 'Processing'}</p><p>Total: $${(orderData.total_amount || 0).toFixed(2)}</p>`;
  }
};

const generateInternalEmailTemplate = (orderData: any): string => {
  try {
    const itemsList = orderData.items?.map((item: any) => 
      `<li>${item.material_category || 'Material'} - ${item.quantity_tons} tons - $${(item.total_price || 0).toFixed(2)}</li>`
    ).join('') || '<li>Order details processing</li>';

    return `
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Order Received</h2>
        <p><strong>Order ID:</strong> ${orderData.order_id || 'Processing'}</p>
        <p><strong>Customer:</strong> ${orderData.customer_name || 'N/A'} (${orderData.customer_email || 'N/A'})</p>
        <p><strong>Total:</strong> $${(orderData.total_amount || 0).toFixed(2)}</p>
        <h3>Items:</h3>
        <ul>${itemsList}</ul>
        <p>Contact customer within 24 hours to confirm delivery details.</p>
      </body>
      </html>
    `;
  } catch (error) {
    return `<h2>New Order</h2><p>Order ID: ${orderData.order_id || 'Processing'}</p><p>Customer: ${orderData.customer_email || 'N/A'}</p>`;
  }
};
