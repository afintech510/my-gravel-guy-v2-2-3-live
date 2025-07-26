
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
  const orderIdSection = formData.orderId
    ? `<p><strong>Quote ID:</strong> ${formData.orderId}</p>`
    : '';

  const quoteUrl = `${baseUrl}/quote-checkout/${formData.orderId}`;
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30);

  const itemsSection = quoteData && quoteData.length > 0 
    ? quoteData.map((item: any) => {
        const productName = productNameMap?.[item.product_id] || item.product_id;
        return `
        <div style="background-color: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <div style="font-size: 18px; font-weight: bold; color: #374151; margin-bottom: 8px;">
              ${productName}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div style="display: flex; flex-direction: column; min-width: 120px;">
                <span style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">Quantity</span>
                <span style="font-size: 16px; font-weight: 600; color: #374151;">${item.quantity} ${item.unit}</span>
              </div>
              <div style="display: flex; flex-direction: column; min-width: 120px;">
                <span style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">Unit Price</span>
                <span style="font-size: 16px; font-weight: 600; color: #374151;">$${item.unit_price.toFixed(2)}</span>
              </div>
              <div style="display: flex; flex-direction: column; min-width: 120px; text-align: right;">
                <span style="font-size: 14px; color: #6b7280; margin-bottom: 4px;">Total</span>
                <span style="font-size: 20px; font-weight: bold; color: #2563eb;">$${item.total_price.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      `;
      }).join('')
    : '<div style="background-color: #f8f9fa; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; text-align: center; color: #6b7280;">Quote details will be added by our team</div>';

  const totalAmount = quoteData && quoteData.length > 0 
    ? quoteData.reduce((sum: number, item: any) => sum + item.total_price, 0).toFixed(2)
    : '0.00';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Quote is Ready</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #2563eb; color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
        <h1 style="margin: 0 0 10px 0; font-size: 28px;">Your Quote is Ready!</h1>
        <p style="margin: 0; font-size: 16px; opacity: 0.9;">Thank you for your interest in our materials</p>
        ${orderIdSection}
      </div>
      
      <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 20px;">
        <h2 style="color: #374151; margin-top: 0;">Hello ${formData.name},</h2>
        <p>We're pleased to provide you with a detailed quote for your project. Please review the items and pricing below:</p>
        
        <div style="margin: 20px 0;">
          ${itemsSection}
          
          <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-top: 20px; text-align: center;">
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Total Amount</div>
            <div style="font-size: 28px; font-weight: bold;">$${totalAmount}</div>
          </div>
        </div>
      </div>

      <div style="background-color: #059669; color: white; padding: 25px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
        <h3 style="margin: 0 0 15px 0; font-size: 20px;">Ready to proceed?</h3>
        <p style="margin: 0 0 20px 0; opacity: 0.9;">Click the button below to review your quote and complete your purchase securely online.</p>
        <a href="${quoteUrl}" style="display: inline-block; background-color: white; color: #059669; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
          Accept Quote & Pay Now
        </a>
      </div>

      <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
        <h4 style="margin: 0 0 10px 0; color: #92400e;">Important Information:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #92400e;">
          <li>This quote is valid until ${expirationDate.toLocaleDateString()}</li>
          <li>Delivery is included to the specified address</li>
          <li>Payment is processed securely through Stripe</li>
          <li>You will receive an order confirmation after payment</li>
        </ul>
      </div>

      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
        <h4 style="margin: 0 0 15px 0; color: #374151;">Questions or Need Changes?</h4>
        <p style="margin: 0 0 10px 0;">Contact us at:</p>
        <p style="margin: 0;"><strong>Email:</strong> sales@mygravelguy.com</p>
      </div>

      <div style="margin-top: 30px; padding: 20px; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">Thank you for choosing Eastern Building Supply</p>
        <p style="margin: 0;">Professional materials delivered with excellence</p>
      </div>
    </body>
    </html>
  `;
};
