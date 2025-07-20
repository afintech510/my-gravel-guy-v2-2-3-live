
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
