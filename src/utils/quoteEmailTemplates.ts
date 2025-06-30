
export const generateQuoteRequestEmail = (formData: {
  name: string;
  email: string;
  phone: string;
  message: string;
  zipCode: string;
  selectedProduct?: { name: string } | null;
}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Quote Request</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9f9f9; padding: 20px; }
        .field { margin-bottom: 15px; }
        .label { font-weight: bold; color: #555; }
        .value { margin-left: 10px; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Quote Request</h1>
        </div>
        <div class="content">
          <div class="field">
            <span class="label">Customer Name:</span>
            <span class="value">${formData.name}</span>
          </div>
          <div class="field">
            <span class="label">Email:</span>
            <span class="value">${formData.email}</span>
          </div>
          <div class="field">
            <span class="label">Phone:</span>
            <span class="value">${formData.phone}</span>
          </div>
          <div class="field">
            <span class="label">ZIP Code:</span>
            <span class="value">${formData.zipCode}</span>
          </div>
          ${formData.selectedProduct ? `
          <div class="field">
            <span class="label">Selected Material:</span>
            <span class="value">${formData.selectedProduct.name}</span>
          </div>
          ` : ''}
          <div class="field">
            <span class="label">Project Details:</span>
            <div style="margin-top: 10px; padding: 10px; background: white; border-left: 4px solid #2563eb;">
              ${formData.message || 'No additional details provided'}
            </div>
          </div>
        </div>
        <div class="footer">
          <p>This quote request was submitted through MyGravelGuy.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
