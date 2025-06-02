
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
    const { sessionId, orderId } = await req.json();
    
    console.log('=== VERIFY PAYMENT DEBUG START ===');
    console.log('Session ID:', sessionId);
    console.log('Order ID:', orderId);
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.error("Stripe secret key not found in environment");
      throw new Error("Stripe secret key not found");
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve the session from Stripe to verify payment
    console.log('Retrieving Stripe session...');
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product']
    });
    
    console.log('Stripe session retrieved:', {
      id: session.id,
      payment_status: session.payment_status,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total
    });

    if (session.payment_status !== 'paid') {
      throw new Error(`Payment not completed. Status: ${session.payment_status}`);
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase configuration missing");
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Extract order ID from session metadata or generate one
    const finalOrderId = session.metadata?.order_id || orderId || `ORDER-${Date.now()}`;
    
    console.log('Processing order with ID:', finalOrderId);

    // Extract customer info
    const customerEmail = session.customer_details?.email || session.metadata?.customer_email || 'unknown@example.com';
    const customerName = session.customer_details?.name || session.metadata?.customer_name || 'Customer';

    // Process line items and create order records
    const lineItems = session.line_items?.data || [];
    const orderItems = [];
    
    console.log('Processing line items:', lineItems.length);

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
        name: customerName,
        email: customerEmail,
        phone: session.metadata?.contact_phone || ''
      };

      console.log('=== DATABASE INSERT DEBUG ===');
      console.log('Inserting order record:', {
        order_id: finalOrderId,
        product_name: productName,
        quantity: quantity,
        total_price: totalPrice
      });

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
      };

      console.log('Order record to insert:', JSON.stringify(orderRecord, null, 2));

      const { data: insertedOrder, error: insertError } = await supabase
        .from('orders')
        .insert(orderRecord)
        .select();

      if (insertError) {
        console.error('=== DATABASE INSERT ERROR ===');
        console.error('Insert error:', insertError);
        console.error('Insert error message:', insertError.message);
        console.error('Insert error details:', insertError.details);
        console.error('Insert error hint:', insertError.hint);
        console.error('Insert error code:', insertError.code);
      } else {
        console.log('=== DATABASE INSERT SUCCESS ===');
        console.log('Order saved successfully:', insertedOrder);
      }

      orderItems.push({
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

    // Prepare order data for emails
    const orderData = {
      order_id: finalOrderId,
      customer_email: customerEmail,
      customer_name: customerName,
      total_amount: (session.amount_total || 0) / 100,
      items: orderItems
    };

    console.log('=== EMAIL SENDING DEBUG ===');
    console.log('Order data for emails:', JSON.stringify(orderData, null, 2));

    // Generate email HTML content
    const generateCustomerEmail = (data: any) => {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Order Confirmation - My Gravel Guy</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Order Confirmed! 🎉</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Thank you for choosing My Gravel Guy</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">Hi ${data.customer_name || 'Valued Customer'},</h2>
            <p>Great news! Your order has been confirmed and is being processed.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
              <h3 style="margin-top: 0; color: #1e3a8a;">Order Details</h3>
              <p><strong>Order ID:</strong> ${data.order_id}</p>
              <p><strong>Total Amount:</strong> $${data.total_amount.toFixed(2)}</p>
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

    const generateInternalEmail = (data: any) => {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>New Order Alert - ${data.order_id}</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">🚨 NEW ORDER ALERT</h1>
          </div>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #dc2626; margin-top: 0;">Order: ${data.order_id}</h2>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin-top: 0;">Customer Information</h3>
              <p><strong>Name:</strong> ${data.customer_name || 'Not provided'}</p>
              <p><strong>Email:</strong> ${data.customer_email}</p>
            </div>
            
            <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
              <h3 style="margin-top: 0;">Order Summary</h3>
              <p><strong>Total Amount:</strong> $${data.total_amount.toFixed(2)}</p>
              <p><strong>Status:</strong> Confirmed - Ready for Processing</p>
            </div>
          </div>
        </body>
        </html>
      `;
    };

    // Send customer confirmation email
    let customerEmailSent = false;
    try {
      console.log('=== SENDING CUSTOMER EMAIL ===');
      console.log('Customer email address:', customerEmail);
      
      const customerEmailHtml = generateCustomerEmail(orderData);
      
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
        console.error('=== CUSTOMER EMAIL ERROR ===');
        console.error('Error:', customerEmailError);
        console.error('Error message:', customerEmailError.message);
        console.error('Error details:', JSON.stringify(customerEmailError, null, 2));
      } else {
        console.log('=== CUSTOMER EMAIL SUCCESS ===');
        console.log('Response:', customerEmailData);
        customerEmailSent = true;
      }
    } catch (emailError) {
      console.error('=== CUSTOMER EMAIL EXCEPTION ===');
      console.error('Exception:', emailError);
      console.error('Exception message:', emailError.message);
    }

    // Send internal notification email
    let internalEmailSent = false;
    try {
      console.log('=== SENDING INTERNAL EMAIL ===');
      
      const internalEmailHtml = generateInternalEmail(orderData);
      
      const { data: internalEmailData, error: internalEmailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'order.support@mygravelguy.com',
          subject: `🚨 New Order: ${finalOrderId} - $${orderData.total_amount.toFixed(2)}`,
          html: internalEmailHtml,
          type: 'internal_notification',
          orderData
        }
      });

      if (internalEmailError) {
        console.error('=== INTERNAL EMAIL ERROR ===');
        console.error('Error:', internalEmailError);
        console.error('Error message:', internalEmailError.message);
        console.error('Error details:', JSON.stringify(internalEmailError, null, 2));
      } else {
        console.log('=== INTERNAL EMAIL SUCCESS ===');
        console.log('Response:', internalEmailData);
        internalEmailSent = true;
      }
    } catch (emailError) {
      console.error('=== INTERNAL EMAIL EXCEPTION ===');
      console.error('Exception:', emailError);
      console.error('Exception message:', emailError.message);
    }

    // Fetch the complete order details to return
    const { data: orderDetailsResult, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', sessionId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching order details:', fetchError);
    }

    console.log('=== FINAL SUMMARY ===');
    console.log('Customer email sent:', customerEmailSent);
    console.log('Internal email sent:', internalEmailSent);
    console.log('Orders in database:', orderDetailsResult?.length || 0);
    console.log('=== VERIFY PAYMENT DEBUG END ===');

    return new Response(
      JSON.stringify({ 
        success: true,
        orders: orderDetailsResult || [],
        orderId: finalOrderId,
        paymentStatus: session.payment_status,
        emailsSent: customerEmailSent && internalEmailSent,
        customerEmailSent,
        internalEmailSent
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("=== PAYMENT VERIFICATION ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", JSON.stringify(error, null, 2));
    
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
