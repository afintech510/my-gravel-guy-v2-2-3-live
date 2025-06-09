
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logger.info("=== VERIFY PAYMENT FUNCTION STARTED ===");

  try {
    // Step 1: Enhanced environment validation
    logger.step(1, "Validating environment variables");
    
    const stripeKey = Deno.env.get("stripe") || Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    logger.debug("Environment check", {
      stripeKeyExists: !!stripeKey,
      stripeKeyPrefix: stripeKey ? stripeKey.substring(0, 7) + "..." : "not found",
      supabaseUrlExists: !!supabaseUrl,
      supabaseServiceKeyExists: !!supabaseServiceKey,
      resendApiKeyExists: !!resendApiKey
    });
    
    // Critical environment variables check
    const missingVars = [];
    if (!stripeKey) missingVars.push("Stripe secret key ('stripe' or 'STRIPE_SECRET_KEY')");
    if (!supabaseUrl) missingVars.push("SUPABASE_URL");
    if (!supabaseServiceKey) missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
    
    if (missingVars.length > 0) {
      const error = `Missing required environment variables: ${missingVars.join(', ')}`;
      logger.error(error);
      return new Response(JSON.stringify({ 
        success: false, 
        error,
        debug: "Check Supabase Edge Function secrets configuration",
        missing_variables: missingVars
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
      logger.debug("Raw request body received", { bodyLength: rawBody.length });
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
    
    const { sessionId } = requestBody;
    
    if (!sessionId || typeof sessionId !== 'string') {
      logger.error("Session ID validation failed", { sessionId, type: typeof sessionId });
      return new Response(JSON.stringify({
        success: false,
        error: "Valid sessionId is required",
        debug: "sessionId must be a non-empty string"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
    
    logger.info(`Processing payment verification for session: ${sessionId}`);

    // Step 3: Initialize Stripe with enhanced error handling
    logger.step(3, "Initializing Stripe client");
    
    let stripe;
    try {
      stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
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

    // Step 4: Retrieve and validate Stripe session
    logger.step(4, "Retrieving Stripe checkout session");
    
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['payment_intent', 'customer']
      });
      
      logger.info("Stripe session retrieved successfully", {
        id: session.id,
        payment_status: session.payment_status,
        customer_email: session.customer_details?.email,
        amount_total: session.amount_total,
        metadata_keys: Object.keys(session.metadata || {})
      });
    } catch (stripeError) {
      logger.error("Failed to retrieve Stripe session", stripeError);
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to retrieve payment session",
        debug: `Stripe API error: ${stripeError.message}`
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Step 5: Verify payment status
    logger.step(5, "Verifying payment status");
    
    if (session.payment_status !== 'paid') {
      logger.info(`Payment not completed. Status: ${session.payment_status}`);
      return new Response(JSON.stringify({
        success: false,
        payment_status: session.payment_status,
        message: "Payment not completed",
        session_id: sessionId
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logger.info("Payment confirmed as successful");

    // Step 6: Extract and validate order data
    logger.step(6, "Extracting order data from session metadata");
    
    const orderId = session.metadata?.order_id;
    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    
    // Enhanced validation
    const validationErrors = [];
    if (!orderId) validationErrors.push("order_id missing in session metadata");
    if (!customerEmail) validationErrors.push("customer email not found in session");
    
    if (validationErrors.length > 0) {
      logger.error("Order data validation failed", { validationErrors, metadata: session.metadata });
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid order data in payment session",
        debug: validationErrors.join(", "),
        validation_errors: validationErrors
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logger.info("Order identification successful", {
      orderId,
      customerEmail,
      customerName
    });

    // Step 7: Enhanced order items extraction
    logger.step(7, "Processing order items from metadata");
    
    const orderItems = [];
    const itemIndices = new Set();
    
    // Find all item indices in metadata
    Object.keys(session.metadata).forEach(key => {
      const match = key.match(/^item_(\d+)_/);
      if (match) {
        itemIndices.add(parseInt(match[1]));
      }
    });
    
    logger.info(`Found ${itemIndices.size} items in metadata`, { itemIndices: Array.from(itemIndices) });
    
    // Extract and validate data for each item
    itemIndices.forEach(index => {
      const item = {
        product_id: session.metadata[`item_${index}_product_id`] || '',
        material_category: session.metadata[`item_${index}_material_category`] || null,
        quantity_tons: parseFloat(session.metadata[`item_${index}_quantity_tons`]) || 0,
        quantity_yards: session.metadata[`item_${index}_quantity_yards`] ? parseFloat(session.metadata[`item_${index}_quantity_yards`]) : null,
        unit_price: parseFloat(session.metadata[`item_${index}_unit_price`]) || 0,
        total_price: parseFloat(session.metadata[`item_${index}_total_price`]) || 0,
        material_size: session.metadata[`item_${index}_material_size`] || null,
        delivery_date: session.metadata[`item_${index}_delivery_date`] || null,
        delivery_address_street: session.metadata[`item_${index}_delivery_address_street`] || null,
        delivery_address_city: session.metadata[`item_${index}_delivery_address_city`] || null,
        delivery_address_state: session.metadata[`item_${index}_delivery_address_state`] || null,
        delivery_address_zip: session.metadata[`item_${index}_delivery_address_zip`] || null,
        contact_name: session.metadata[`item_${index}_contact_name`] || customerName || null,
        contact_phone: session.metadata[`item_${index}_contact_phone`] || null,
        contact_email: session.metadata[`item_${index}_contact_email`] || customerEmail || null,
        delivery_time_preference: session.metadata[`item_${index}_delivery_time_preference`] || null,
        delivery_instructions: session.metadata[`item_${index}_delivery_instructions`] || null,
        customer_email: customerEmail,
        customer_name: customerName || session.metadata[`item_${index}_contact_name`] || null
      };
      
      orderItems.push(item);
      logger.debug(`Extracted item ${index}`, item);
    });
    
    if (orderItems.length === 0) {
      logger.error("No order items found in metadata", { metadata: session.metadata });
      return new Response(JSON.stringify({
        success: false,
        error: "No order items found in payment session",
        debug: "No item_X_ metadata found in session"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logger.info(`Successfully extracted ${orderItems.length} order items`);

    // Step 8: Initialize Supabase client with enhanced configuration
    logger.step(8, "Initializing Supabase client");
    
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
        error: "Failed to initialize database service",
        debug: supabaseError.message
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Step 9: Enhanced database insertion with proper schema alignment
    logger.step(9, "Creating order records in database");
    
    const orderRecords = orderItems.map(item => ({
      order_id: orderId,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: session.payment_intent?.id || null,
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
      customer_email: item.customer_email,
      customer_name: item.customer_name,
      delivery_time_preference: item.delivery_time_preference,
      delivery_instructions: item.delivery_instructions,
      status: 'paid',
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
        logger.error('Database insertion error details', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        });
        throw insertError;
      }
      
      insertedOrders = data;
      logger.info(`Successfully inserted ${insertedOrders?.length || 0} order records`);
    } catch (dbError) {
      logger.error('Failed to insert order records', {
        error: dbError.message,
        details: dbError.details || 'No additional details',
        recordCount: orderRecords.length
      });
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to create order records in database",
        debug: `Database error: ${dbError.message}`,
        database_details: dbError.details || null
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Step 10: Enhanced email service with robust error handling
    logger.step(10, "Sending confirmation emails");
    
    let emailResults = {
      customerEmailSent: false,
      internalEmailSent: false,
      emailError: null,
      emailService: resendApiKey ? 'resend' : 'disabled'
    };

    try {
      // Calculate total amount for email
      const totalAmount = orderItems.reduce((sum, item) => sum + (item.total_price || 0), 0);
      
      const emailData = {
        order_id: orderId,
        items: orderItems,
        total_amount: totalAmount,
        customer_email: customerEmail,
        customer_name: customerName,
        session_id: sessionId
      };
      
      logger.debug("Email data prepared", emailData);
      
      if (resendApiKey) {
        // Send customer confirmation email
        logger.debug("Sending customer confirmation email");
        const customerEmailResult = await supabase.functions.invoke('send-email', {
          body: {
            to: emailData.customer_email,
            subject: `Order Confirmation - ${emailData.order_id} 📦`,
            html: generateCustomerEmailTemplate(emailData),
            type: 'customer_confirmation',
            orderData: emailData
          }
        });
        
        // Send internal notification email
        logger.debug("Sending internal notification email");
        const internalEmailResult = await supabase.functions.invoke('send-email', {
          body: {
            to: 'order.support@mygravelguy.com',
            subject: `🚨 New Order: ${emailData.order_id} - $${totalAmount.toFixed(2)}`,
            html: generateInternalEmailTemplate(emailData),
            type: 'internal_notification',
            orderData: emailData
          }
        });
        
        emailResults = {
          customerEmailSent: !customerEmailResult.error,
          internalEmailSent: !internalEmailResult.error,
          emailError: customerEmailResult.error || internalEmailResult.error,
          emailService: 'resend'
        };
        
        logger.info("Email sending completed", emailResults);
      } else {
        logger.info("Email service disabled - RESEND_API_KEY not configured");
        emailResults.emailError = "Email service not configured - RESEND_API_KEY missing";
      }
      
    } catch (error) {
      logger.error("Failed to send order emails", {
        error: error.message,
        stack: error.stack
      });
      emailResults.emailError = error.message;
    }

    // Step 11: Generate comprehensive success response
    logger.step(11, "Preparing success response");
    
    const response = {
      success: true,
      payment_status: session.payment_status,
      order_id: orderId,
      customer_email: customerEmail,
      customer_name: customerName,
      session_id: sessionId,
      orders_created: insertedOrders?.length || 0,
      items_processed: orderItems.length,
      total_amount: orderItems.reduce((sum, item) => sum + (item.total_price || 0), 0),
      emails_sent: {
        customer: emailResults.customerEmailSent,
        internal: emailResults.internalEmailSent,
        service: emailResults.emailService
      },
      email_error: emailResults.emailError,
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
        debug: error.stack,
        timestamp: new Date().toISOString(),
        function: "verify-payment"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Enhanced email templates with better formatting and error handling
const generateCustomerEmailTemplate = (orderData: any) => {
  try {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Order Confirmation 📦</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Thank you for your order!</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #16a34a; margin-top: 0;">Order Details</h2>
          <p><strong>Order ID:</strong> ${orderData.order_id}</p>
          <p><strong>Customer:</strong> ${orderData.customer_name || 'Valued Customer'}</p>
          <p><strong>Total Amount:</strong> $${orderData.total_amount.toFixed(2)}</p>
          
          <h3>Items Ordered:</h3>
          <ul style="background: white; padding: 20px; border-radius: 8px;">
            ${orderData.items.map((item: any) => `
              <li style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e5e7eb;">
                <strong>${item.material_category || 'Material'}</strong><br>
                Quantity: ${item.quantity_tons} tons<br>
                Price: $${item.total_price.toFixed(2)}
                ${item.delivery_date ? `<br>Delivery Date: ${new Date(item.delivery_date).toLocaleDateString()}` : ''}
              </li>
            `).join('')}
          </ul>
          
          <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #16a34a; margin-top: 0;">What's Next?</h3>
            <p>We're processing your order and will contact you within 24 hours with delivery details.</p>
            <p>If you have any questions, please contact us at order.support@mygravelguy.com</p>
          </div>
        </div>
      </body>
      </html>
    `;
  } catch (error) {
    logger.error("Error generating customer email template", error);
    return `<h2>Order Confirmation</h2><p>Order ID: ${orderData.order_id}</p><p>Total: $${orderData.total_amount.toFixed(2)}</p>`;
  }
};

const generateInternalEmailTemplate = (orderData: any) => {
  try {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Order Received</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🚨 New Order Received</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Payment completed successfully</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #dc2626; margin-top: 0;">Order Information</h2>
          <p><strong>Order ID:</strong> ${orderData.order_id}</p>
          <p><strong>Session ID:</strong> ${orderData.session_id}</p>
          <p><strong>Customer:</strong> ${orderData.customer_name || 'N/A'} (${orderData.customer_email})</p>
          <p><strong>Total Amount:</strong> $${orderData.total_amount.toFixed(2)}</p>
          <p><strong>Items Count:</strong> ${orderData.items.length}</p>
          
          <h3>Order Items with Delivery Details:</h3>
          ${orderData.items.map((item: any) => `
            <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
              <h4 style="margin-top: 0; color: #dc2626;">${item.material_category || 'Material'}</h4>
              <p><strong>Quantity:</strong> ${item.quantity_tons} tons</p>
              <p><strong>Price:</strong> $${item.total_price.toFixed(2)}</p>
              
              ${item.contact_name || item.contact_phone || item.contact_email ? `
                <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <h5 style="margin-top: 0; color: #991b1b;">Contact Information:</h5>
                  ${item.contact_name ? `<p><strong>Name:</strong> ${item.contact_name}</p>` : ''}
                  ${item.contact_phone ? `<p><strong>Phone:</strong> ${item.contact_phone}</p>` : ''}
                  ${item.contact_email ? `<p><strong>Email:</strong> ${item.contact_email}</p>` : ''}
                </div>
              ` : ''}
              
              ${item.delivery_address_street ? `
                <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <h5 style="margin-top: 0; color: #991b1b;">Delivery Address:</h5>
                  <p>${item.delivery_address_street}</p>
                  <p>${item.delivery_address_city}, ${item.delivery_address_state} ${item.delivery_address_zip}</p>
                </div>
              ` : ''}
              
              ${item.delivery_date ? `
                <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <h5 style="margin-top: 0; color: #991b1b;">Delivery Details:</h5>
                  <p><strong>Date:</strong> ${new Date(item.delivery_date).toLocaleDateString()}</p>
                  ${item.delivery_time_preference ? `<p><strong>Time Preference:</strong> ${item.delivery_time_preference}</p>` : ''}
                  ${item.delivery_instructions ? `<p><strong>Instructions:</strong> ${item.delivery_instructions}</p>` : ''}
                </div>
              ` : ''}
            </div>
          `).join('')}
          
          <div style="background: #fee2e2; padding: 20px; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #dc2626; margin-top: 0;">Action Required</h3>
            <p>Process this order and contact the customer within 24 hours to confirm delivery details.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  } catch (error) {
    logger.error("Error generating internal email template", error);
    return `<h2>New Order</h2><p>Order ID: ${orderData.order_id}</p><p>Customer: ${orderData.customer_email}</p><p>Total: $${orderData.total_amount.toFixed(2)}</p>`;
  }
};
