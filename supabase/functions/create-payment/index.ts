
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Helper function to compress delivery address into a single string
const compressDeliveryAddress = (address: any): string => {
  if (!address || typeof address !== 'object') return '';
  const parts = [
    address.street || '',
    address.city || '',
    address.state || '',
    address.zip || ''
  ].filter(part => part.trim().length > 0);
  return parts.join(', ').substring(0, 400); // Keep under 500 char limit
};

// Helper function to validate and limit metadata size
const validateMetadata = (metadata: Record<string, string>): { 
  isValid: boolean; 
  metadata: Record<string, string>; 
  warnings: string[] 
} => {
  const warnings: string[] = [];
  const validatedMetadata: Record<string, string> = {};
  
  // Stripe limits: 40 keys max, 500 chars per value, 5KB total
  const MAX_KEYS = 35; // Leave some buffer
  const MAX_VALUE_LENGTH = 450; // Leave some buffer
  
  let totalSize = 0;
  let keyCount = 0;
  
  for (const [key, value] of Object.entries(metadata)) {
    if (keyCount >= MAX_KEYS) {
      warnings.push(`Skipped key '${key}' - exceeded maximum of ${MAX_KEYS} keys`);
      continue;
    }
    
    const truncatedValue = String(value || '').substring(0, MAX_VALUE_LENGTH);
    const entrySize = key.length + truncatedValue.length;
    
    if (totalSize + entrySize > 4500) { // 4.5KB buffer for 5KB limit
      warnings.push(`Skipped key '${key}' - would exceed total size limit`);
      continue;
    }
    
    if (truncatedValue.length < String(value || '').length) {
      warnings.push(`Truncated value for '${key}' from ${String(value || '').length} to ${truncatedValue.length} chars`);
    }
    
    validatedMetadata[key] = truncatedValue;
    totalSize += entrySize;
    keyCount++;
  }
  
  return {
    isValid: keyCount <= MAX_KEYS && totalSize <= 4500,
    metadata: validatedMetadata,
    warnings
  };
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
    console.log('=== CREATE-PAYMENT FUNCTION START ===');
    
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }
    
    const { items, orderId } = parsedData;
    console.log('Parsed items count:', items?.length || 0);
    console.log('Order ID:', orderId);
    
    // Access Stripe secret key and validate it exists
    const stripeKey = Deno.env.get("stripe");
    if (!stripeKey) {
      console.error('Stripe secret key is missing');
      return new Response(
        JSON.stringify({ 
          error: "Stripe secret key not found in environment variables" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Use provided order ID or generate a new one
    const finalOrderId = orderId || `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Final order ID:', finalOrderId);

    // Validate and transform each item with OPTIMIZED metadata handling
    const validatedLineItems = [];
    let orderMetadata = { order_id: finalOrderId };
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        console.log(`Processing item ${i}:`, item);
        
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

        // OPTIMIZED: Create compressed metadata with essential information only
        const itemMetadata: Record<string, string> = {};
        
        // Essential product info (use shorter keys)
        itemMetadata[`i${i+1}_id`] = String(item.id || '');
        itemMetadata[`i${i+1}_cat`] = item.materialCategory || item.category || '';
        itemMetadata[`i${i+1}_qty`] = String(item.quantity || item.tons || 0);
        itemMetadata[`i${i+1}_price`] = String(item.price || 0);
        itemMetadata[`i${i+1}_total`] = String((item.price * item.quantity) || 0);

        // OPTIMIZED: Process metadata with compression and prioritization
        if (item.metadata) {
          console.log(`Processing metadata for item ${i}:`, item.metadata);
          
          // Priority 1: Contact information (essential for delivery)
          if (item.metadata.contactName) {
            itemMetadata[`i${i+1}_contact`] = `${item.metadata.contactName}|${item.metadata.contactPhone || ''}|${item.metadata.contactEmail || ''}`.substring(0, 400);
          }
          
          // Priority 2: Delivery date (essential for scheduling)
          if (item.metadata.deliveryDate) {
            try {
              const deliveryDate = new Date(item.metadata.deliveryDate);
              if (!isNaN(deliveryDate.getTime())) {
                itemMetadata[`i${i+1}_date`] = deliveryDate.toISOString().split('T')[0];
              }
            } catch (dateError) {
              console.warn(`Invalid delivery date for item ${i}:`, item.metadata.deliveryDate);
            }
          }
          
          // Priority 3: Compressed delivery address
          if (item.metadata.deliveryAddress) {
            try {
              const address = typeof item.metadata.deliveryAddress === 'string' ? 
                JSON.parse(item.metadata.deliveryAddress) : item.metadata.deliveryAddress;
              
              if (address && typeof address === 'object') {
                itemMetadata[`i${i+1}_addr`] = compressDeliveryAddress(address);
              }
            } catch (addressError) {
              console.warn(`Failed to parse delivery address for item ${i}:`, addressError);
            }
          }
          
          // Priority 4: Time preference and instructions (compressed)
          if (item.metadata.deliveryTimePreference) {
            itemMetadata[`i${i+1}_time`] = String(item.metadata.deliveryTimePreference).substring(0, 20);
          }
          
          if (item.metadata.deliveryInstructions) {
            const instructions = String(item.metadata.deliveryInstructions);
            itemMetadata[`i${i+1}_notes`] = instructions.substring(0, 200); // Reduced from 300
          }
        } else {
          console.warn(`No metadata found for item ${i}`);
        }
        
        // Add item metadata to order metadata with validation
        const { isValid, metadata: validatedItemMetadata, warnings } = validateMetadata(itemMetadata);
        
        if (warnings.length > 0) {
          console.warn(`Metadata warnings for item ${i}:`, warnings);
        }
        
        // Merge validated item metadata into order metadata
        Object.assign(orderMetadata, validatedItemMetadata);
        
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
        
        console.log(`Successfully processed item ${i}:`, cleanName);
      } catch (validationError) {
        console.error(`Item validation error for item ${i}:`, validationError);
        throw new Error(`Item validation error: ${validationError.message}`);
      }
    }

    // Final metadata validation before sending to Stripe
    const { isValid: finalValid, metadata: finalMetadata, warnings: finalWarnings } = validateMetadata(orderMetadata);
    
    if (finalWarnings.length > 0) {
      console.warn('Final metadata warnings:', finalWarnings);
    }
    
    if (!finalValid) {
      console.error('Final metadata validation failed, using minimal metadata');
      finalMetadata.order_id = finalOrderId;
      finalMetadata.item_count = String(items.length);
      finalMetadata.total_items = String(items.length);
    }

    console.log('Creating Stripe checkout session with items:', validatedLineItems.length);
    console.log('Final metadata keys count:', Object.keys(finalMetadata).length);
    console.log('Final metadata estimated size:', JSON.stringify(finalMetadata).length, 'bytes');

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
      success_url: `${origin}/payment-success?payment_intent={CHECKOUT_SESSION_ID}&order_id=${finalOrderId}`,
      cancel_url: `${origin}/cart`,
      metadata: finalMetadata,
      payment_intent_data: {
        metadata: finalMetadata
      },
      // Enable customer email collection
      customer_email: undefined, // Let Stripe prompt for email
      billing_address_collection: 'required',
      customer_creation: 'always',
      // Configure BNPL options
      payment_method_options: {
        klarna: {
          preferred_locale: "en-US"
        },
        afterpay_clearpay: {
          reference: finalOrderId
        },
        affirm: {
          preferred_locale: "en-US"
        }
      }
    });

    console.log('Stripe checkout session created successfully:', session.id);
    console.log('Customer email collection enabled for session');
    console.log('Metadata optimization completed successfully');

    console.log('=== CREATE-PAYMENT FUNCTION SUCCESS ===');
    
    // Return the checkout URL
    return new Response(
      JSON.stringify({ 
        url: session.url, 
        orderId: finalOrderId,
        sessionId: session.id,
        metadataWarnings: finalWarnings.length > 0 ? finalWarnings : undefined
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("=== CREATE-PAYMENT FUNCTION ERROR ===");
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    console.error("Full error object:", error);
    
    // Enhanced error response with more context
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: "A detailed error occurred during the checkout process",
        fullError: error.toString(),
        timestamp: new Date().toISOString(),
        errorType: error.name || 'UnknownError'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
