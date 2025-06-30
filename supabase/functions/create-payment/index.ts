
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Utility function to convert relative image paths to absolute URLs
const convertToAbsoluteUrl = (imagePath: string, baseUrl: string): string => {
  // If the path is already absolute (starts with http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Handle relative paths that start with /
  if (imagePath.startsWith('/')) {
    return `${baseUrl}${imagePath}`;
  }
  
  // Handle relative paths without leading /
  return `${baseUrl}/${imagePath}`;
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

    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2023-10-16" });

    // Get the base URL from the request origin
    const baseUrl = req.headers.get('origin') || 'https://6cc236ee-8c17-42f6-b0da-a561155753fa.lovableproject.com';

    // Create line items for Stripe with absolute image URLs
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          description: item.description || '',
          images: item.image ? [convertToAbsoluteUrl(item.image, baseUrl)] : [],
          metadata: {
            orderId: orderId,
            userId: user?.id || 'guest',
            ...item.metadata
          }
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${req.headers.get('origin')}/cart`,
      metadata: {
        orderId: orderId,
        userId: user?.id || 'guest',
        userEmail: user?.email || contactEmail,
        isGuest: user ? 'false' : 'true'
      },
      customer_email: contactEmail,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US'],
      },
    });

    console.log('Stripe session created:', { 
      sessionId: session.id, 
      userType: user ? 'authenticated' : 'guest',
      contactEmail,
      imageUrlsConverted: lineItems.map(item => item.price_data.product_data.images?.[0]).filter(Boolean)
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(
      JSON.stringify({ error: "Payment processing failed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
