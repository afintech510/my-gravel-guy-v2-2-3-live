
interface OrderData {
  order_id: string;
  items: any[];
  total_amount: number;
  customer_email: string;
  customer_name: string;
}

export const generateCheckoutConfirmationEmail = (orderData: OrderData): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Continued to Payment</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Continued to Payment 💳</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Customer proceeded to Stripe checkout</p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #dc2626; margin-top: 0;">Order ID: ${orderData.order_id}</h2>
        <p><strong>Customer:</strong> ${orderData.customer_name}</p>
        <p><strong>Email:</strong> ${orderData.customer_email}</p>
        <p><strong>Total Amount:</strong> $${orderData.total_amount.toFixed(2)}</p>
        <p><strong>Items:</strong> ${orderData.items.length}</p>
        <p><strong>Status:</strong> Proceeding to Stripe Payment</p>
        
        <div style="margin: 20px 0;">
          <h3>Order Items with Complete Delivery Details:</h3>
          ${orderData.items.map((item: any) => `
            <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
              <h4 style="margin-top: 0; color: #dc2626;">${item.product_name}</h4>
              <p><strong>Quantity:</strong> ${item.quantity} tons</p>
              <p><strong>Price:</strong> $${item.total_price.toFixed(2)}</p>
              
              ${item.contact_info ? `
                <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <h5 style="margin-top: 0; color: #991b1b;">Contact Information:</h5>
                  <p><strong>Name:</strong> ${item.contact_info.name}</p>
                  <p><strong>Phone:</strong> ${item.contact_info.phone}</p>
                  <p><strong>Email:</strong> ${item.contact_info.email}</p>
                </div>
              ` : ''}
              
              ${item.delivery_address ? `
                <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <h5 style="margin-top: 0; color: #991b1b;">Delivery Address:</h5>
                  <p>${item.delivery_address.street}</p>
                  <p>${item.delivery_address.city}, ${item.delivery_address.state} ${item.delivery_address.zip}</p>
                </div>
              ` : ''}
              
              ${item.delivery_date ? `
                <div style="background: #fef2f2; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <h5 style="margin-top: 0; color: #991b1b;">Delivery Schedule:</h5>
                  <p><strong>Date:</strong> ${new Date(item.delivery_date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}</p>
                  ${item.delivery_time_preference ? `
                    <p><strong>Time Preference:</strong> ${
                      item.delivery_time_preference === 'anytime' ? 'Anytime (7am-5pm)' :
                      item.delivery_time_preference === 'morning' ? 'Morning (7am-12pm)' :
                      item.delivery_time_preference === 'afternoon' ? 'Afternoon (12pm-5pm)' :
                      'Not specified'
                    }</p>
                  ` : ''}
                </div>
              ` : ''}
              
              ${item.delivery_instructions ? `
                <div style="background: #fff7ed; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <h5 style="margin-top: 0; color: #c2410c;">Special Instructions:</h5>
                  <p>${item.delivery_instructions}</p>
                </div>
              ` : ''}
              
              ${item.location_photo_url ? `
                <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <h5 style="margin-top: 0; color: #374151;">Location Photo:</h5>
                  <div style="text-align: center; margin: 10px 0;">
                    <img src="${item.location_photo_url}" alt="Customer Location Photo" style="max-width: 100%; height: auto; max-height: 300px; border-radius: 4px; border: 1px solid #d1d5db;" />
                  </div>
                  <p style="font-size: 12px; color: #6b7280; text-align: center;">Photo uploaded by customer</p>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </body>
    </html>
  `;
};
