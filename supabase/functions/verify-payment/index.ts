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
    let customerEmail = 'unknown@example.com';
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

        if (session.payment_status !== 'paid') {
          console.warn(`Payment not completed. Status: ${session.payment_status}`);
          // Don't throw error, continue processing in case of timing issues
        }

        // Extract order ID from session metadata or use provided orderId
        finalOrderId = session.metadata?.order_id || orderId || `ORDER-${Date.now()}`;
        customerEmail = session.customer_details?.email || session.metadata?.customer_email || 'unknown@example.com';
        customerName = session.customer_details?.name || session.metadata?.customer_name || 'Customer';
        totalAmount = (session.amount_total || 0) / 100;

        // Process line items
        const lineItems = session.line_items?.data || [];
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

          console.log('Inserting order record for item:', productName);

          const { data: insertedOrder, error: insertError } = await supabase
            .from('orders')
            .insert(orderRecord)
            .select();

          if (insertError) {
            console.error('Database insert error:', insertError);
            // Don't throw error, continue processing other items
          } else {
            console.log('Order saved successfully');
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
      } catch (stripeError) {
        console.error('Stripe session retrieval failed:', stripeError);
        // Continue with fallback processing
      }
    }

    // Fallback mode: check if we have backup data or try to find existing orders
    if (fallbackMode || (!session && orderId)) {
      console.log('Using fallback mode for order processing');
      
      if (backupData) {
        console.log('Processing with backup data:', backupData);
        finalOrderId = backupData.orderId || orderId || `ORDER-${Date.now()}`;
        
        // Extract information from backup data
        const backupItems = backupData.items || [];
        totalAmount = backupData.total || 0;
        
        for (const item of backupItems) {
          const orderRecord = {
            order_id: finalOrderId,
            stripe_session_id: sessionId || null,
            stripe_payment_intent_id: null,
            product_name: item.name || 'Unknown Product',
            quantity: item.quantity || 1,
            unit_price: item.price || 0,
            total_price: (item.price || 0) * (item.quantity || 1),
            delivery_date: item.metadata?.deliveryDate || null,
            delivery_address_street: null,
            delivery_address_city: null,
            delivery_address_state: null,
            delivery_address_zip: null,
            contact_name: 'Customer',
            contact_email: customerEmail,
            contact_phone: null,
            delivery_time_preference: item.metadata?.deliveryTimePreference || null,
            delivery_instructions: item.metadata?.deliveryInstructions || null,
            status: 'confirmed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          console.log('Inserting fallback order record:', orderRecord.product_name);

          const { data: insertedOrder, error: insertError } = await supabase
            .from('orders')
            .insert(orderRecord)
            .select();

          if (insertError) {
            console.error('Fallback database insert error:', insertError);
          } else {
            console.log('Fallback order saved successfully');
          }
        }
      }
      
      // Try to find existing orders if we have an order ID
      if (finalOrderId) {
        console.log('Checking for existing orders with ID:', finalOrderId);
        
        const { data: existingOrders, error: queryError } = await supabase
          .from('orders')
          .select('*')
          .eq('order_id', finalOrderId)
          .order('created_at', { ascending: true });

        if (!queryError && existingOrders && existingOrders.length > 0) {
          console.log('Found existing orders:', existingOrders.length);
          // Use existing orders instead of creating new ones
          orderItems = existingOrders.map(order => ({
            product_name: order.product_name,
            quantity: order.quantity,
            total_price: order.total_price,
            delivery_date: order.delivery_date,
            delivery_address: {
              street: order.delivery_address_street,
              city: order.delivery_address_city,
              state: order.delivery_address_state,
              zip: order.delivery_address_zip
            },
            contact_info: {
              name: order.contact_name,
              email: order.contact_email,
              phone: order.contact_phone
            },
            delivery_time_preference: order.delivery_time_preference,
            delivery_instructions: order.delivery_instructions
          }));
        }
      }
    }

    // Prepare order data for emails
    const orderData = {
      order_id: finalOrderId,
      customer_email: customerEmail,
      customer_name: customerName,
      total_amount: totalAmount,
      items: orderItems
    };

    console.log('=== EMAIL SENDING DEBUG ===');
    console.log('Order data for emails:', JSON.stringify(orderData, null, 2));

    let customerEmailSent = false;
    let internalEmailSent = false;

    // Only send emails if we have valid order data
    if (orderItems.length > 0) {
      // Generate email HTML content (keeping existing email templates)
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
          console.error('Internal email error:', internalEmailError);
        } else {
          console.log('Internal email sent successfully');
          internalEmailSent = true;
        }
      } catch (emailError) {
        console.error('Internal email exception:', emailError);
      }
    }

    // Fetch the complete order details to return
    const { data: orderDetailsResult, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', finalOrderId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('Error fetching order details:', fetchError);
    }

    console.log('=== FINAL SUMMARY ===');
    console.log('Order ID:', finalOrderId);
    console.log('Customer email sent:', customerEmailSent);
    console.log('Internal email sent:', internalEmailSent);
    console.log('Orders in database:', orderDetailsResult?.length || 0);
    console.log('=== VERIFY PAYMENT DEBUG END ===');

    return new Response(
      JSON.stringify({ 
        success: true,
        orders: orderDetailsResult || [],
        orderId: finalOrderId,
        paymentStatus: session?.payment_status || 'processed',
        emailsSent: customerEmailSent && internalEmailSent,
        customerEmailSent,
        internalEmailSent,
        fallbackMode: fallbackMode || false
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
