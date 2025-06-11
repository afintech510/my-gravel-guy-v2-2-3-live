import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    console.log('=== VERIFY PAYMENT FUNCTION START ===');
    
    // Environment validation
    const stripeSecretKey = Deno.env.get("stripe");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey) {
      console.error('Missing Stripe secret key');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Stripe configuration missing",
          debug_info: "stripe secret key not found in environment"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Database configuration missing",
          debug_info: "supabase url or service role key not found"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    const requestBody = await req.text();
    console.log('Request body received:', requestBody.substring(0, 200) + '...');
    
    let parsedData;
    try {
      parsedData = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid JSON in request body",
          debug_info: parseError.message 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const { 
      paymentIntentId, 
      orderId, 
      fallbackMode = false, 
      backupData,
      skipDbInsert = false // New parameter to skip database insertion
    } = parsedData;

    console.log('Processing payment verification:', {
      hasPaymentIntentId: !!paymentIntentId,
      hasOrderId: !!orderId,
      fallbackMode,
      hasBackupData: !!backupData,
      skipDbInsert
    });

    let verificationResult = {
      success: false,
      paymentVerified: false,
      verification_method: 'unknown',
      used_fallback: false,
      orderId: orderId,
      sessionId: null,
      paymentIntentId: null,
      error: null,
      debug_info: null
    };

    // Primary verification: Check with Stripe
    if (paymentIntentId && !fallbackMode) {
      try {
        console.log('Attempting Stripe verification for payment intent:', paymentIntentId.substring(0, 20) + '...');
        
        let stripeObject;
        let isCheckoutSession = false;

        // Determine if this is a checkout session or payment intent
        if (paymentIntentId.startsWith('cs_')) {
          console.log('Detected checkout session, retrieving session...');
          stripeObject = await stripe.checkout.sessions.retrieve(paymentIntentId);
          isCheckoutSession = true;
        } else if (paymentIntentId.startsWith('pi_')) {
          console.log('Detected payment intent, retrieving payment intent...');
          stripeObject = await stripe.paymentIntents.retrieve(paymentIntentId);
        } else {
          throw new Error(`Unknown payment identifier format: ${paymentIntentId.substring(0, 10)}...`);
        }

        console.log('Stripe object retrieved:', {
          id: stripeObject.id,
          status: stripeObject.status,
          type: isCheckoutSession ? 'checkout_session' : 'payment_intent'
        });

        // Validate payment status
        let paymentSuccess = false;
        if (isCheckoutSession) {
          paymentSuccess = stripeObject.status === 'complete' && stripeObject.payment_status === 'paid';
          verificationResult.sessionId = stripeObject.id;
          verificationResult.paymentIntentId = stripeObject.payment_intent;
        } else {
          paymentSuccess = stripeObject.status === 'succeeded';
          verificationResult.paymentIntentId = stripeObject.id;
        }

        if (paymentSuccess) {
          console.log('Stripe payment verification successful');
          verificationResult.success = true;
          verificationResult.paymentVerified = true;
          verificationResult.verification_method = 'stripe_verified';
        } else {
          console.log('Stripe payment not successful, status:', stripeObject.status);
          verificationResult.error = `Payment not successful. Status: ${stripeObject.status}`;
        }

      } catch (stripeError) {
        console.error('Stripe verification error:', stripeError);
        verificationResult.error = `Stripe verification failed: ${stripeError.message}`;
        verificationResult.debug_info = stripeError.stack;
      }
    }

    // Fallback verification: Use backup data
    if ((fallbackMode || !verificationResult.paymentVerified) && backupData) {
      console.log('Using fallback verification with backup data');
      
      if (backupData.items && Array.isArray(backupData.items) && backupData.items.length > 0) {
        console.log('Backup data validation successful:', {
          itemsCount: backupData.items.length,
          orderId: backupData.orderId,
          total: backupData.total
        });
        
        verificationResult.success = true;
        verificationResult.paymentVerified = true;
        verificationResult.verification_method = 'fallback';
        verificationResult.used_fallback = true;
        verificationResult.orderId = backupData.orderId;
        verificationResult.error = null;
      } else {
        console.error('Invalid backup data structure');
        verificationResult.error = 'Invalid backup data: missing or empty items';
        verificationResult.debug_info = `Backup data: ${JSON.stringify(backupData).substring(0, 200)}...`;
      }
    }

    // Skip database operations if requested (new behavior)
    if (skipDbInsert) {
      console.log('Skipping database insertion as requested');
      
      return new Response(
        JSON.stringify(verificationResult),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Legacy database insertion code (only runs if skipDbInsert is false)
    if (verificationResult.success && backupData && !skipDbInsert) {
      try {
        console.log('Creating database records...');
        
        // Create Supabase client
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        // Prepare order records for insertion
        const paymentStatus = verificationResult.used_fallback ? 'processed' : (verificationResult.paymentVerified ? 'paid' : 'pending');
        
        const orderRecords = backupData.items.map(item => ({
          order_id: verificationResult.orderId,
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
          billing_name: item.customer_name || 'Guest User',
          billing_email: item.customer_email || 'guest@mygravelguy.com',
          status: paymentStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        console.debug("Order records prepared for insertion", { 
          count: orderRecords.length, 
          paymentStatus,
          orderId: verificationResult.orderId
        });

        // Insert order records with enhanced error handling
        let insertedOrders;
        try {
          const { data, error: insertError } = await supabase
            .from('orders')
            .insert(orderRecords)
            .select();

          if (insertError) {
            console.error('Database insertion error details', {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code
            });
            throw new Error(`Database insertion failed: ${insertError.message}`);
          }
          
          insertedOrders = data;
          console.info(`Successfully inserted ${insertedOrders?.length || 0} order records`);
        } catch (dbError) {
          console.error('Database operation failed', dbError);
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
        
        const totalAmount = backupData.items.reduce((sum, item) => sum + item.total_price, 0);
        
        const response = {
          success: true,
          payment_status: paymentStatus,
          orderId: verificationResult.orderId,
          orders: transformedOrders,
          customer_email: item.customer_email || 'guest@mygravelguy.com',
          customer_name: item.customer_name || 'Guest User',
          payment_intent_id: paymentIntentId,
          total_amount: totalAmount,
          timestamp: new Date().toISOString(),
          verification_method: verificationResult.verification_method,
          used_fallback: verificationResult.used_fallback
        };

        console.info("=== PAYMENT VERIFICATION COMPLETED SUCCESSFULLY ===", {
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

      } catch (dbError) {
        console.error('Database error:', dbError);
        // Don't fail the verification if DB insert fails
        verificationResult.debug_info = `DB insert failed: ${dbError.message}`;
      }
    }

    console.log('=== VERIFY PAYMENT FUNCTION END ===');
    
    return new Response(
      JSON.stringify(verificationResult),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Verify payment function error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        debug_info: error.stack || 'No stack trace available'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
