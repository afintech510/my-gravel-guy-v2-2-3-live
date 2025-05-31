
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
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
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

    // Extract order ID from session metadata or use provided orderId
    const sessionOrderId = session.metadata?.order_id || orderId;
    
    if (!sessionOrderId) {
      console.warn('No order ID found in session metadata or parameters');
    }

    // Update order status to confirmed
    const { data: updatedOrders, error: updateError } = await supabase
      .from('orders')
      .update({ 
        status: 'confirmed',
        stripe_payment_intent_id: session.payment_intent,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_session_id', sessionId)
      .select();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      throw new Error(`Failed to update order status: ${updateError.message}`);
    }

    console.log('Updated orders:', updatedOrders);

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
        orderId: sessionOrderId,
        paymentStatus: session.payment_status
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
