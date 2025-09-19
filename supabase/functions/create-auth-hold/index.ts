import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper function to verify JWT and extract user info (optional for guest checkout)
const verifyAuth = async (authHeader: string | null, supabaseUrl: string, supabaseAnonKey: string) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null; // Return null for guest users instead of throwing error
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null; // Return null instead of throwing error
    }
    
    return user;
  } catch (error) {
    return null; // Return null for any auth errors
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Environment validation
    const stripeSecretKey = Deno.env.get("stripe");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!stripeSecretKey || !supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Try to verify authentication (optional for guest checkout)
    const authHeader = req.headers.get('authorization');
    const user = await verifyAuth(authHeader, supabaseUrl, supabaseAnonKey);
    
    console.log('Auth check result:', { hasUser: !!user, userEmail: user?.email });

    const { items, orderId } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid items provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Extract contact email from items for guest checkout
    const contactEmail = items.find(item => item.metadata?.contactEmail)?.metadata?.contactEmail;
    
    if (!contactEmail) {
      return new Response(
        JSON.stringify({ error: "Contact email is required for checkout" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // For authenticated users, validate that contact email matches user email
    if (user && user.email !== contactEmail) {
      return new Response(
        JSON.stringify({ error: "Contact information must match authenticated user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Check if we have an existing cart order to update
    let finalOrderId = orderId;
    if (orderId && orderId.startsWith('CART-')) {
      console.log('Using existing cart order ID:', orderId);
      finalOrderId = orderId; // Keep the cart ID for now, will be updated in verify-payment
    } else if (!orderId) {
      // Generate new order ID if none provided
      finalOrderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log('Generated new order ID:', finalOrderId);
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Calculate total amount in cents
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity * 100), 0);

    // Create Payment Intent with manual capture for authorization hold
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount),
      currency: 'usd',
      capture_method: 'manual', // This creates an authorization hold instead of immediate charge
      metadata: {
        orderId: finalOrderId,
        userId: user?.id || 'guest',
        userEmail: user?.email || contactEmail,
        isGuest: user ? 'false' : 'true'
      },
      receipt_email: contactEmail,
    });

    console.log('Payment Intent created for authorization hold:', { 
      paymentIntentId: paymentIntent.id, 
      userType: user ? 'authenticated' : 'guest',
      contactEmail,
      amount: totalAmount / 100,
      status: paymentIntent.status
    });

    return new Response(
      JSON.stringify({ 
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        order_id: finalOrderId
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error('Authorization hold processing error:', error);
    return new Response(
      JSON.stringify({ error: "Authorization hold processing failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});