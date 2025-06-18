
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { checkRateLimit, getClientId } from "./rateLimiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Enhanced customer information interface for both authenticated and guest users
interface CustomerInfo {
  email: string;
  name: string;
  phone: string;
  isGuest: boolean;
  userId?: string;
}

// Validation functions for guest checkout
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateCustomerInfo(customerInfo: CustomerInfo): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!customerInfo.email || customerInfo.email.trim() === '') {
    errors.push('Email is required');
  } else if (!validateEmail(customerInfo.email)) {
    errors.push('Valid email address is required');
  }
  
  if (!customerInfo.name || customerInfo.name.trim() === '') {
    errors.push('Customer name is required');
  }
  
  if (!customerInfo.phone || customerInfo.phone.trim() === '') {
    errors.push('Phone number is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Enhanced function to extract customer information from cart items or authenticated user
function extractCustomerInformation(items: any[], authenticatedUser: any | null): CustomerInfo {
  console.log('=== EXTRACTING CUSTOMER INFORMATION ===');
  
  // If user is authenticated, use their information as primary source
  if (authenticatedUser) {
    console.log('Using authenticated user information:', {
      userId: authenticatedUser.id,
      email: authenticatedUser.email,
      userMetadata: authenticatedUser.user_metadata
    });
    
    return {
      email: authenticatedUser.email || '',
      name: authenticatedUser.user_metadata?.name || authenticatedUser.user_metadata?.full_name || 'Authenticated User',
      phone: authenticatedUser.user_metadata?.phone || '',
      isGuest: false,
      userId: authenticatedUser.id
    };
  }
  
  // For guest checkout, extract from cart item metadata
  console.log('Extracting guest customer information from cart items');
  
  // Find the first item with complete contact information
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`Checking item ${i} for customer info:`, {
      hasMetadata: !!item.metadata,
      metadata: item.metadata
    });
    
    if (item.metadata) {
      const contactName = item.metadata.contactName;
      const contactEmail = item.metadata.contactEmail;
      const contactPhone = item.metadata.contactPhone;
      
      if (contactName && contactEmail && contactPhone) {
        console.log('Found complete customer information in item metadata:', {
          name: contactName,
          email: contactEmail,
          phone: contactPhone
        });
        
        return {
          email: contactEmail,
          name: contactName,
          phone: contactPhone,
          isGuest: true
        };
      }
    }
  }
  
  // Fallback: try to piece together information from multiple items
  console.log('Attempting to piece together customer information from multiple items');
  
  let email = '';
  let name = '';
  let phone = '';
  
  for (const item of items) {
    if (item.metadata) {
      if (!email && item.metadata.contactEmail) {
        email = item.metadata.contactEmail;
      }
      if (!name && item.metadata.contactName) {
        name = item.metadata.contactName;
      }
      if (!phone && item.metadata.contactPhone) {
        phone = item.metadata.contactPhone;
      }
    }
  }
  
  console.log('Pieced together customer information:', { email, name, phone });
  
  return {
    email: email || '',
    name: name || '',
    phone: phone || '',
    isGuest: true
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  // Rate limiting check
  const clientId = getClientId(req);
  const rateLimitResult = await checkRateLimit('create-payment', clientId);
  
  if (!rateLimitResult.allowed) {
    console.log('Rate limit exceeded for create-payment:', clientId);
    return new Response(
      JSON.stringify({ 
        error: "Too many requests. Please try again later.",
        rateLimitExceeded: true
      }),
      {
        headers: { 
          ...corsHeaders, 
          ...rateLimitResult.rateLimitHeaders,
          "Content-Type": "application/json" 
        },
        status: 429,
      }
    );
  }

  try {
    // Parse request body
    const requestBody = await req.text();
    console.log('Received request body:', requestBody);
    
    let parsedData;
    try {
      parsedData = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError.message);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          headers: { 
            ...corsHeaders, 
            ...rateLimitResult.rateLimitHeaders,
            "Content-Type": "application/json" 
          },
          status: 400,
        }
      );
    }
    
    const { items, customerInfo } = parsedData;
    
    // Access Stripe secret key and validate it exists
    const stripeKey = Deno.env.get("stripe");
    if (!stripeKey) {
      console.error('Stripe secret key is missing');
      return new Response(
        JSON.stringify({ 
          error: "Stripe secret key not found in environment variables" 
        }),
        {
          headers: { 
            ...corsHeaders, 
            ...rateLimitResult.rateLimitHeaders,
            "Content-Type": "application/json" 
          },
          status: 500,
        }
      );
    }
    
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Validate input
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error('Invalid items array:', items);
      return new Response(
        JSON.stringify({ error: "Invalid or empty items array" }),
        {
          headers: { 
            ...corsHeaders, 
            ...rateLimitResult.rateLimitHeaders,
            "Content-Type": "application/json" 
          },
          status: 400,
        }
      );
    }

    console.log('=== ENHANCED GUEST CHECKOUT PROCESSING ===');

    // Try to get authenticated user (optional for guest checkout)
    let authenticatedUser = null;
    try {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        console.log('Authorization header found, attempting to get authenticated user');
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_ANON_KEY") ?? ""
        );
        
        const token = authHeader.replace("Bearer ", "");
        const { data } = await supabase.auth.getUser(token);
        authenticatedUser = data.user;
        
        if (authenticatedUser) {
          console.log('Authenticated user found:', authenticatedUser.email);
        }
      } else {
        console.log('No authorization header found - proceeding as guest checkout');
      }
    } catch (authError) {
      console.log('Authentication check failed, proceeding as guest:', authError.message);
    }

    // Extract and validate customer information
    const extractedCustomerInfo = extractCustomerInformation(items, authenticatedUser);
    console.log('Extracted customer information:', extractedCustomerInfo);

    // Validate customer information
    const validation = validateCustomerInfo(extractedCustomerInfo);
    if (!validation.isValid) {
      console.error('Customer information validation failed:', validation.errors);
      return new Response(
        JSON.stringify({ 
          error: "Missing required customer information for checkout",
          details: validation.errors,
          missingFields: validation.errors
        }),
        {
          headers: { 
            ...corsHeaders, 
            ...rateLimitResult.rateLimitHeaders,
            "Content-Type": "application/json" 
          },
          status: 400,
        }
      );
    }

    console.log('Customer information validation passed');

    // Generate a unique order ID for this entire order
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Generated order ID:', orderId);

    // Validate and transform each item with detailed error logging
    const validatedLineItems = [];
    let orderMetadata = { 
      order_id: orderId,
      customer_email: extractedCustomerInfo.email,
      customer_name: extractedCustomerInfo.name,
      customer_phone: extractedCustomerInfo.phone,
      is_guest: extractedCustomerInfo.isGuest ? 'true' : 'false',
      user_id: extractedCustomerInfo.userId || 'guest'
    };
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        if (!item.name || typeof item.price !== 'number' || !item.quantity) {
          console.error(`Invalid item at index ${i}:`, item);
          throw new Error(`Invalid item at index ${i}: missing required fields or invalid types`);
        }
        
        // Use a clean name for Stripe (no special chars)
        const cleanName = String(item.name).replace(/['"\\]/g, '');
        
        // Process image URL
        let imageArray = [];
        if (item.image) {
          try {
            // Validate that the image URL is properly formatted
            const url = new URL(item.image);
            imageArray = [item.image];
          } catch (urlError) {
            console.warn(`Invalid image URL for item ${i}: ${item.image}. Skipping image.`);
            // Don't include the image if the URL is invalid, don't throw an error
          }
        }

        // Enhanced metadata collection for proper database mapping
        orderMetadata[`item_${i+1}_product_id`] = String(item.id || '');
        orderMetadata[`item_${i+1}_material_category`] = item.materialCategory || item.category || '';
        orderMetadata[`item_${i+1}_quantity_tons`] = String(item.quantity || item.tons || 0);
        orderMetadata[`item_${i+1}_quantity_yards`] = String(item.yards || 0);
        orderMetadata[`item_${i+1}_unit_price`] = String(item.price || 0);
        orderMetadata[`item_${i+1}_total_price`] = String((item.price * item.quantity) || 0);
        orderMetadata[`item_${i+1}_material_size`] = item.materialSize || item.size || '';

        // Add delivery and contact metadata from item metadata
        if (item.metadata) {
          if (item.metadata.deliveryDate) {
            orderMetadata[`item_${i+1}_delivery_date`] = item.metadata.deliveryDate;
          }
          
          if (item.metadata.deliveryAddress) {
            try {
              const address = typeof item.metadata.deliveryAddress === 'string' ? 
                JSON.parse(item.metadata.deliveryAddress) : item.metadata.deliveryAddress;
              
              orderMetadata[`item_${i+1}_delivery_address_street`] = address.street || '';
              orderMetadata[`item_${i+1}_delivery_address_city`] = address.city || '';
              orderMetadata[`item_${i+1}_delivery_address_state`] = address.state || '';
              orderMetadata[`item_${i+1}_delivery_address_zip`] = address.zip || '';
            } catch (addressError) {
              console.warn(`Failed to parse delivery address for item ${i}:`, addressError);
            }
          }
          
          if (item.metadata.contactPhone) {
            orderMetadata[`item_${i+1}_contact_phone`] = item.metadata.contactPhone;
          }

          if (item.metadata.contactName) {
            orderMetadata[`item_${i+1}_contact_name`] = item.metadata.contactName;
          }

          if (item.metadata.contactEmail) {
            orderMetadata[`item_${i+1}_contact_email`] = item.metadata.contactEmail;
          }
          
          if (item.metadata.deliveryTimePreference) {
            orderMetadata[`item_${i+1}_delivery_time_preference`] = item.metadata.deliveryTimePreference;
          }
          
          if (item.metadata.deliveryInstructions) {
            // Truncate long instructions for metadata limits
            const instructions = item.metadata.deliveryInstructions;
            orderMetadata[`item_${i+1}_delivery_instructions`] = 
              instructions.length > 100 ? instructions.substring(0, 97) + '...' : instructions;
          }
        }
        
        validatedLineItems.push({
          price_data: {
            currency: "usd",
            product_data: {
              name: cleanName,
              images: imageArray,
            },
            unit_amount: Math.round(item.price * 100), // Convert to cents
          },
          quantity: item.quantity,
        });
      } catch (validationError) {
        console.error(`Item validation error for item ${i}:`, validationError);
        throw new Error(`Item validation error: ${validationError.message}`);
      }
    }

    console.log('Creating Stripe checkout session with items:', validatedLineItems);
    console.log('Order metadata:', orderMetadata);

    // Get origin for success/cancel URLs
    const origin = req.headers.get("origin") || "http://localhost:3000";

    // Create a Stripe checkout session with BNPL payment methods and customer email collection
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        "card",
        "klarna",
        "afterpay_clearpay",
        "affirm"
      ],
      line_items: validatedLineItems,
      mode: "payment",
      success_url: `${origin}/payment-success?payment_intent={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${origin}/cart`,
      metadata: orderMetadata,
      payment_intent_data: {
        metadata: orderMetadata
      },
      // Enhanced customer email collection for guests
      customer_email: extractedCustomerInfo.email,
      billing_address_collection: 'required',
      customer_creation: 'always',
      // Configure BNPL options
      payment_method_options: {
        klarna: {
          preferred_locale: "en-US"
        },
        afterpay_clearpay: {
          reference: orderId
        },
        affirm: {
          preferred_locale: "en-US"
        }
      }
    });

    console.log('Stripe checkout session created:', session.id);
    console.log(`Checkout type: ${extractedCustomerInfo.isGuest ? 'Guest' : 'Authenticated'} checkout`);

    // After successful Stripe session creation, create order records with enhanced guest support
    try {
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

      // Prepare order records for each cart item with enhanced guest support
      const orderRecords = items.map((item, index) => {
        let deliveryAddress = null;

        if (item.metadata?.deliveryAddress) {
          try {
            deliveryAddress = typeof item.metadata.deliveryAddress === 'string' ? 
              JSON.parse(item.metadata.deliveryAddress) : item.metadata.deliveryAddress;
          } catch (e) {
            console.warn(`Failed to parse delivery address for item ${index}:`, e);
          }
        }

        return {
          order_id: orderId,
          stripe_session_id: session.id,
          product_id: String(item.id || ''),
          material_category: item.materialCategory || item.category || null,
          quantity_tons: item.quantity || item.tons || 0,
          quantity_yards: item.yards || null,
          unit_price: item.price,
          total_price: item.price * (item.quantity || item.tons || 0),
          material_size: item.materialSize || item.size || null,
          delivery_date: item.metadata?.deliveryDate || null,
          delivery_address_street: deliveryAddress?.street || null,
          delivery_address_city: deliveryAddress?.city || null,
          delivery_address_state: deliveryAddress?.state || null,
          delivery_address_zip: deliveryAddress?.zip || null,
          contact_name: item.metadata?.contactName || extractedCustomerInfo.name,
          contact_phone: item.metadata?.contactPhone || extractedCustomerInfo.phone,
          contact_email: item.metadata?.contactEmail || extractedCustomerInfo.email,
          customer_email: extractedCustomerInfo.email,
          customer_name: extractedCustomerInfo.name,
          delivery_time_preference: item.metadata?.deliveryTimePreference || null,
          delivery_instructions: item.metadata?.deliveryInstructions || null,
          status: 'pending_payment',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Enhanced user_id handling for guest checkouts
          user_id: extractedCustomerInfo.userId || null,
          is_guest: extractedCustomerInfo.isGuest
        };
      });

      console.log(`Creating order records for ${extractedCustomerInfo.isGuest ? 'guest' : 'authenticated'} checkout:`, orderRecords);

      // Insert order records into the database
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert(orderRecords)
        .select();

      if (orderError) {
        console.error('Failed to create order records:', orderError);
        // Log the error but don't fail the payment - we can handle this in the success page
      } else {
        console.log(`Successfully created order records for ${extractedCustomerInfo.isGuest ? 'guest' : 'authenticated'} checkout:`, orderData);
      }

    } catch (dbError) {
      console.error('Database error when creating orders:', dbError);
      // Don't fail the payment process - we can handle order creation in the success page
    }

    // Return the checkout URL with rate limit headers
    return new Response(
      JSON.stringify({ 
        url: session.url, 
        orderId,
        customerType: extractedCustomerInfo.isGuest ? 'guest' : 'authenticated'
      }),
      {
        headers: { 
          ...corsHeaders, 
          ...rateLimitResult.rateLimitHeaders,
          "Content-Type": "application/json" 
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Detailed Checkout Error:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
      details: error.toString()
    });
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "A detailed error occurred during the checkout process",
        fullError: error.toString()
      }),
      {
        headers: { 
          ...corsHeaders, 
          ...rateLimitResult.rateLimitHeaders,
          "Content-Type": "application/json" 
        },
        status: 500,
      }
    );
  }
});
