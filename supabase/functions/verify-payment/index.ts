
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Enhanced logging system for comprehensive debugging
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

// Helper function to extract and validate order data from Stripe metadata
const extractOrderDataFromMetadata = (metadata: any, customerEmail: string, customerName?: string) => {
  logger.debug("Extracting order data from metadata", metadata);
  
  const orderItems = [];
  const itemIndices = new Set();
  
  // Find all item indices in metadata
  Object.keys(metadata).forEach(key => {
    const match = key.match(/^item_(\d+)_/);
    if (match) {
      itemIndices.add(parseInt(match[1]));
    }
  });
  
  logger.info(`Found ${itemIndices.size} items in metadata`);
  
  // Extract data for each item
  itemIndices.forEach(index => {
    const item = {
      product_id: metadata[`item_${index}_product_id`] || '',
      product_name: metadata[`item_${index}_product_name`] || 'Unknown Product',
      material_category: metadata[`item_${index}_material_category`] || null,
      quantity_tons: parseFloat(metadata[`item_${index}_quantity_tons`]) || 0,
      quantity_yards: parseFloat(metadata[`item_${index}_quantity_yards`]) || null,
      unit_price: parseFloat(metadata[`item_${index}_unit_price`]) || 0,
      total_price: parseFloat(metadata[`item_${index}_total_price`]) || 0,
      material_size: metadata[`item_${index}_material_size`] || null,
      delivery_date: metadata[`item_${index}_delivery_date`] || null,
      delivery_address_street: metadata[`item_${index}_delivery_address_street`] || null,
      delivery_address_city: metadata[`item_${index}_delivery_address_city`] || null,
      delivery_address_state: metadata[`item_${index}_delivery_address_state`] || null,
      delivery_address_zip: metadata[`item_${index}_delivery_address_zip`] || null,
      contact_name: metadata[`item_${index}_contact_name`] || customerName || null,
      contact_phone: metadata[`item_${index}_contact_phone`] || null,
      contact_email: metadata[`item_${index}_contact_email`] || customerEmail || null,
      delivery_time_preference: metadata[`item_${index}_delivery_time_preference`] || null,
      delivery_instructions: metadata[`item_${index}_delivery_instructions`] || null,
      customer_email: customerEmail,
      customer_name: customerName || metadata[`item_${index}_contact_name`] || null
    };
    
    orderItems.push(item);
    logger.debug(`Extracted item ${index}`, item);
  });
  
  return orderItems;
};

// Helper function to send order confirmation emails
const sendOrderEmails = async (orderData: any) => {
  try {
    logger.info("Attempting to send order confirmation emails");
    
    // Calculate total amount for email
    const totalAmount = orderData.items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0);
    
    const emailData = {
      order_id: orderData.order_id,
      items: orderData.items,
      total_amount: totalAmount,
      customer_email: orderData.customer_email,
      customer_name: orderData.customer_name
    };
    
    logger.debug("Email data prepared", emailData);
    
    // Send emails using the existing email service pattern
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );
    
    // Send customer confirmation email
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
    const internalEmailResult = await supabase.functions.invoke('send-email', {
      body: {
        to: 'order.support@mygravelguy.com',
        subject: `🚨 New Order: ${emailData.order_id} - $${totalAmount.toFixed(2)}`,
        html: generateInternalEmailTemplate(emailData),
        type: 'internal_notification',
        orderData: emailData
      }
    });
    
    logger.info("Email sending completed", {
      customerEmail: customerEmailResult.error ? 'failed' : 'success',
      internalEmail: internalEmailResult.error ? 'failed' : 'success'
    });
    
    return {
      customerEmailSent: !customerEmailResult.error,
      internalEmailSent: !internalEmailResult.error
    };
    
  } catch (error) {
    logger.error("Failed to send order emails", error);
    return {
      customerEmailSent: false,
      internalEmailSent: false,
      emailError: error.message
    };
  }
};

// Simple email templates (basic versions)
const generateCustomerEmailTemplate = (orderData: any) => {
  return `
    <h2>Order Confirmation</h2>
    <p>Thank you for your order!</p>
    <p><strong>Order ID:</strong> ${orderData.order_id}</p>
    <p><strong>Total:</strong> $${orderData.total_amount.toFixed(2)}</p>
    <h3>Items:</h3>
    <ul>
      ${orderData.items.map((item: any) => `
        <li>${item.product_name} - ${item.quantity_tons} tons - $${item.total_price.toFixed(2)}</li>
      `).join('')}
    </ul>
    <p>We'll process your order and contact you with delivery details.</p>
  `;
};

const generateInternalEmailTemplate = (orderData: any) => {
  return `
    <h2>New Order Received</h2>
    <p><strong>Order ID:</strong> ${orderData.order_id}</p>
    <p><strong>Customer:</strong> ${orderData.customer_name || 'N/A'} (${orderData.customer_email})</p>
    <p><strong>Total:</strong> $${orderData.total_amount.toFixed(2)}</p>
    <h3>Items:</h3>
    <ul>
      ${orderData.items.map((item: any) => `
        <li>${item.product_name} - ${item.quantity_tons} tons - $${item.total_price.toFixed(2)}</li>
      `).join('')}
    </ul>
  `;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  logger.info("=== VERIFY PAYMENT FUNCTION STARTED ===");

  try {
    // Step 1: Environment validation
    logger.info("Step 1: Validating environment variables");
    
    const stripeKey = Deno.env.get("stripe");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!stripeKey) {
      logger.error("Stripe secret key not found in environment");
      throw new Error("Stripe secret key not configured");
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      logger.error("Supabase environment variables missing");
      throw new Error("Supabase not properly configured");
    }
    
    logger.info("Environment variables validated successfully");

    // Step 2: Parse request body
    logger.info("Step 2: Parsing request body");
    
    const requestBody = await req.json();
    logger.debug("Request body received", requestBody);
    
    const { sessionId } = requestBody;
    
    if (!sessionId) {
      logger.error("Session ID missing from request");
      throw new Error("Session ID is required");
    }
    
    logger.info(`Processing payment verification for session: ${sessionId}`);

    // Step 3: Initialize Stripe
    logger.info("Step 3: Initializing Stripe client");
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Step 4: Retrieve Stripe session
    logger.info("Step 4: Retrieving Stripe checkout session");
    
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer']
    });

    logger.info("Stripe session retrieved", {
      id: session.id,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total,
      metadata_keys: Object.keys(session.metadata || {})
    });

    // Step 5: Verify payment status
    logger.info("Step 5: Verifying payment status");
    
    if (session.payment_status !== 'paid') {
      logger.info(`Payment not completed. Status: ${session.payment_status}`);
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

    logger.info("Payment confirmed as successful");

    // Step 6: Extract order ID and validate metadata
    logger.info("Step 6: Extracting order data from metadata");
    
    const orderId = session.metadata?.order_id;
    if (!orderId) {
      logger.error("Order ID not found in session metadata");
      throw new Error('Order ID not found in payment session');
    }

    const customerEmail = session.customer_details?.email;
    const customerName = session.customer_details?.name;
    
    if (!customerEmail) {
      logger.error("Customer email not found in session");
      throw new Error('Customer email not found in payment session');
    }

    logger.info("Order identification successful", {
      orderId,
      customerEmail,
      customerName
    });

    // Step 7: Extract order items from metadata
    logger.info("Step 7: Processing order items from metadata");
    
    const orderItems = extractOrderDataFromMetadata(session.metadata, customerEmail, customerName);
    
    if (orderItems.length === 0) {
      logger.error("No order items found in metadata");
      throw new Error('No order items found in payment session');
    }

    logger.info(`Successfully extracted ${orderItems.length} order items`);

    // Step 8: Initialize Supabase client
    logger.info("Step 8: Initializing Supabase client");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Step 9: Insert order records into database
    logger.info("Step 9: Creating order records in database");
    
    const orderRecords = orderItems.map(item => ({
      order_id: orderId,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: session.payment_intent?.id || null,
      product_id: item.product_id,
      product_name: item.product_name,
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

    logger.debug("Order records prepared for insertion", orderRecords);

    const { data: insertedOrders, error: insertError } = await supabase
      .from('orders')
      .insert(orderRecords)
      .select();

    if (insertError) {
      logger.error('Failed to insert order records', insertError);
      throw new Error(`Database error: ${insertError.message}`);
    }

    logger.info(`Successfully inserted ${insertedOrders?.length || 0} order records`);

    // Step 10: Send confirmation emails
    logger.info("Step 10: Sending confirmation emails");
    
    const emailResults = await sendOrderEmails({
      order_id: orderId,
      items: orderItems,
      customer_email: customerEmail,
      customer_name: customerName
    });

    logger.info("Email sending completed", emailResults);

    // Step 11: Return success response
    logger.info("Step 11: Preparing success response");
    
    const response = {
      success: true,
      payment_status: session.payment_status,
      order_id: orderId,
      customer_email: customerEmail,
      orders_created: insertedOrders?.length || 0,
      emails_sent: {
        customer: emailResults.customerEmailSent,
        internal: emailResults.internalEmailSent
      }
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
      name: error.name
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
