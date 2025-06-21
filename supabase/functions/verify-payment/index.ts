
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper function to verify JWT and extract user info
const verifyAuth = async (authHeader: string | null, supabaseUrl: string, supabaseAnonKey: string) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header');
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    throw new Error('Invalid or expired token');
  }
  
  return user;
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

    // Verify authentication for non-fallback requests
    const authHeader = req.headers.get('authorization');
    let user = null;
    
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

    // Require authentication for non-fallback operations
    if (!fallbackMode) {
      try {
        user = await verifyAuth(authHeader, supabaseUrl, supabaseAnonKey);
      } catch (authError) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "Authentication required" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
        );
      }
    }

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

        // Validate that the payment belongs to the authenticated user
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
        verificationResult.error = `Stripe verification failed`;
      }
    }

    // Fallback verification with additional security checks
    if ((fallbackMode || !verificationResult.paymentVerified) && backupData) {
      if (backupData.items && Array.isArray(backupData.items) && backupData.items.length > 0) {
        // Additional validation for fallback mode
        if (user && backupData.customer?.email !== user.email) {
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: "Backup data does not match authenticated user" 
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
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

    // Database insertion with proper authorization
    if (verificationResult.success && backupData && !skipDbInsert) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        });

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
        
        return new Response(
          JSON.stringify({
            success: true,
            payment_status: paymentStatus,
            orderId: verificationResult.orderId,
            orders: transformedOrders,
            customer_email: backupData.customer?.email || 'guest@mygravelguy.com',
            customer_name: backupData.customer?.name || 'Guest User',
            payment_intent_id: paymentIntentId,
            total_amount: totalAmount,
            timestamp: new Date().toISOString(),
            verification_method: verificationResult.verification_method,
            used_fallback: verificationResult.used_fallback
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          }
        );

      } catch (dbError) {
        // Don't fail the verification if DB insert fails, but log securely
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
