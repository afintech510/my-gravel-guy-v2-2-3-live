
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  type: 'customer_confirmation' | 'internal_notification';
  orderData?: any;
}

// Email template functions (simplified versions)
const generateCustomerConfirmationEmail = (orderData: any) => {
  const customerName = orderData.customer_name || 'Valued Customer';
  const orderId = orderData.order_id;
  const totalAmount = orderData.total_amount;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - My Gravel Guy</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Thank you for choosing My Gravel Guy</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Hi ${customerName},</h2>
        <p>Great news! Your order has been confirmed and is being processed.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
          <h3 style="margin-top: 0; color: #1e3a8a;">Order Details</h3>
          <p><strong>Order ID:</strong> ${orderId}</p>
          <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
        </div>
        
        <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #166534;">What's Next?</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Our team will prepare your materials</li>
            <li>We'll schedule your delivery</li>
            <li>You'll receive delivery confirmation</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <p>Questions? Contact us:</p>
          <p><strong>Phone:</strong> (555) 123-4567</p>
          <p><strong>Email:</strong> support@mygravelguy.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateInternalNotificationEmail = (orderData: any) => {
  const orderId = orderData.order_id;
  const totalAmount = orderData.total_amount;
  const customerEmail = orderData.customer_email;
  const customerName = orderData.customer_name;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Order Alert - ${orderId}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0; font-size: 24px;">🚨 NEW ORDER ALERT</h1>
      </div>
      
      <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px;">
        <h2 style="color: #dc2626; margin-top: 0;">Order: ${orderId}</h2>
        
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Customer Information</h3>
          <p><strong>Name:</strong> ${customerName || 'Not provided'}</p>
          <p><strong>Email:</strong> ${customerEmail}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Order Summary</h3>
          <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
          <p><strong>Status:</strong> Confirmed - Ready for Processing</p>
        </div>
        
        <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <h3 style="margin-top: 0; color: #92400e;">Action Required</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Review order details in dashboard</li>
            <li>Schedule delivery</li>
            <li>Contact customer if needed</li>
          </ol>
        </div>
      </div>
    </body>
    </html>
  `;
};

const sendEmailViaResend = async (emailData: EmailRequest) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY not configured");
  }

  console.log(`Sending ${emailData.type} email to: ${emailData.to}`);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "team@mygravelguy.com",
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Resend API error:", errorData);
    throw new Error(`Failed to send email: ${response.status} ${errorData}`);
  }

  const result = await response.json();
  console.log(`Email sent successfully:`, result);
  return result;
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
    const { sessionId, orderId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("stripe");
    if (!stripeKey) {
      throw new Error("Stripe secret key not found");
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the session from Stripe to verify payment
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product']
    });
    
    console.log('Retrieved Stripe session:', session);

    if (session.payment_status !== 'paid') {
      throw new Error(`Payment not completed. Status: ${session.payment_status}`);
    }

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

    // Extract order ID from session metadata or generate one
    const finalOrderId = session.metadata?.order_id || orderId || `ORDER-${Date.now()}`;
    
    console.log('Processing order with ID:', finalOrderId);

    // Extract customer info
    const customerEmail = session.customer_details?.email || session.metadata?.customer_email || 'unknown@example.com';
    const customerName = session.customer_details?.name || session.metadata?.customer_name;

    // Process line items and create order records
    const lineItems = session.line_items?.data || [];
    const orderData = {
      order_id: finalOrderId,
      customer_email: customerEmail,
      customer_name: customerName,
      total_amount: (session.amount_total || 0) / 100, // Convert from cents
      items: []
    };

    for (const item of lineItems) {
      const product = item.price?.product as any;
      const productName = product?.name || 'Unknown Product';
      const quantity = item.quantity || 1;
      const unitPrice = (item.price?.unit_amount || 0) / 100;
      const totalPrice = unitPrice * quantity;

      // Extract metadata from session for delivery info
      const deliveryDate = session.metadata?.delivery_date;
      const deliveryAddress = {
        street: session.metadata?.delivery_street || '',
        city: session.metadata?.delivery_city || '',
        state: session.metadata?.delivery_state || '',
        zip: session.metadata?.delivery_zip || ''
      };
      const contactInfo = {
        name: customerName || '',
        email: customerEmail,
        phone: session.metadata?.contact_phone || ''
      };

      // Insert order record into database
      const { data: insertedOrder, error: insertError } = await supabase
        .from('orders')
        .insert({
          order_id: finalOrderId,
          stripe_session_id: sessionId,
          stripe_payment_intent_id: session.payment_intent,
          product_name: productName,
          quantity: quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          delivery_date: deliveryDate,
          delivery_address_street: deliveryAddress.street,
          delivery_address_city: deliveryAddress.city,
          delivery_address_state: deliveryAddress.state,
          delivery_address_zip: deliveryAddress.zip,
          contact_name: contactInfo.name,
          contact_email: contactInfo.email,
          contact_phone: contactInfo.phone,
          delivery_time_preference: session.metadata?.delivery_time_preference,
          delivery_instructions: session.metadata?.delivery_instructions,
          status: 'confirmed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (insertError) {
        console.error('Error inserting order:', insertError);
        throw new Error(`Failed to save order: ${insertError.message}`);
      }

      console.log('Order saved to database:', insertedOrder);

      // Add to order data for emails
      orderData.items.push({
        product_name: productName,
        quantity: quantity,
        total_price: totalPrice,
        delivery_date: deliveryDate,
        delivery_address: deliveryAddress,
        contact_info: contactInfo,
        delivery_time_preference: session.metadata?.delivery_time_preference,
        delivery_instructions: session.metadata?.delivery_instructions
      });
    }

    // Send customer confirmation email
    console.log('Sending customer confirmation email...');
    try {
      const customerEmailHtml = generateCustomerConfirmationEmail(orderData);
      await sendEmailViaResend({
        to: customerEmail,
        subject: `Order Confirmation - ${finalOrderId} 📦`,
        html: customerEmailHtml,
        type: 'customer_confirmation',
        orderData
      });
      console.log('Customer email sent successfully');
    } catch (emailError) {
      console.error('Failed to send customer email:', emailError);
      // Don't fail the entire process if email fails
    }

    // Send internal notification email
    console.log('Sending internal notification email...');
    try {
      const internalEmailHtml = generateInternalNotificationEmail(orderData);
      await sendEmailViaResend({
        to: 'order.support@mygravelguy.com',
        subject: `🚨 New Order: ${finalOrderId} - $${orderData.total_amount.toFixed(2)}`,
        html: internalEmailHtml,
        type: 'internal_notification',
        orderData
      });
      console.log('Internal email sent successfully');
    } catch (emailError) {
      console.error('Failed to send internal email:', emailError);
      // Don't fail the entire process if email fails
    }

    // Fetch the complete order details to return
    const { data: orderItems, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching order details:', fetchError);
      throw new Error(`Failed to fetch order details: ${fetchError.message}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        orders: orderItems,
        orderId: finalOrderId,
        paymentStatus: session.payment_status,
        emailsSent: true
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Payment verification error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
