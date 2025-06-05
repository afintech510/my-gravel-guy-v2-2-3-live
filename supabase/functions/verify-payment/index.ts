
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Enhanced logging function
const logStep = (step: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [VERIFY-PAYMENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

// Email template functions moved to this file for direct access
function generateCustomerConfirmationEmail(data: any) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDeliveryTime = (preference?: string) => {
    switch (preference) {
      case 'anytime': return 'Anytime (7am-5pm)';
      case 'morning': return 'Morning (7am-12pm)';
      case 'afternoon': return 'Afternoon (12pm-5pm)';
      default: return 'Not specified';
    }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - ${data.order_id}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .order-item { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border: 1px solid #e2e8f0; }
        .delivery-info { background-color: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #0ea5e9; margin-top: 10px; }
        .total { background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 2px solid #10b981; text-align: right; }
        .footer { background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; font-size: 28px;">🪨 My Gravel Guy</h1>
        <p style="margin: 10px 0 0; font-size: 16px;">Thank you for your order!</p>
      </div>
      
      <div class="content">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="width: 60px; height: 60px; background-color: #10b981; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 24px;">✓</span>
          </div>
          <h2 style="color: #1f2937; margin: 0 0 10px 0;">Order Confirmed!</h2>
          <p style="color: #6b7280; margin: 0;">We've received your order and are preparing it for delivery</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #10b981;">📋 Order Details</h3>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px;">
            <p><strong>Order ID:</strong> ${data.order_id}</p>
            <p><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p><strong>Customer:</strong> ${data.customer_name || 'Valued Customer'}</p>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">📦 Your Items</h3>
          ${data.items.map((item: any) => `
            <div class="order-item">
              <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 15px;">
                <h4 style="color: #1f2937; margin: 0 0 8px 0;">${item.product_name}</h4>
                <div style="display: flex; justify-content: space-between;">
                  <p style="color: #6b7280; margin: 0;">Quantity: ${item.quantity} tons</p>
                  <p style="color: #10b981; font-weight: bold; margin: 0;">$${item.total_price.toFixed(2)}</p>
                </div>
              </div>
              
              ${item.delivery_address_street ? `
                <div class="delivery-info">
                  <h5 style="color: #0c4a6e; margin: 0 0 10px 0;">🚚 Delivery Information</h5>
                  <p style="color: #1e40af; margin: 2px 0;"><strong>📅 Date:</strong> ${formatDate(item.delivery_date)}</p>
                  <p style="color: #1e40af; margin: 2px 0;"><strong>🕒 Time:</strong> ${formatDeliveryTime(item.delivery_time_preference)}</p>
                  <p style="color: #1e40af; margin: 2px 0;"><strong>📍 Address:</strong><br>
                    ${item.delivery_address_street}<br>
                    ${item.delivery_address_city}, ${item.delivery_address_state} ${item.delivery_address_zip}
                  </p>
                  ${item.delivery_instructions ? `
                    <p style="color: #1e40af; margin: 10px 0 0 0;"><strong>📝 Special Instructions:</strong> ${item.delivery_instructions}</p>
                  ` : ''}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <div class="total">
          <p style="color: #1f2937; font-size: 20px; font-weight: bold; margin: 0;">
            Total: <span style="color: #10b981;">$${data.total_amount.toFixed(2)}</span>
          </p>
        </div>

        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
          <h3 style="color: #92400e; margin: 0 0 15px 0;">🎯 What's Next?</h3>
          <ol style="color: #92400e; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Your order is being processed by our team</li>
            <li style="margin-bottom: 8px;">We'll prepare your materials for delivery</li>
            <li style="margin-bottom: 8px;">Our driver will deliver on your scheduled date</li>
            <li>You'll receive tracking updates via email</li>
          </ol>
        </div>
      </div>

      <div class="footer">
        <h3 style="color: #1f2937; margin: 0 0 10px 0;">Need Help?</h3>
        <p style="color: #6b7280; margin: 0 0 15px 0;">Our customer service team is here to help</p>
        <p style="color: #374151; margin: 5px 0;">📞 <strong>Phone:</strong> (555) 123-4567</p>
        <p style="color: #374151; margin: 5px 0;">✉️ <strong>Email:</strong> support@mygravelguy.com</p>
        <p style="color: #374151; margin: 5px 0;">🕒 <strong>Hours:</strong> Mon-Fri, 8am-5pm</p>
      </div>
    </body>
    </html>
  `;
}

function generateInternalNotificationEmail(data: any) {
  const getUrgencyLevel = (totalAmount: number) => {
    if (totalAmount >= 1000) return { level: 'HIGH', color: '#dc2626', emoji: '🔴' };
    if (totalAmount >= 500) return { level: 'MEDIUM', color: '#f59e0b', emoji: '🟡' };
    return { level: 'NORMAL', color: '#10b981', emoji: '🟢' };
  };

  const urgency = getUrgencyLevel(data.total_amount);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>🚨 New Order: ${data.order_id}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
        .alert { background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 15px; margin-bottom: 25px; text-align: center; }
        .order-overview { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid ${urgency.color}; }
        .customer-info { background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #0ea5e9; }
        .order-item { background-color: white; padding: 20px; margin: 15px 0; border-radius: 8px; border: 1px solid #e2e8f0; }
        .delivery-info { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 10px; }
        .action-items { background-color: #fee2e2; padding: 20px; border-radius: 8px; border: 2px solid #dc2626; margin-bottom: 25px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; font-size: 28px;">🪨 My Gravel Guy</h1>
        <p style="margin: 10px 0 0; font-size: 16px;">New Order Received</p>
      </div>
      
      <div class="content">
        <div class="alert">
          <h2 style="color: #dc2626; margin: 0 0 5px 0;">🚨 ACTION REQUIRED</h2>
          <p style="color: #7f1d1d; margin: 0;">New order requiring immediate attention</p>
        </div>

        <div class="order-overview">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h3 style="color: #1f2937; margin: 0 0 10px 0;">Order ${data.order_id}</h3>
              <p style="color: #6b7280; margin: 0;">Received: ${new Date().toLocaleString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</p>
            </div>
            <div style="text-align: right;">
              <div style="background-color: ${urgency.color}; color: white; padding: 8px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 5px;">
                ${urgency.emoji} ${urgency.level} PRIORITY
              </div>
              <p style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 0;">$${data.total_amount.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div class="customer-info">
          <h3 style="color: #0c4a6e; margin: 0 0 15px 0;">👤 Customer Information</h3>
          <p style="color: #0c4a6e; margin: 5px 0;">
            <strong>📧 Email:</strong> <a href="mailto:${data.customer_email}" style="color: #0ea5e9;">${data.customer_email}</a>
          </p>
          ${data.customer_name ? `<p style="color: #0c4a6e; margin: 5px 0;"><strong>👤 Name:</strong> ${data.customer_name}</p>` : ''}
          ${data.items[0]?.contact_phone ? `
            <p style="color: #0c4a6e; margin: 5px 0;">
              <strong>📞 Phone:</strong> <a href="tel:${data.items[0].contact_phone}" style="color: #0ea5e9;">${data.items[0].contact_phone}</a>
            </p>
          ` : ''}
        </div>

        <div style="margin-bottom: 25px;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">📦 Order Items (${data.items.length})</h3>
          ${data.items.map((item: any) => `
            <div class="order-item">
              <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between;">
                  <div>
                    <h4 style="color: #1f2937; margin: 0 0 5px 0;">${item.product_name}</h4>
                    <p style="color: #6b7280; margin: 0;">Quantity: ${item.quantity} tons</p>
                  </div>
                  <p style="color: #dc2626; font-size: 18px; font-weight: bold; margin: 0;">$${item.total_price.toFixed(2)}</p>
                </div>
              </div>

              ${item.delivery_address_street ? `
                <div class="delivery-info">
                  <h5 style="color: #92400e; margin: 0 0 10px 0;">🚚 Delivery Details</h5>
                  ${item.delivery_date ? `<p style="color: #92400e; margin: 2px 0;"><strong>📅 Date:</strong> ${new Date(item.delivery_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>` : ''}
                  ${item.delivery_time_preference ? `<p style="color: #92400e; margin: 2px 0;"><strong>🕒 Time:</strong> ${item.delivery_time_preference}</p>` : ''}
                  <p style="color: #92400e; margin: 2px 0;"><strong>📍 Address:</strong><br>
                    ${item.delivery_address_street}<br>
                    ${item.delivery_address_city}, ${item.delivery_address_state} ${item.delivery_address_zip}
                  </p>
                  ${item.delivery_instructions ? `<p style="color: #92400e; margin: 10px 0 0 0;"><strong>📝 Instructions:</strong> ${item.delivery_instructions}</p>` : ''}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>

        <div class="action-items">
          <h3 style="color: #dc2626; margin: 0 0 15px 0;">⚠️ IMMEDIATE ACTION REQUIRED</h3>
          <ul style="color: #7f1d1d; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;"><strong>Review order details</strong> and verify inventory availability</li>
            <li style="margin-bottom: 8px;"><strong>Contact customer</strong> if delivery details need clarification</li>
            <li style="margin-bottom: 8px;"><strong>Schedule delivery</strong> with operations team</li>
            <li style="margin-bottom: 8px;"><strong>Update order status</strong> in the dashboard system</li>
            <li><strong>Send confirmation</strong> to customer within 2 hours</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:${data.customer_email}?subject=Order%20${data.order_id}%20-%20Delivery%20Confirmation" 
             style="background-color: #10b981; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px; display: inline-block;">
            📧 Email Customer
          </a>
          ${data.items[0]?.contact_phone ? `
            <a href="tel:${data.items[0].contact_phone}"
               style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 0 10px; display: inline-block;">
              📞 Call Customer
            </a>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    logStep('=== VERIFY PAYMENT FUNCTION START ===');
    
    const requestBody = await req.json();
    logStep('Request received', { 
      sessionId: requestBody.sessionId, 
      orderId: requestBody.orderId,
      fallbackMode: requestBody.fallbackMode,
      hasBackupData: !!requestBody.backupData
    });
    
    const { sessionId, orderId, fallbackMode, backupData } = requestBody;
    
    // Environment validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    logStep('Environment check', {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseServiceKey: !!supabaseServiceKey,
      hasStripeKey: !!stripeKey,
      hasResendApiKey: !!resendApiKey
    });
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    let session = null;
    let finalOrderId = orderId;
    let customerEmail = null;
    let customerName = 'Customer';
    let orderItems = [];
    let totalAmount = 0;

    // Try to retrieve Stripe session if sessionId is provided
    if (sessionId && stripeKey) {
      try {
        logStep('Retrieving Stripe session', { sessionId });
        
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
        session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items.data.price.product', 'customer', 'payment_intent']
        });
        
        logStep('Stripe session retrieved', {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          amountTotal: session.amount_total,
          customerDetailsEmail: session.customer_details?.email,
          customerDetailsName: session.customer_details?.name
        });

        // Enhanced customer email extraction
        let extractedEmail = null;
        let emailSource = 'none';
        
        if (session.customer_details?.email) {
          extractedEmail = session.customer_details.email;
          emailSource = 'customer_details';
        } else if (session.customer && typeof session.customer === 'object') {
          extractedEmail = session.customer.email;
          emailSource = 'customer_object';
        } else if (session.payment_intent) {
          try {
            let paymentIntent;
            if (typeof session.payment_intent === 'string') {
              paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
            } else {
              paymentIntent = session.payment_intent;
            }
            if (paymentIntent.receipt_email) {
              extractedEmail = paymentIntent.receipt_email;
              emailSource = 'payment_intent_receipt';
            }
          } catch (piError) {
            logStep('Could not retrieve payment intent for email', { error: piError.message });
          }
        } else if (session.customer_email) {
          extractedEmail = session.customer_email;
          emailSource = 'deprecated_customer_email';
        }
        
        logStep('Email extraction results', { 
          extractedEmail, 
          emailSource,
          isValidFormat: extractedEmail ? extractedEmail.includes('@') : false
        });

        // Validate extracted email
        if (extractedEmail && extractedEmail.includes('@') && extractedEmail.includes('.')) {
          customerEmail = extractedEmail;
        } else {
          logStep('Invalid or missing email', { extractedEmail });
          customerEmail = null;
        }

        finalOrderId = session.metadata?.order_id || orderId || `ORDER-${Date.now()}`;
        customerName = session.customer_details?.name || 'Customer';
        totalAmount = (session.amount_total || 0) / 100;

        // Process line items and save to database
        const lineItems = session.line_items?.data || [];
        logStep('Processing line items', { count: lineItems.length });

        for (const item of lineItems) {
          const product = item.price?.product as any;
          const productName = product?.name || 'Unknown Product';
          const quantity = item.quantity || 1;
          const unitPrice = (item.price?.unit_amount || 0) / 100;
          const totalPrice = unitPrice * quantity;

          logStep('Processing item', { productName, quantity, unitPrice, totalPrice });

          // Extract delivery info from metadata
          const deliveryDate = session.metadata?.delivery_date || null;
          const deliveryStreet = session.metadata?.delivery_street || null;
          const deliveryCity = session.metadata?.delivery_city || null;
          const deliveryState = session.metadata?.delivery_state || null;
          const deliveryZip = session.metadata?.delivery_zip || null;

          // Insert order record into database
          const orderRecord = {
            order_id: finalOrderId,
            stripe_session_id: sessionId,
            stripe_payment_intent_id: session.payment_intent,
            product_name: productName,
            quantity: quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            delivery_date: deliveryDate,
            delivery_street: deliveryStreet,
            delivery_city: deliveryCity,
            delivery_state: deliveryState,
            delivery_zip: deliveryZip,
            customer_email: customerEmail,
            customer_name: customerName,
            status: 'confirmed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          logStep('Inserting order record', orderRecord);

          const { data: insertedOrder, error: insertError } = await supabase
            .from('orders')
            .insert(orderRecord)
            .select();

          if (insertError) {
            logStep('Database insert error', insertError);
            throw new Error(`Database error: ${insertError.message}`);
          } else {
            logStep('Order saved successfully', { orderId: insertedOrder?.[0]?.id });
          }

          orderItems.push({
            id: insertedOrder?.[0]?.id || `temp-${Date.now()}`,
            order_id: finalOrderId,
            product_name: productName,
            quantity: quantity,
            total_price: totalPrice,
            delivery_date: deliveryDate,
            delivery_address_street: deliveryStreet,
            delivery_address_city: deliveryCity,
            delivery_address_state: deliveryState,
            delivery_address_zip: deliveryZip,
            contact_name: customerName,
            contact_email: customerEmail,
            contact_phone: session.metadata?.contact_phone || null,
            delivery_time_preference: session.metadata?.delivery_time_preference || null,
            delivery_instructions: session.metadata?.delivery_instructions || null,
            status: 'confirmed'
          });
        }
      } catch (stripeError) {
        logStep('Stripe session retrieval failed', { error: stripeError.message });
        // Continue with fallback processing
      }
    }

    // Fallback mode: use backup data or find existing orders
    if ((fallbackMode || !session) && finalOrderId) {
      logStep('Using fallback mode', { finalOrderId });
      
      const { data: existingOrders, error: queryError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', finalOrderId)
        .order('created_at', { ascending: true });

      if (!queryError && existingOrders && existingOrders.length > 0) {
        logStep('Found existing orders', { count: existingOrders.length });
        
        orderItems = existingOrders.map(order => ({
          id: order.id,
          order_id: order.order_id,
          product_name: order.product_name,
          quantity: order.quantity,
          total_price: order.total_price,
          delivery_date: order.delivery_date,
          delivery_address_street: order.delivery_street || null,
          delivery_address_city: order.delivery_city || null,
          delivery_address_state: order.delivery_state || null,
          delivery_address_zip: order.delivery_zip || null,
          contact_name: order.customer_name || customerName,
          contact_email: order.customer_email || customerEmail,
          contact_phone: null,
          delivery_time_preference: null,
          delivery_instructions: null,
          status: order.status
        }));
        
        totalAmount = existingOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);
        if (existingOrders[0]?.customer_email) {
          customerEmail = existingOrders[0].customer_email;
        }
        if (existingOrders[0]?.customer_name) {
          customerName = existingOrders[0].customer_name;
        }
      }
    }

    // Send emails with proper error handling
    let customerEmailSent = false;
    let internalEmailSent = false;
    let emailErrors = [];

    logStep('Email sending phase', { 
      orderItemsCount: orderItems.length,
      customerEmail,
      hasResendApiKey: !!resendApiKey
    });

    if (orderItems.length > 0) {
      const orderData = {
        order_id: finalOrderId,
        customer_email: customerEmail || 'no-email@customer.com',
        customer_name: customerName,
        total_amount: totalAmount,
        items: orderItems
      };

      // Send customer confirmation email if we have a valid email
      if (customerEmail && customerEmail.includes('@') && resendApiKey) {
        try {
          logStep('Sending customer email', { recipient: customerEmail });
          
          const customerEmailHtml = generateCustomerConfirmationEmail(orderData);
          
          const { data: customerEmailData, error: customerEmailError } = await supabase.functions.invoke('send-email', {
            body: {
              to: customerEmail,
              subject: `Order Confirmation - ${finalOrderId} 📦`,
              html: customerEmailHtml,
              type: 'customer_confirmation',
              orderData
            }
          });

          if (customerEmailError) {
            logStep('Customer email error', customerEmailError);
            emailErrors.push(`Customer email error: ${customerEmailError.message}`);
          } else {
            logStep('Customer email sent successfully');
            customerEmailSent = true;
          }
        } catch (emailError) {
          logStep('Customer email exception', { error: emailError.message });
          emailErrors.push(`Customer email exception: ${emailError.message}`);
        }
      } else {
        logStep('Skipping customer email', { 
          reason: !customerEmail ? 'no email' : !resendApiKey ? 'no api key' : 'invalid format',
          customerEmail,
          hasResendApiKey: !!resendApiKey
        });
      }

      // Always send internal notification email if Resend is configured
      if (resendApiKey) {
        try {
          logStep('Sending internal email');
          
          const internalEmailHtml = generateInternalNotificationEmail(orderData);
          
          const { data: internalEmailData, error: internalEmailError } = await supabase.functions.invoke('send-email', {
            body: {
              to: 'order.support@mygravelguy.com',
              subject: `🚨 New Order: ${finalOrderId} - $${totalAmount.toFixed(2)}`,
              html: internalEmailHtml,
              type: 'internal_notification',
              orderData
            }
          });

          if (internalEmailError) {
            logStep('Internal email error', internalEmailError);
            emailErrors.push(`Internal email error: ${internalEmailError.message}`);
          } else {
            logStep('Internal email sent successfully');
            internalEmailSent = true;
          }
        } catch (emailError) {
          logStep('Internal email exception', { error: emailError.message });
          emailErrors.push(`Internal email exception: ${emailError.message}`);
        }
      } else {
        logStep('Skipping internal email - no Resend API key configured');
        emailErrors.push('Internal email skipped - no Resend API key configured');
      }
    } else {
      logStep('Skipping email sending - no order items found');
      emailErrors.push('No order items found for email sending');
    }

    logStep('=== VERIFICATION COMPLETE ===', {
      orderId: finalOrderId,
      customerEmailSent,
      internalEmailSent,
      orderCount: orderItems.length,
      customerEmailAvailable: !!customerEmail,
      emailErrors: emailErrors.length > 0 ? emailErrors : null
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        orders: orderItems,
        orderId: finalOrderId,
        paymentStatus: session?.payment_status || 'processed',
        emailsSent: customerEmailSent && internalEmailSent,
        customerEmailSent,
        internalEmailSent,
        customerEmailAvailable: !!customerEmail,
        customerEmail: customerEmail,
        emailErrors: emailErrors.length > 0 ? emailErrors : null,
        debugInfo: {
          hasStripeKey: !!stripeKey,
          hasResendKey: !!resendApiKey,
          sessionProcessed: !!session,
          fallbackUsed: fallbackMode || !session
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    logStep("=== PAYMENT VERIFICATION ERROR ===", {
      message: error.message,
      stack: error.stack
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false,
        details: "Payment verification failed",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
