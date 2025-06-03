
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
    console.log('=== VERIFY PAYMENT FUNCTION START ===');
    
    const requestBody = await req.json();
    console.log('Verify payment request body:', requestBody);
    
    const { sessionId, orderId, fallbackMode, backupData } = requestBody;
    
    console.log('=== VERIFY PAYMENT DEBUG START ===');
    console.log('Session ID:', sessionId);
    console.log('Order ID:', orderId);
    console.log('Fallback mode:', fallbackMode);
    console.log('Has backup data:', !!backupData);
    
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
    let customerEmail = null;
    let customerName = 'Customer';
    let orderItems = [];
    let totalAmount = 0;

    // Try to retrieve Stripe session if sessionId is provided
    if (sessionId) {
      try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || Deno.env.get("stripe");
        if (!stripeKey) {
          console.error("Stripe secret key not found in environment");
          throw new Error("Stripe secret key not found");
        }
        
        const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

        console.log('=== RETRIEVING STRIPE SESSION ===');
        session = await stripe.checkout.sessions.retrieve(sessionId, {
          expand: ['line_items.data.price.product', 'customer', 'payment_intent']
        });
        
        console.log('=== RAW STRIPE SESSION DATA ===');
        console.log('Session ID:', session.id);
        console.log('Payment Status:', session.payment_status);
        console.log('Customer Details:', session.customer_details);
        console.log('Customer Email from customer_details:', session.customer_details?.email);
        console.log('Customer Name from customer_details:', session.customer_details?.name);
        console.log('Customer ID:', session.customer);
        console.log('Amount Total:', session.amount_total);
        console.log('Session customer_creation:', session.customer_creation);
        console.log('Session customer_email (deprecated):', session.customer_email);
        
        // Enhanced customer email extraction with multiple fallback sources
        console.log('=== CUSTOMER EMAIL EXTRACTION DEBUG ===');
        
        // Try multiple sources for customer email
        let extractedEmail = null;
        let emailSource = 'none';
        
        // Source 1: customer_details.email (most reliable for new sessions)
        if (session.customer_details?.email) {
          extractedEmail = session.customer_details.email;
          emailSource = 'customer_details';
          console.log('✓ Found email in customer_details:', extractedEmail);
        }
        
        // Source 2: customer object (if expanded and exists)
        if (!extractedEmail && session.customer && typeof session.customer === 'object') {
          extractedEmail = session.customer.email;
          emailSource = 'customer_object';
          console.log('✓ Found email in customer object:', extractedEmail);
        }
        
        // Source 3: payment_intent receipt_email
        if (!extractedEmail && session.payment_intent) {
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
              console.log('✓ Found email in payment intent:', extractedEmail);
            }
          } catch (piError) {
            console.warn('Could not retrieve payment intent for email:', piError.message);
          }
        }
        
        // Source 4: Deprecated customer_email field (fallback)
        if (!extractedEmail && session.customer_email) {
          extractedEmail = session.customer_email;
          emailSource = 'deprecated_customer_email';
          console.log('✓ Found email in deprecated field:', extractedEmail);
        }
        
        console.log('=== EMAIL EXTRACTION RESULTS ===');
        console.log('Extracted email:', extractedEmail);
        console.log('Email source:', emailSource);
        console.log('Is valid email format:', extractedEmail ? extractedEmail.includes('@') : false);

        // Extract order details from session
        finalOrderId = session.metadata?.order_id || orderId || `ORDER-${Date.now()}`;
        customerEmail = extractedEmail;
        customerName = session.customer_details?.name || 'Customer';
        totalAmount = (session.amount_total || 0) / 100;

        console.log('=== FINAL EXTRACTED CUSTOMER INFO ===');
        console.log('Customer Email:', customerEmail);
        console.log('Customer Name:', customerName);
        console.log('Final Order ID:', finalOrderId);
        console.log('Total Amount:', totalAmount);
        console.log('Email Source:', emailSource);

        // Validate extracted email
        if (customerEmail) {
          const emailValid = customerEmail.includes('@') && customerEmail.includes('.');
          console.log('=== EMAIL VALIDATION ===');
          console.log('Email:', customerEmail);
          console.log('Has @ symbol:', customerEmail.includes('@'));
          console.log('Has dot:', customerEmail.includes('.'));
          console.log('Is valid:', emailValid);
          
          if (!emailValid) {
            console.warn('⚠️ Extracted email appears invalid:', customerEmail);
            customerEmail = null; // Reset to null if invalid
          } else {
            console.log('✅ Email validation passed');
          }
        } else {
          console.warn('⚠️ No customer email found in any source');
        }

        // Process line items and save to database
        const lineItems = session.line_items?.data || [];
        console.log('=== PROCESSING LINE ITEMS ===');
        console.log('Line items count:', lineItems.length);

        for (const item of lineItems) {
          const product = item.price?.product as any;
          const productName = product?.name || 'Unknown Product';
          const quantity = item.quantity || 1;
          const unitPrice = (item.price?.unit_amount || 0) / 100;
          const totalPrice = unitPrice * quantity;

          console.log(`Processing item: ${productName}, Qty: ${quantity}, Price: $${unitPrice}`);

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

          console.log('Inserting order record:', orderRecord);

          const { data: insertedOrder, error: insertError } = await supabase
            .from('orders')
            .insert(orderRecord)
            .select();

          if (insertError) {
            console.error('❌ Database insert error:', insertError);
          } else {
            console.log('✅ Order saved successfully:', insertedOrder?.[0]?.id);
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
        console.error('❌ Stripe session retrieval failed:', stripeError);
        console.error('Stripe error details:', stripeError.message);
        // Continue with fallback processing
      }
    }

    // Fallback mode: use backup data or find existing orders
    if ((fallbackMode || !session) && finalOrderId) {
      console.log('=== USING FALLBACK MODE ===');
      
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
          contact_name: order.customer_name || customerName,
          contact_email: order.customer_email || customerEmail,
          contact_phone: null,
          delivery_time_preference: null,
          delivery_instructions: null,
          status: order.status
        }));
        
        totalAmount = existingOrders.reduce((sum, order) => sum + (order.total_price || 0), 0);
        // Use customer info from existing orders if available
        if (existingOrders[0]?.customer_email) {
          customerEmail = existingOrders[0].customer_email;
        }
        if (existingOrders[0]?.customer_name) {
          customerName = existingOrders[0].customer_name;
        }
      }
    }

    // Send emails with enhanced debugging and improved flow logic
    let customerEmailSent = false;
    let internalEmailSent = false;

    console.log('=== EMAIL SENDING DECISION LOGIC ===');
    console.log('Order items count:', orderItems.length);
    console.log('Customer email available:', !!customerEmail);
    console.log('Customer email value:', customerEmail);
    console.log('Customer email valid format:', customerEmail && customerEmail.includes('@'));
    
    // Always attempt to send internal email regardless of customer email
    if (orderItems.length > 0) {
      console.log('=== SENDING EMAILS ===');
      
      const orderData = {
        order_id: finalOrderId,
        customer_email: customerEmail || 'no-email@customer.com', // Fallback for internal tracking
        customer_name: customerName,
        total_amount: totalAmount,
        items: orderItems
      };

      console.log('Order data for emails:', JSON.stringify(orderData, null, 2));

      // Send customer confirmation email only if we have a valid email
      if (customerEmail && customerEmail.includes('@')) {
        try {
          console.log('=== SENDING CUSTOMER EMAIL ===');
          console.log('Recipient:', customerEmail);
          
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
            console.error('❌ Customer email error:', customerEmailError);
          } else {
            console.log('✅ Customer email sent successfully');
            customerEmailSent = true;
          }
        } catch (emailError) {
          console.error('❌ Customer email exception:', emailError);
        }
      } else {
        console.log('⚠️ Skipping customer email - no valid email address');
        console.log('Customer email value:', customerEmail);
      }

      // Always send internal notification email
      try {
        console.log('=== SENDING INTERNAL EMAIL ===');
        console.log('Internal recipient: order.support@mygravelguy.com');
        
        const internalEmailHtml = generateInternalEmail(orderData);
        
        const { data: internalEmailData, error: internalEmailError } = await supabase.functions.invoke('send-email', {
          body: {
            to: 'order.support@mygravelguy.com',
            subject: `🎉 Payment Confirmed: ${finalOrderId} - $${totalAmount.toFixed(2)}`,
            html: internalEmailHtml,
            type: 'internal_notification',
            orderData
          }
        });

        if (internalEmailError) {
          console.error('❌ Internal email error:', internalEmailError);
        } else {
          console.log('✅ Internal email sent successfully');
          internalEmailSent = true;
        }
      } catch (emailError) {
        console.error('❌ Internal email exception:', emailError);
      }
    } else {
      console.log('⚠️ Skipping email sending - no order items found');
    }

    console.log('=== VERIFICATION COMPLETE ===');
    console.log('Order ID:', finalOrderId);
    console.log('Customer email sent:', customerEmailSent);
    console.log('Internal email sent:', internalEmailSent);
    console.log('Orders found:', orderItems.length);
    console.log('Customer email available:', !!customerEmail);

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
        customerEmail: customerEmail // Include for debugging
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
        success: false,
        details: "Payment verification failed"
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
      <title>Payment Confirmed - ${data.order_id}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #16a34a; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">🎉 Payment Confirmed!</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Order successfully processed</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #16a34a; margin-top: 0;">Order: ${data.order_id}</h2>
        
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Customer Information</h3>
          <p><strong>Name:</strong> ${data.customer_name || 'Not provided'}</p>
          <p><strong>Email:</strong> ${data.customer_email}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Order Summary</h3>
          <p><strong>Total Amount:</strong> $${data.total_amount.toFixed(2)}</p>
          <p><strong>Status:</strong> ✅ Payment Confirmed</p>
          <p><strong>Items:</strong> ${data.items.length}</p>
        </div>
        
        <div style="background: white; padding: 15px; border-radius: 6px; margin: 15px 0;">
          <h3 style="margin-top: 0;">Next Steps</h3>
          <p>• Process order for delivery</p>
          <p>• Contact customer for delivery coordination</p>
          <p>• Update internal order management system</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
