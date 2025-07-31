import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteConversionEmailRequest {
  orderId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  orderItems: Array<{
    id: string;
    product_id: string;
    product_name?: string;
    quantity: number;
    unit: string;
    unit_price: number;
    total_price: number;
    delivery_date?: string;
    delivery_street?: string;
    delivery_city?: string;
    delivery_state?: string;
    delivery_zip?: string;
    delivery_name?: string;
    delivery_phone?: string;
    delivery_email?: string;
    delivery_time_preference?: string;
    delivery_instructions?: string;
  }>;
}

const logQuoteEmail = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-QUOTE-CONVERSION-EMAIL] ${step}${detailsStr}`);
};

/**
 * Resolve product IDs to readable names using the products table
 */
const resolveProductNames = async (supabase: any, productIds: string[]): Promise<{ [key: string]: string }> => {
  logQuoteEmail('Resolving product names', { productIds });
  
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name')
      .in('id', productIds);

    if (error) {
      logQuoteEmail('Error fetching product names', { error: error.message });
      return {};
    }

    const productNameMap: { [key: string]: string } = {};
    products?.forEach((product: any) => {
      productNameMap[product.id] = product.name;
    });

    logQuoteEmail('Product names resolved', { 
      requestedIds: productIds.length,
      resolvedNames: Object.keys(productNameMap).length 
    });

    return productNameMap;
  } catch (error) {
    logQuoteEmail('Failed to resolve product names', { error: error.message });
    return {};
  }
};

/**
 * Generate HTML email template for quote proposal (customer email)
 */
const generateQuoteProposalEmail = (data: QuoteConversionEmailRequest, productNameMap: { [key: string]: string }, baseUrl: string = 'https://easternbuilding.supply'): string => {
  const quoteUrl = `${baseUrl}/quote-checkout/${data.orderId}`;
  
  // Quote Items Section
  const itemsSection = data.orderItems.map((item, index) => {
    const productName = productNameMap[item.product_id] || item.product_name || item.product_id;
    return `
     <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: ${index === data.orderItems.length - 1 ? '0' : '20px'};">
       <div class="item-container" style="display: flex; justify-content: space-between; align-items: center; gap: 20px;">
         <div class="item-info" style="flex: 1;">
           <h3 style="font-size: 18px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0;">${productName}</h3>
           <div style="color: #64748b; font-size: 14px;">
             ${item.quantity} ${item.unit} × $${item.unit_price.toFixed(2)}
           </div>
         </div>
         <div class="item-price" style="font-size: 24px; font-weight: 700; color: #2563eb; text-align: right; min-width: 140px; padding-left: 24px; white-space: nowrap;">$${item.total_price.toFixed(2)}</div>
       </div>
       ${item.delivery_instructions ? `
       <div style="margin-top: 16px; padding: 16px; background-color: #f1f5f9; border-radius: 6px; border-left: 4px solid #10b981;">
         <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
           <strong style="color: #059669;">Delivery Instructions:</strong> ${item.delivery_instructions}
         </p>
       </div>
       ` : ''}
    </div>
   `;
   }).join('');

  // Total Amount
  const totalAmount = data.totalAmount.toFixed(2);

  // Get delivery info from first item
  const firstItem = data.orderItems[0];
  const deliveryInfo = firstItem ? {
    name: firstItem.delivery_name || data.customerName,
    email: firstItem.delivery_email || data.customerEmail,
    phone: firstItem.delivery_phone || '',
    address: firstItem.delivery_street || '',
    city: firstItem.delivery_city || '',
    state: firstItem.delivery_state || '',
    zip: firstItem.delivery_zip || '',
    date: firstItem.delivery_date || '',
    timePreference: firstItem.delivery_time_preference || 'anytime'
  } : null;

  // Delivery Information Section
  const deliveryInfoSection = deliveryInfo ? `
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; margin-bottom: 32px;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 24px;">
        <div>
          <h4 style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Delivery Contact</h4>
          <div style="color: #1e293b; font-weight: 600; margin-bottom: 6px;">${deliveryInfo.name}</div>
          ${deliveryInfo.email ? `<div style="color: #3b82f6; margin-bottom: 6px;">${deliveryInfo.email}</div>` : ''}
          ${deliveryInfo.phone ? `<div style="color: #64748b;">${deliveryInfo.phone}</div>` : ''}
        </div>
        
        <div>
          <h4 style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Delivery Address</h4>
          <div style="color: #1e293b; line-height: 1.5;">
            ${deliveryInfo.address || 'N/A'}<br>
            ${deliveryInfo.city || ''} ${deliveryInfo.state || ''} ${deliveryInfo.zip || ''}
          </div>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px;">
        <div>
          <h4 style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">🚚 Delivery Date</h4>
          <div style="color: #1e293b;">${deliveryInfo.date ? new Date(deliveryInfo.date).toLocaleDateString() : 'N/A'}</div>
        </div>
        
        <div>
          <h4 style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">🕐 Time Preference</h4>
          <div style="color: #1e293b;">${deliveryInfo.timePreference || 'anytime'}</div>
        </div>
      </div>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quote Review & Payment - My Gravel Guy</title>
      <style>
        @media only screen and (max-width: 600px) {
          .responsive-grid {
            display: block !important;
          }
          .responsive-grid > div {
            margin-bottom: 16px !important;
          }
          .price-display {
            text-align: left !important;
            margin-top: 8px !important;
          }
          .item-price {
            font-size: 18px !important;
            min-width: 100px !important;
            padding-left: 12px !important;
          }
          .total-price {
            font-size: 24px !important;
            min-width: 120px !important;
          }
          .item-container {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 8px !important;
          }
          .item-info {
            width: 100% !important;
          }
        }
      </style>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        
        <!-- Logo Section -->
        <div style="text-align: center; padding: 32px 32px 0 32px;">
          <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 32px; font-weight: 700; color: #2563eb; margin: 0; letter-spacing: -0.5px;">My Gravel Guy</h1>
        </div>

        <div style="padding: 32px;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 16px 0;">Quote Review & Payment</h1>
            <div style="background: #dbeafe; color: #1e40af; padding: 12px 20px; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 14px;">
              QUOTE ID: ${data.orderId}
            </div>
          </div>

          <!-- Quote Items Section -->
          <div style="margin-bottom: 32px;">
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
              <div style="background: #f97316; width: 24px; height: 24px; border-radius: 4px; margin-right: 12px; display: flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 14px;">📦</span>
              </div>
              <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin: 0;">Quote Items</h2>
            </div>
            
            ${itemsSection}

            <!-- Total Amount -->
            <div style="background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-top: 24px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                <span style="font-size: 20px; font-weight: 600; color: #475569;">Total Amount</span>
                <span class="total-price" style="font-size: 32px; font-weight: 700; color: #2563eb; min-width: 160px; text-align: right; white-space: nowrap;">$${totalAmount}</span>
              </div>
            </div>
          </div>

          <!-- Delivery Information -->
          <div style="margin-bottom: 32px;">
            <div style="display: flex; align-items: center; margin-bottom: 24px;">
              <span style="font-size: 20px; margin-right: 8px;">📍</span>
              <h2 style="font-size: 20px; font-weight: 600; color: #1e293b; margin: 0;">Delivery Information</h2>
            </div>
            
            ${deliveryInfoSection}
          </div>

          <!-- Call to Action -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${quoteUrl}" 
               style="background: #22c55e; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);">
              Accept Quote & Pay Now
            </a>
          </div>

          <!-- Important Information -->
          <div style="background-color: #fffbeb; border: 1px solid #fed7aa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">Important Information:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.6;">
              <li>Delivery is included to the specified address</li>
              <li>Payment is processed securely through Stripe</li>
              <li>You will receive an order confirmation after payment</li>
            </ul>
          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">My Gravel Guy - Your trusted landscape material supplier</p>
            <p style="margin: 0;">Questions? Contact us at info@mygravelguy.com or (555) 123-4567</p>
          </div>
        </div>

      </div>
    </body>
    </html>
  `;
};

/**
 * Generate HTML email template for quote conversion confirmation (internal use)
 */
const generateQuoteConversionEmail = (data: QuoteConversionEmailRequest, productNameMap: { [key: string]: string }): string => {
  const itemsHtml = data.orderItems.map(item => {
    const productName = productNameMap[item.product_id] || item.product_name || item.product_id;
    return `
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 16px; font-weight: 600;">${productName}</h3>
            <div style="color: #64748b; font-size: 14px;">
              ${item.quantity} ${item.unit} × $${item.unit_price.toFixed(2)}
            </div>
          </div>
          <div style="font-size: 20px; font-weight: 700; color: #2563eb;">
            $${item.total_price.toFixed(2)}
          </div>
        </div>
        ${item.delivery_instructions ? `
        <div style="margin-top: 12px; padding: 12px; background-color: #f1f5f9; border-radius: 6px; border-left: 4px solid #10b981;">
          <strong style="color: #059669;">Delivery Instructions:</strong> ${item.delivery_instructions}
        </div>
        ` : ''}
      </div>
    `;
  }).join('');

  // Get delivery info from first item
  const firstItem = data.orderItems[0];
  const deliveryInfo = firstItem ? {
    name: firstItem.delivery_name || data.customerName,
    email: firstItem.delivery_email || data.customerEmail,
    phone: firstItem.delivery_phone || '',
    address: firstItem.delivery_street || '',
    city: firstItem.delivery_city || '',
    state: firstItem.delivery_state || '',
    zip: firstItem.delivery_zip || '',
    date: firstItem.delivery_date || '',
    timePreference: firstItem.delivery_time_preference || 'anytime'
  } : null;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - My Gravel Guy</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: #2563eb; color: white; padding: 32px; text-align: center;">
          <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: 700;">Quote Converted to Order!</h1>
          <p style="margin: 0; font-size: 16px; opacity: 0.9;">Payment successful - Order confirmed</p>
        </div>

        <div style="padding: 32px;">
          <!-- Order Details -->
          <div style="background: #dbeafe; color: #1e40af; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center;">
            <strong>Order ID: ${data.orderId}</strong>
          </div>

          <!-- Customer Info -->
          <div style="margin-bottom: 32px;">
            <h2 style="color: #1e293b; margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Order Summary</h2>
            <p style="margin: 0 0 8px 0;"><strong>Customer:</strong> ${data.customerName}</p>
            <p style="margin: 0;"><strong>Email:</strong> ${data.customerEmail}</p>
          </div>

          <!-- Order Items -->
          <div style="margin-bottom: 32px;">
            <h3 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Items Ordered</h3>
            ${itemsHtml}
            
            <!-- Total -->
            <div style="background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 16px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 18px; font-weight: 600; color: #475569;">Total Amount Paid</span>
                <span style="font-size: 24px; font-weight: 700; color: #2563eb;">$${(data.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          ${deliveryInfo ? `
          <!-- Delivery Information -->
          <div style="margin-bottom: 32px;">
            <h3 style="color: #1e293b; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Delivery Information</h3>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
              <div style="margin-bottom: 16px;">
                <strong>Contact:</strong> ${deliveryInfo.name}<br>
                ${deliveryInfo.email ? `<strong>Email:</strong> ${deliveryInfo.email}<br>` : ''}
                ${deliveryInfo.phone ? `<strong>Phone:</strong> ${deliveryInfo.phone}<br>` : ''}
              </div>
              <div style="margin-bottom: 16px;">
                <strong>Address:</strong><br>
                ${deliveryInfo.address}<br>
                ${deliveryInfo.city} ${deliveryInfo.state} ${deliveryInfo.zip}
              </div>
              ${deliveryInfo.date ? `<div style="margin-bottom: 16px;"><strong>Delivery Date:</strong> ${new Date(deliveryInfo.date).toLocaleDateString()}</div>` : ''}
              <div><strong>Time Preference:</strong> ${deliveryInfo.timePreference}</div>
            </div>
          </div>
          ` : ''}

          <!-- Next Steps -->
          <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px; font-weight: 600;">What's Next?</h3>
            <ul style="margin: 0; padding-left: 20px; color: #065f46; font-size: 14px; line-height: 1.6;">
              <li>Our team will contact you within 24 hours to confirm delivery details</li>
              <li>You'll receive a tracking notification when your order is dispatched</li>
              <li>Our driver will call 30 minutes before arrival</li>
              <li>Payment has been successfully processed</li>
            </ul>
          </div>

          <!-- Contact -->
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">Questions about your order?</p>
            <p style="margin: 0;"><strong>Contact us:</strong> sales@mygravelguy.com | (555) 123-4567</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logQuoteEmail('Function invoked');

    // Environment validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      logQuoteEmail('Missing environment variables');
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse request body
    const emailData: QuoteConversionEmailRequest = await req.json();
    
    logQuoteEmail('Processing quote conversion email', { 
      orderId: emailData.orderId, 
      customerEmail: emailData.customerEmail,
      itemCount: emailData.orderItems.length 
    });

    // Resolve product names for better email readability
    const productIds = emailData.orderItems.map(item => item.product_id);
    const productNameMap = await resolveProductNames(supabase, productIds);

    // Generate email content for customer (quote proposal template)
    const customerEmailHtml = generateQuoteProposalEmail(emailData, productNameMap);
    
    // Generate email content for internal (order confirmation template)
    const internalEmailHtml = generateQuoteConversionEmail(emailData, productNameMap);

    logQuoteEmail('Sending customer quote proposal email');

    // Send customer quote proposal email
    const { data: customerEmailData, error: customerEmailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: emailData.customerEmail,
        subject: 'MyGravelGuy Quote is ready for review',
        html: customerEmailHtml,
        type: 'customer_quote_proposal',
        orderData: {
          customer_email: emailData.customerEmail,
          customer_name: emailData.customerName,
          order_id: emailData.orderId,
          total_amount: emailData.totalAmount
        }
      }
    });

    if (customerEmailError) {
      logQuoteEmail('Customer email failed', { error: customerEmailError.message });
    } else {
      logQuoteEmail('Customer email sent successfully', { emailId: customerEmailData?.id });
    }

    // Send internal notification email
    logQuoteEmail('Sending internal notification email');
    
    const { data: internalEmailData, error: internalEmailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'sales@mygravelguy.com',
        subject: `Quote Converted to Order - ${emailData.orderId}`,
        html: internalEmailHtml,
        type: 'internal_notification',
        orderData: {
          customer_email: emailData.customerEmail,
          customer_name: emailData.customerName,
          order_id: emailData.orderId,
          total_amount: emailData.totalAmount
        }
      }
    });

    if (internalEmailError) {
      logQuoteEmail('Internal email failed', { error: internalEmailError.message });
    } else {
      logQuoteEmail('Internal email sent successfully', { emailId: internalEmailData?.id });
    }

    // Return success if at least customer email succeeded
    const success = !customerEmailError;
    const errorMessage = customerEmailError ? `Customer email failed: ${customerEmailError.message}` : 
                         internalEmailError ? `Internal email failed: ${internalEmailError.message}` : undefined;

    logQuoteEmail('Quote conversion email process completed', { 
      success, 
      customerEmailSent: !customerEmailError,
      internalEmailSent: !internalEmailError
    });

    return new Response(
      JSON.stringify({
        success,
        error: errorMessage,
        customer_email_sent: !customerEmailError,
        internal_email_sent: !internalEmailError,
        customer_email_id: customerEmailData?.id,
        internal_email_id: internalEmailData?.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: success ? 200 : 500,
      }
    );

  } catch (error) {
    logQuoteEmail('Function error', { error: error.message });
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});