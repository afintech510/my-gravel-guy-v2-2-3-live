
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper function to verify JWT and extract user info (optional for guest verification)
const verifyAuth = async (authHeader: string | null, supabaseUrl: string, supabaseAnonKey: string) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null; // Return null for guest users
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // Environment validation
    const stripeSecretKey = Deno.env.get("stripe");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceRoleKey || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Server configuration error"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Try to verify authentication (optional for guest verification)
    const authHeader = req.headers.get('authorization');
    const user = await verifyAuth(authHeader, supabaseUrl, supabaseAnonKey);
    
    console.log('Auth check result:', { hasUser: !!user, userEmail: user?.email });

    const requestBody = await req.text();
    let parsedData;
    try {
      parsedData = JSON.parse(requestBody);
    } catch (parseError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid JSON in request body"
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
      skipDbInsert = false
    } = parsedData;

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    let verificationResult = {
      success: false,
      paymentVerified: false,
      verification_method: 'unknown',
      used_fallback: false,
      orderId: orderId,
      sessionId: null,
      paymentIntentId: null,
      error: null
    };

    // Primary verification: Check with Stripe
    if (paymentIntentId && !fallbackMode) {
      try {
        let stripeObject;
        let isCheckoutSession = false;

        if (paymentIntentId.startsWith('cs_')) {
          stripeObject = await stripe.checkout.sessions.retrieve(paymentIntentId);
          isCheckoutSession = true;
        } else if (paymentIntentId.startsWith('pi_')) {
          stripeObject = await stripe.paymentIntents.retrieve(paymentIntentId);
        } else {
          throw new Error(`Unknown payment identifier format`);
        }

        // For authenticated users, validate that the payment belongs to them
        // For guest users, we rely on the backup data validation
        if (user && isCheckoutSession) {
          if (stripeObject.customer_email !== user.email) {
            return new Response(
              JSON.stringify({ 
                success: false, 
                error: "Payment does not belong to authenticated user" 
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
            );
          }
        }

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
          verificationResult.success = true;
          verificationResult.paymentVerified = true;
          verificationResult.verification_method = 'stripe_verified';
        } else {
          verificationResult.error = `Payment not successful. Status: ${stripeObject.status}`;
        }

      } catch (stripeError) {
        console.error('Stripe verification error:', stripeError);
        verificationResult.error = `Stripe verification failed`;
      }
    }

    // Fallback verification with guest support
    if ((fallbackMode || !verificationResult.paymentVerified) && backupData) {
      if (backupData.items && Array.isArray(backupData.items) && backupData.items.length > 0) {
        // For authenticated users, validate email match
        if (user && backupData.customer?.email !== user.email) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Backup data does not match authenticated user" 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
          );
        }
        
        // For guest users, validate that backup data contains contact email
        if (!user && !backupData.customer?.email) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Guest checkout requires customer email in backup data" 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        
        verificationResult.success = true;
        verificationResult.paymentVerified = true;
        verificationResult.verification_method = 'fallback';
        verificationResult.used_fallback = true;
        verificationResult.orderId = backupData.orderId;
        verificationResult.error = null;
      } else {
        verificationResult.error = 'Invalid backup data: missing or empty items';
      }
    }

    // Skip database operations if requested
    if (skipDbInsert) {
      return new Response(
        JSON.stringify(verificationResult),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Database insertion with guest support
    if (verificationResult.success && backupData && !skipDbInsert) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

        const paymentStatus = verificationResult.used_fallback ? 'processed' : (verificationResult.paymentVerified ? 'paid' : 'pending');
        
        // Use guest defaults if no user is authenticated
        const billingEmail = user?.email || backupData.customer?.email || 'guest@mygravelguy.com';
        const billingName = backupData.customer?.name || 'Guest User';
        
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
          billing_name: billingName,
          billing_email: billingEmail,
          status: paymentStatus,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { data, error: insertError } = await supabase
          .from('orders')
          .insert(orderRecords)
          .select();

        if (insertError) {
          throw new Error(`Database insertion failed: ${insertError.message}`);
        }
        
        const transformedOrders = (data || []).map(order => ({
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
        
        console.log('Order saved successfully:', { 
          orderId: verificationResult.orderId, 
          userType: user ? 'authenticated' : 'guest',
          customerEmail: billingEmail 
        });
        
        return new Response(
          JSON.stringify({
            success: true,
            payment_status: paymentStatus,
            orderId: verificationResult.orderId,
            orders: transformedOrders,
            customer_email: billingEmail,
            customer_name: billingName,
            payment_intent_id: paymentIntentId,
            total_amount: totalAmount,
            timestamp: new Date().toISOString(),
            verification_method: verificationResult.verification_method,
            used_fallback: verificationResult.used_fallback,
            user_type: user ? 'authenticated' : 'guest'
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );

      } catch (dbError) {
        console.error('Database operation failed:', dbError);
        verificationResult.error = 'Database operation failed';
      }
    }
    
    return new Response(
      JSON.stringify(verificationResult),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Payment verification failed"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
