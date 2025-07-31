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
 * Generate HTML email template for quote conversion confirmation
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

    // Generate email content
    const emailHtml = generateQuoteConversionEmail(emailData, productNameMap);

    logQuoteEmail('Sending customer confirmation email');

    // Send customer confirmation email
    const { data: customerEmailData, error: customerEmailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: emailData.customerEmail,
        subject: `Order Confirmation - ${emailData.orderId}`,
        html: emailHtml,
        type: 'customer_confirmation',
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
        html: emailHtml,
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