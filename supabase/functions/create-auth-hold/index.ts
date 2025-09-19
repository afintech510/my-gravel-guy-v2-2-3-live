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

    const { items, orderId, depositOption } = await req.json();

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

    // Note: We allow different emails for flexibility in checkout process
    // Users may want to use different billing/contact emails

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

    // Calculate total amount in cents - use $199 if deposit option is selected
    const baseAmount = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity * 100), 0);
    const totalAmount = depositOption ? 19900 : baseAmount; // $199 in cents

    // Create Stripe Checkout Session with manual capture for authorization hold
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      payment_intent_data: {
        capture_method: 'manual', // This creates an authorization hold instead of immediate charge
      },
      line_items: items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.name,
            description: item.description || '',
            metadata: {
              orderId: finalOrderId,
              userId: user?.id || 'guest',
              ...item.metadata
            }
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${finalOrderId}`,
      cancel_url: `${req.headers.get('origin')}/cart`,
      metadata: {
        orderId: finalOrderId,
        userId: user?.id || 'guest',
        userEmail: user?.email || contactEmail,
        isGuest: user ? 'false' : 'true',
        depositOption: depositOption ? 'true' : 'false',
        fullOrderAmount: (baseAmount / 100).toString()
      },
      customer_email: contactEmail,
      billing_address_collection: 'required',
    });

    console.log('Authorization hold checkout session created:', { 
      sessionId: session.id, 
      userType: user ? 'authenticated' : 'guest',
      contactEmail,
      amount: totalAmount / 100,
      captureMethod: 'manual'
    });

    return new Response(
      JSON.stringify({ 
        url: session.url,
        session_id: session.id,
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