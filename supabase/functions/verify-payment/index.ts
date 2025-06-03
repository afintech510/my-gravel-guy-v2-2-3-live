
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
    const requestBody = await req.json();
    const { sessionId, orderId, fallbackMode, backupData } = requestBody;
    
    console.log('=== VERIFY PAYMENT DEBUG START ===');
    console.log('Request body:', { sessionId, orderId, fallbackMode, hasBackupData: !!backupData });
    
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

    let session = null;
    let finalOrderId = orderId;
    let customerEmail = 'customer@example.com';
    let customerName = 'Customer';
    let orderItems = [];
    let totalAmount = 0;

    // Try to retrieve Stripe session if sessionId is provided
    if (sessionId) {
      try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) {
          console.error("Stripe secret key not found in environment");
          throw new Error("Stripe secret key not found");
        }
        
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

        console.log('Retrieving Stripe session...');
        session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items.data.price.product']
        });
        
        console.log('Stripe session retrieved:', {
          id: session.id,
          payment_status: session.payment_status,
          customer_email: session.customer_details?.email,
          amount_total: session.amount_total
        });

        // Extract order details from session
        finalOrderId = session.metadata?.order_id || orderId || `ORDER-${Date.now()}`;
        customerEmail = session.customer_details?.email || 'customer@example.com';
        customerName = session.customer_details?.name || 'Customer';
        totalAmount = (session.amount_total || 0) / 100;

        // Process line items and save to database
        const lineItems = session.line_items?.data || [];
        console.log('Processing line items:', lineItems.length);

        for (const item of lineItems) {
          const product = item.price?.product as any;
          const productName = product?.name || 'Unknown Product';
          const quantity = item.quantity || 1;
          const unitPrice = (item.price?.unit_amount || 0) / 100;
          const totalPrice = unitPrice * quantity;

          // Insert order record into database
          const orderRecord = {
            order_id: finalOrderId,
            stripe_session_id: sessionId,
            stripe_payment_intent_id: session.payment_intent,
            product_name: productName,
            quantity: quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            delivery_date: session.metadata?.delivery_date || null,
            delivery_street: session.metadata?.delivery_street || null,
            delivery_city: session.metadata?.delivery_city || null,
            delivery_state: session.metadata?.delivery_state || null,
            delivery_zip: session.metadata?.delivery_zip || null,
            status: 'confirmed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          console.log('Inserting order record for item:', productName);

          const { data: insertedOrder, error: insertError } = await supabase
            .from('orders')
            .insert(orderRecord)
            .select();

          if (insertError) {
            console.error('Database insert error:', insertError);
          } else {
            console.log('Order saved successfully');
          }

          orderItems.push({
            id: insertedOrder?.[0]?.id || `temp-${Date.now()}`,
            order_id: finalOrderId,
            product_name: productName,
            quantity: quantity,
            total_price: totalPrice,
            delivery_date: session.metadata?.delivery_date || null,
            delivery_address_street: session.metadata?.delivery_street || null,
            delivery_address_city: session.metadata?.delivery_city || null,
            delivery_address_state: session.metadata?.delivery_state || null,
            delivery_address_zip: session.metadata?.delivery_zip || null,
            contact_name: customerName,
            contact_email: customerEmail,
            contact_phone: session.metadata?.contact_phone || null,
            delivery_time_preference: session.metadata?.delivery_time_preference || null,
            delivery_instructions: session.metadata?.delivery_instructions || null,
            status: 'confirmed'
          });
        }
      } catch (stripeError) {
        console.error('Stripe session retrieval failed:', stripeError);
        // Continue with fallback processing
      }
    }

    // Fallback mode: use backup data or find existing orders
    if ((fallbackMode || !session) && finalOrderId) {
      console.log('Using fallback mode for order processing');
      
      // Try to find existing orders first
      const { data: existingOrders, error: queryError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', finalOrderId)
        .order('created_at', { ascending: true });

      if (!queryError && existingOrders && existingOrders.length > 0) {
        console.log('Found existing orders:', existingOrders.length);
        
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
          contact_name: customerName,
          contact_email: customerEmail,
          contact_phone: null,
          delivery_time_preference: null,
          delivery_instructions: null,
          status: order.status
        }));
        
        totalAmount = existingOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);
      }
    }

    // Send emails if we have valid order data
    let customerEmailSent = false;
    let internalEmailSent = false;

    if (orderItems.length > 0 && customerEmail !== 'customer@example.com') {
      console.log('=== SENDING EMAILS ===');
      
      const orderData = {
        order_id: finalOrderId,
        customer_email: customerEmail,
        customer_name: customerName,
        total_amount: totalAmount,
        items: orderItems
      };

      // Send customer confirmation email
      try {
        const customerEmailHtml = generateCustomerEmail(orderData);
        
        const { data: customerEmailData, error: customerEmailError } = await supabase.functions.invoke('send-email', {
          body: {
            to: customerEmail,
            subject: `Order Confirmation - ${finalOrderId}`,
            html: customerEmailHtml,
            type: 'customer_confirmation',
            orderData
          }
        });

        if (customerEmailError) {
          console.error('Customer email error:', customerEmailError);
        } else {
          console.log('Customer email sent successfully');
          customerEmailSent = true;
        }
      } catch (emailError) {
        console.error('Customer email exception:', emailError);
      }

      // Send internal notification email
      try {
        const internalEmailHtml = generateInternalEmail(orderData);
        
        const { data: internalEmailData, error: internalEmailError } = await supabase.functions.invoke('send-email', {
          body: {
            to: 'orders@mygravelguy.com',
            subject: `New Order: ${finalOrderId} - $${totalAmount.toFixed(2)}`,
            html: internalEmailHtml,
            type: 'internal_notification',
            orderData
          }
        });

        if (internalEmailError) {
          console.error('Internal email error:', internalEmailError);
        } else {
          console.log('Internal email sent successfully');
          internalEmailSent = true;
        }
      } catch (emailError) {
        console.error('Internal email exception:', emailError);
      }
    }

    console.log('=== VERIFICATION COMPLETE ===');
    console.log('Order ID:', finalOrderId);
    console.log('Customer email sent:', customerEmailSent);
    console.log('Internal email sent:', internalEmailSent);
    console.log('Orders found:', orderItems.length);

    return new Response(
      JSON.stringify({ 
        success: true,
        orders: orderItems,
        orderId: finalOrderId,
        paymentStatus: session?.payment_status || 'processed',
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

// Email template functions
function generateCustomerEmail(data: any) {
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
}

function generateInternalEmail(data: any) {
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
}
