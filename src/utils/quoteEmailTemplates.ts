
interface QuoteFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  zipCode: string;
  selectedProduct?: { name: string } | null;
  orderId?: string;
}

export const generateQuoteRequestEmail = (formData: QuoteFormData): string => {
  const productSection = formData.selectedProduct 
    ? `<p><strong>Product Interest:</strong> ${formData.selectedProduct.name}</p>`
    : '';

  const orderIdSection = formData.orderId
    ? `<p><strong>Quote ID:</strong> ${formData.orderId}</p>`
    : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Quote Request</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h1 style="color: #2563eb; margin: 0 0 20px 0;">New Quote Request</h1>
        ${orderIdSection}
      </div>
      
      <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="color: #374151; margin-top: 0;">Customer Information</h2>
        <p><strong>Customer Name:</strong> ${formData.name}</p>
        <p><strong>Email:</strong> ${formData.email}</p>
        <p><strong>Phone:</strong> ${formData.phone}</p>
        <p><strong>ZIP Code:</strong> ${formData.zipCode}</p>
        ${productSection}
        
        <h2 style="color: #374151;">Project Details</h2>
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
          ${formData.message.replace(/\n/g, '<br>')}
        </div>
      </div>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #ecfdf5; border-radius: 8px; border: 1px solid #d1fae5;">
        <p style="margin: 0; color: #065f46;">
          <strong>Next Steps:</strong> Please respond to this quote request within 24 hours for the best customer experience.
        </p>
      </div>
    </body>
    </html>
  `;
};

export const generateQuoteProposalEmail = (formData: QuoteFormData, quoteData: any, baseUrl: string = 'https://easternbuilding.supply', productNameMap?: { [key: string]: string }): string => {
  const quoteUrl = `${baseUrl}/quote-checkout/${formData.orderId}`;
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30);

  // Check if quote has expired
  const currentDate = new Date();
  const isExpired = quoteData && quoteData.length > 0 && quoteData[0].quote_expires_at 
    ? new Date(quoteData[0].quote_expires_at) < currentDate 
    : false;

  // Get quote notes from the first item
  console.log('QuoteData for email:', quoteData);
  console.log('First item quote_notes:', quoteData && quoteData.length > 0 ? quoteData[0].quote_notes : 'No quote data');
  const quoteNotes = quoteData && quoteData.length > 0 && quoteData[0].quote_notes ? quoteData[0].quote_notes : null;

  // Get delivery information from the first item
  const deliveryInfo = quoteData && quoteData.length > 0 ? {
    name: quoteData[0].delivery_contact_name || formData.name,
    email: quoteData[0].delivery_contact_email || formData.email,
    phone: quoteData[0].delivery_contact_phone || formData.phone,
    address: quoteData[0].delivery_address,
    city: quoteData[0].delivery_city,
    state: quoteData[0].delivery_state,
    zipCode: quoteData[0].delivery_zip_code,
    date: quoteData[0].delivery_date,
    timePreference: quoteData[0].delivery_time_preference,
    instructions: quoteData[0].delivery_instructions
  } : null;

  // Quote Notes Section
  const quoteNotesSection = quoteNotes ? `
    <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 24px; margin: 32px 0; border-radius: 0 8px 8px 0;">
      <div style="display: flex; align-items: center; margin-bottom: 16px;">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" stroke-width="2" style="margin-right: 8px;">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <h3 style="font-size: 16px; font-weight: 600; color: #0c4a6e; margin: 0;">Quote Notes</h3>
      </div>
      <p style="color: #075985; margin: 0; line-height: 1.5;">${quoteNotes}</p>
    </div>
  ` : '';

  // Quote Items Section
  const itemsSection = quoteData && quoteData.length > 0 
    ? quoteData.map((item: any, index: number) => {
        const productName = productNameMap?.[item.product_id] || item.product_name || item.product_id;
        return `
         <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: ${index === quoteData.length - 1 ? '0' : '20px'};">
           <div class="item-container" style="display: flex; justify-content: space-between; align-items: center; gap: 20px;">
             <div class="item-info" style="flex: 1;">
               <h3 style="font-size: 18px; font-weight: 600; color: #1e293b; margin: 0 0 8px 0;">${productName}</h3>
               <div style="color: #64748b; font-size: 14px;">
                 ${item.quantity} ${item.unit} × $${item.unit_price.toFixed(2)}
               </div>
             </div>
             <div class="item-price" style="font-size: 24px; font-weight: 700; color: #2563eb; text-align: right; min-width: 140px; padding-left: 24px; white-space: nowrap;">$${item.total_price.toFixed(2)}</div>
           </div>
          ${item.notes ? `
          <div style="margin-top: 16px; padding: 16px; background-color: #f1f5f9; border-radius: 6px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">
              <strong style="color: #059669;">Note:</strong> ${item.notes}
            </p>
          </div>
          ` : ''}
        </div>
      `;
      }).join('')
    : '<div style="background-color: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; color: #6b7280;">Quote details will be added by our team</div>';

  // Total Amount
  const totalAmount = quoteData && quoteData.length > 0 
    ? quoteData.reduce((sum: number, item: any) => sum + item.total_price, 0).toFixed(2)
    : '0.00';

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
            ${deliveryInfo.city || ''} ${deliveryInfo.state || ''} ${deliveryInfo.zipCode || ''}
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
      
      ${deliveryInfo.instructions ? `
        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <h4 style="color: #64748b; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">📝 Delivery Instructions</h4>
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 4px 4px 0;">
            <div style="color: #92400e; line-height: 1.5;">${deliveryInfo.instructions}</div>
          </div>
        </div>
      ` : ''}
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
              QUOTE ID: ${formData.orderId}
            </div>
            ${isExpired ? `
            <div style="margin-top: 16px; padding: 12px 20px; background-color: #fee2e2; border: 1px solid #fecaca; color: #dc2626; border-radius: 6px; font-size: 14px; font-weight: 500;">
              ⚠️ This quote has expired
            </div>
            ` : ''}
          </div>

          ${quoteNotesSection}

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

          ${!isExpired ? `
          <!-- Call to Action -->
          <div style="text-align: center; margin-bottom: 32px;">
            <a href="${quoteUrl}" 
               style="background: #22c55e; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(34, 197, 94, 0.2);">
              Accept Quote & Pay Now
            </a>
          </div>
          ` : `
          <!-- Expired Quote -->
          <div style="background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
            <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">Quote Expired</h3>
            <p style="margin: 0; font-size: 14px;">This quote has expired. Please contact us for a new quote.</p>
          </div>
          `}

          <!-- Important Information -->
          <div style="background-color: #fffbeb; border: 1px solid #fed7aa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 600;">Important Information:</h4>
            <ul style="margin: 0; padding-left: 20px; color: #92400e; font-size: 14px; line-height: 1.6;">
              <li>This quote is valid until ${expirationDate.toLocaleDateString()}</li>
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
