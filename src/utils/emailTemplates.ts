
interface OrderItem {
  product_name: string;
  quantity: number;
  total_price: number;
  delivery_date?: string;
  delivery_address?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  contact_info?: {
    name: string;
    email: string;
    phone: string;
  };
  delivery_time_preference?: string;
  delivery_instructions?: string;
}

interface OrderData {
  order_id: string;
  items: OrderItem[];
  total_amount: number;
  customer_email: string;
  customer_name?: string;
}

export const generateCustomerConfirmationEmail = (orderData: OrderData): string => {
  const formatDeliveryTime = (preference?: string) => {
    switch (preference) {
      case 'anytime': return 'Anytime (7am-5pm)';
      case 'morning': return 'Morning (7am-12pm)';
      case 'afternoon': return 'Afternoon (12pm-5pm)';
      default: return 'Not specified';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .order-item { background-color: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #10b981; }
        .delivery-info { background-color: #e5f3ff; padding: 15px; margin: 10px 0; border-radius: 6px; }
        .total { font-size: 18px; font-weight: bold; color: #10b981; text-align: right; margin-top: 20px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
        .contact-info { background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 6px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Order Confirmation</h1>
        <p>Thank you for your order!</p>
    </div>
    
    <div class="content">
        <h2>Order Details</h2>
        <p><strong>Order ID:</strong> ${orderData.order_id}</p>
        <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
        
        ${orderData.items.map(item => `
            <div class="order-item">
                <h3>${item.product_name}</h3>
                <p><strong>Quantity:</strong> ${item.quantity} tons</p>
                <p><strong>Price:</strong> $${item.total_price.toFixed(2)}</p>
                
                ${item.delivery_address ? `
                    <div class="delivery-info">
                        <h4>Delivery Information</h4>
                        <p><strong>Date:</strong> ${formatDate(item.delivery_date)}</p>
                        <p><strong>Time:</strong> ${formatDeliveryTime(item.delivery_time_preference)}</p>
                        <p><strong>Address:</strong><br>
                        ${item.delivery_address.street}<br>
                        ${item.delivery_address.city}, ${item.delivery_address.state} ${item.delivery_address.zip}</p>
                        ${item.delivery_instructions ? `<p><strong>Special Instructions:</strong> ${item.delivery_instructions}</p>` : ''}
                    </div>
                ` : ''}
            </div>
        `).join('')}
        
        <div class="total">
            Total: $${orderData.total_amount.toFixed(2)}
        </div>
        
        <div class="contact-info">
            <h3>What's Next?</h3>
            <p>1. Your order is being processed</p>
            <p>2. We'll prepare your materials for delivery</p>
            <p>3. Our team will deliver on your scheduled date</p>
            
            <p><strong>Questions?</strong> Contact us at:</p>
            <p>Phone: (555) 123-4567<br>
            Email: support@yourcompany.com</p>
        </div>
    </div>
    
    <div class="footer">
        <p>Thank you for choosing us for your material needs!</p>
        <p>This is an automated email. Please do not reply directly to this message.</p>
    </div>
</body>
</html>
  `;
};

export const generateInternalNotificationEmail = (orderData: OrderData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Order Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background-color: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
        .order-item { background-color: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #3b82f6; }
        .urgent { background-color: #fee2e2; border-left-color: #ef4444; }
        .customer-info { background-color: #e0f2fe; padding: 15px; margin: 10px 0; border-radius: 6px; }
        .total { font-size: 18px; font-weight: bold; color: #3b82f6; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 New Order Received</h1>
        <p>Order ID: ${orderData.order_id}</p>
    </div>
    
    <div class="content">
        <div class="customer-info">
            <h3>Customer Information</h3>
            <p><strong>Email:</strong> ${orderData.customer_email}</p>
            ${orderData.customer_name ? `<p><strong>Name:</strong> ${orderData.customer_name}</p>` : ''}
        </div>
        
        <h3>Order Items (${orderData.items.length})</h3>
        ${orderData.items.map(item => `
            <div class="order-item">
                <h4>${item.product_name}</h4>
                <p><strong>Quantity:</strong> ${item.quantity} tons</p>
                <p><strong>Value:</strong> $${item.total_price.toFixed(2)}</p>
                
                ${item.delivery_date ? `
                    <p><strong>Delivery Date:</strong> ${new Date(item.delivery_date).toLocaleDateString()}</p>
                ` : ''}
                
                ${item.delivery_address ? `
                    <p><strong>Delivery Address:</strong><br>
                    ${item.delivery_address.street}<br>
                    ${item.delivery_address.city}, ${item.delivery_address.state} ${item.delivery_address.zip}</p>
                ` : ''}
                
                ${item.contact_info ? `
                    <p><strong>Contact:</strong> ${item.contact_info.name} - ${item.contact_info.phone}</p>
                ` : ''}
            </div>
        `).join('')}
        
        <div class="total">
            <p>Total Order Value: $${orderData.total_amount.toFixed(2)}</p>
        </div>
        
        <div class="urgent">
            <h3>Action Required</h3>
            <p>• Review and confirm delivery arrangements</p>
            <p>• Contact customer if delivery details need clarification</p>
            <p>• Schedule delivery with operations team</p>
            <p>• Update order status in the dashboard</p>
        </div>
    </div>
</body>
</html>
  `;
};
