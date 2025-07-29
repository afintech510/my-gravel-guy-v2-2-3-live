
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
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
        💬 Quote Notes
      </h3>
      <div style="background-color: #f8f9fa; padding: 16px; border-radius: 6px; border-left: 4px solid #2563eb;">
        <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.6;">${quoteNotes}</p>
      </div>
    </div>
  ` : '';

  // Quote Items Section
  const itemsSection = quoteData && quoteData.length > 0 
    ? quoteData.map((item: any, index: number) => {
        const productName = productNameMap?.[item.product_id] || item.product_name || item.product_id;
        return `
        <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: ${index === quoteData.length - 1 ? '0' : '16px'};">
          <h4 style="color: #374151; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">
            ${productName}
          </h4>
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
            <div style="color: #6b7280; font-size: 14px;">
              <span style="font-weight: 500; color: #374151;">${item.quantity}</span> ${item.unit} × <span style="font-weight: 500; color: #374151;">$${item.unit_price.toFixed(2)}</span>
            </div>
            <div style="font-size: 18px; font-weight: 600; color: #2563eb;">
              $${item.total_price.toFixed(2)}
            </div>
          </div>
          ${item.notes ? `
          <div style="margin-top: 12px; padding: 12px; background-color: #f8f9fa; border-radius: 6px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #374151; font-size: 13px; line-height: 1.5;">
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
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
      <h3 style="color: #374151; margin: 0 0 16px 0; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
        📍 Delivery Information
      </h3>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <div>
          <h4 style="color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Delivery Contact</h4>
          <p style="margin: 0; color: #374151; font-size: 14px; font-weight: 500;">${deliveryInfo.name}</p>
          ${deliveryInfo.email ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">${deliveryInfo.email}</p>` : ''}
          ${deliveryInfo.phone ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">${deliveryInfo.phone}</p>` : ''}
        </div>
        ${deliveryInfo.address ? `
        <div>
          <h4 style="color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">Delivery Address</h4>
          <p style="margin: 0; color: #374151; font-size: 14px;">${deliveryInfo.address}</p>
          <p style="margin: 0; color: #374151; font-size: 14px;">${deliveryInfo.city}, ${deliveryInfo.state} ${deliveryInfo.zipCode}</p>
        </div>
        ` : ''}
        ${deliveryInfo.date ? `
        <div>
          <h4 style="color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">📅 Delivery Date</h4>
          <p style="margin: 0; color: #374151; font-size: 14px;">${new Date(deliveryInfo.date).toLocaleDateString()}</p>
        </div>
        ` : ''}
        ${deliveryInfo.timePreference ? `
        <div>
          <h4 style="color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">🕐 Time Preference</h4>
          <p style="margin: 0; color: #374151; font-size: 14px;">${deliveryInfo.timePreference}</p>
        </div>
        ` : ''}
        ${deliveryInfo.instructions ? `
        <div>
          <h4 style="color: #6b7280; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 4px 0;">📝 Delivery Instructions</h4>
          <div style="background-color: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; color: #374151; font-size: 14px; line-height: 1.5;">${deliveryInfo.instructions}</p>
          </div>
        </div>
        ` : ''}
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
          .container { padding: 10px !important; }
          .card { padding: 16px !important; }
          .quote-items { display: block !important; }
          .quote-item { margin-bottom: 16px !important; }
        }
      </style>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; line-height: 1.6; color: #374151; background-color: #f9fafb; margin: 0; padding: 0;">
      <div class="container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        
        <!-- Logo and Header -->
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
            <h1 style="color: #2563eb; margin: 0 0 8px 0; font-size: 24px; font-weight: 700;">My Gravel Guy</h1>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Premium Landscape Materials & Building Supplies</p>
          </div>
        </div>

        <!-- Quote Header -->
        <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <h2 style="color: #374151; margin: 0 0 8px 0; font-size: 20px; font-weight: 600;">Quote Review & Payment</h2>
          <div style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
            Quote ID: ${formData.orderId}
          </div>
          ${isExpired ? `
          <div style="margin-top: 12px; padding: 8px 16px; background-color: #fee2e2; border: 1px solid #fecaca; color: #dc2626; border-radius: 6px; font-size: 14px; font-weight: 500;">
            ⚠️ This quote has expired
          </div>
          ` : ''}
        </div>

        <!-- Quote Notes -->
        ${quoteNotesSection}

        <!-- Quote Items -->
        <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <h3 style="color: #374151; margin: 0 0 16px 0; font-size: 18px; font-weight: 600; display: flex; align-items: center;">
            📦 Quote Items
          </h3>
          <div class="quote-items" style="display: flex; flex-direction: column; gap: 16px;">
            ${itemsSection}
          </div>
          
          <!-- Total Amount -->
          <div style="margin-top: 20px; padding: 20px; background-color: #f8fafc; border-radius: 8px; border: 2px solid #e2e8f0;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 18px; font-weight: 600; color: #374151;">Total Amount</span>
              <span style="font-size: 24px; font-weight: 700; color: #2563eb;">$${totalAmount}</span>
            </div>
          </div>
        </div>

        <!-- Delivery Information -->
        ${deliveryInfoSection}

        ${!isExpired ? `
        <!-- Accept Quote Button -->
        <div style="background-color: #059669; color: white; padding: 24px; border-radius: 8px; text-align: center; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600;">Ready to proceed?</h3>
          <p style="margin: 0 0 20px 0; opacity: 0.9; font-size: 14px;">Click the button below to review your quote and complete your purchase securely online.</p>
          <a href="${quoteUrl}" style="display: inline-block; background-color: white; color: #059669; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); transition: all 0.2s;">
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

        <!-- Contact Information -->
        <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
          <h4 style="margin: 0 0 12px 0; color: #374151; font-size: 16px; font-weight: 600;">Questions or Need Changes?</h4>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Contact us at:</p>
          <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Email:</strong> sales@mygravelguy.com</p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0 0 4px 0;">Thank you for choosing My Gravel Guy</p>
          <p style="margin: 0;">Premium materials delivered with excellence</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
