
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
  base_total?: number;
  coupon_info?: {
    code: string;
    total_discount: number;
    applied: boolean;
  } | null;
  is_deposit_payment?: boolean;
  deposit_amount?: number;
  balance_due?: number;
}

const getEmailStyles = () => `
  <style>
    /* Reset styles for email clients */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    
    /* Mobile-first responsive design */
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .content-wrapper { padding: 10px !important; }
      .header-logo { font-size: 24px !important; }
      .order-item { padding: 12px !important; }
      .delivery-info { padding: 12px !important; }
      .button { padding: 12px 20px !important; font-size: 16px !important; }
      .mobile-stack { display: block !important; width: 100% !important; }
    }
    
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg { background-color: #1f2937 !important; }
      .dark-mode-text { color: #f9fafb !important; }
      .dark-mode-border { border-color: #374151 !important; }
    }
  </style>
`;

const getEmailHeader = (title: string) => `
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <div style="max-width: 600px; margin: 0 auto;">
      <h1 class="header-logo" style="color: white; font-size: 28px; font-weight: bold; margin: 0 0 10px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
        🪨 My Gravel Guy
      </h1>
      <p style="color: #d1fae5; font-size: 16px; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
        ${title}
      </p>
    </div>
  </div>
`;

const getEmailFooter = () => `
  <div style="background-color: #f8fafc; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
    <div style="max-width: 600px; margin: 0 auto;">
      <div style="margin-bottom: 20px;">
        <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 10px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
          Need Help?
        </h3>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 15px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
          Our customer service team is here to help
        </p>
        <div style="margin: 15px 0;">
          <p style="color: #374151; font-size: 14px; margin: 5px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
            📞 <strong>Phone:</strong> (555) 123-4567
          </p>
          <p style="color: #374151; font-size: 14px; margin: 5px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
            ✉️ <strong>Email:</strong> support@mygravelguy.com
          </p>
          <p style="color: #374151; font-size: 14px; margin: 5px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
            🕒 <strong>Hours:</strong> Mon-Fri, 8am-5pm
          </p>
        </div>
      </div>
      
      <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 20px;">
        <p style="color: #9ca3af; font-size: 12px; margin: 5px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
          © 2024 My Gravel Guy. All rights reserved.
        </p>
        <p style="color: #9ca3af; font-size: 12px; margin: 5px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
          This email was sent because you placed an order with us.
        </p>
        <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
          If you have questions about this order, please contact us using the information above.
        </p>
      </div>
    </div>
  </div>
`;

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
    // Parse DATE-only strings as local dates to avoid timezone issues
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Order Confirmation - ${orderData.order_id}</title>
    ${getEmailStyles()}
</head>
<body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div class="container" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        ${getEmailHeader('Thank you for your order!')}
        
        <div class="content-wrapper" style="padding: 30px 20px;">
            <!-- Success Message -->
            <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 60px; height: 60px; background-color: #10b981; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="color: white; font-size: 24px;">✓</span>
                </div>
                <h2 style="color: #1f2937; font-size: 24px; margin: 0 0 10px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    Order Confirmed!
                </h2>
                <p style="color: #6b7280; font-size: 16px; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    We've received your order and are preparing it for delivery
                </p>
            </div>

            <!-- Order Details -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; padding-bottom: 10px; border-bottom: 2px solid #10b981; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    📋 Order Details
                </h3>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                    <p style="margin: 5px 0; font-family: 'Helvetica Neue', Arial, sans-serif;"><strong>Order ID:</strong> ${orderData.order_id}</p>
                    <p style="margin: 5px 0; font-family: 'Helvetica Neue', Arial, sans-serif;"><strong>Order Date:</strong> ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <p style="margin: 5px 0; font-family: 'Helvetica Neue', Arial, sans-serif;"><strong>Customer:</strong> ${orderData.customer_name || 'Valued Customer'}</p>
                </div>
            </div>

            <!-- Order Items -->
            <div style="margin-bottom: 30px;">
                <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    📦 Your Items
                </h3>
                ${orderData.items.map(item => `
                    <div class="order-item" style="background-color: white; padding: 20px; margin: 15px 0; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 15px;">
                            <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 8px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                ${item.product_name}
                            </h4>
                            <div class="mobile-stack" style="display: table; width: 100%;">
                                <div style="display: table-cell; vertical-align: top;">
                                    <p style="color: #6b7280; font-size: 14px; margin: 3px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                        <strong>Quantity:</strong> ${item.quantity} tons
                                    </p>
                                </div>
                                <div style="display: table-cell; vertical-align: top; text-align: right;">
                                    <p style="color: #10b981; font-size: 18px; font-weight: bold; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                        $${item.total_price.toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        ${item.delivery_address ? `
                            <div class="delivery-info" style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #0ea5e9;">
                                <h5 style="color: #0c4a6e; font-size: 14px; margin: 0 0 10px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                    🚚 Delivery Information
                                </h5>
                                <div style="display: table; width: 100%;">
                                    <div class="mobile-stack" style="display: table-cell; vertical-align: top; width: 50%; padding-right: 10px;">
                                        <p style="color: #1e40af; font-size: 13px; margin: 2px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                            <strong>📅 Date:</strong> ${formatDate(item.delivery_date)}
                                        </p>
                                        <p style="color: #1e40af; font-size: 13px; margin: 2px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                            <strong>🕒 Time:</strong> ${formatDeliveryTime(item.delivery_time_preference)}
                                        </p>
                                    </div>
                                    <div class="mobile-stack" style="display: table-cell; vertical-align: top; width: 50%;">
                                        <p style="color: #1e40af; font-size: 13px; margin: 2px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                            <strong>📍 Address:</strong><br>
                                            ${item.delivery_address.street}<br>
                                            ${item.delivery_address.city}, ${item.delivery_address.state} ${item.delivery_address.zip}
                                        </p>
                                    </div>
                                </div>
                                ${item.delivery_instructions ? `
                                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #bae6fd;">
                                        <p style="color: #1e40af; font-size: 13px; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                            <strong>📝 Special Instructions:</strong> ${item.delivery_instructions}
                                        </p>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>

            <!-- Coupon Information -->
            ${orderData.coupon_info ? `
                <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; border: 2px solid #10b981; margin-bottom: 20px;">
                    <h3 style="color: #047857; font-size: 18px; margin: 0 0 15px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                        🎟️ Coupon Applied
                    </h3>
                    <div style="background-color: white; padding: 15px; border-radius: 6px;">
                        <div style="display: table; width: 100%;">
                            <div style="display: table-cell; vertical-align: top; width: 50%;">
                                <p style="color: #065f46; font-size: 14px; margin: 3px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                    <strong>Coupon Code:</strong> ${orderData.coupon_info.code}
                                </p>
                                <p style="color: #065f46; font-size: 14px; margin: 3px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                    <strong>Original Total:</strong> $${(orderData.base_total || orderData.total_amount + orderData.coupon_info.total_discount).toFixed(2)}
                                </p>
                            </div>
                            <div style="display: table-cell; vertical-align: top; text-align: right;">
                                <p style="color: #dc2626; font-size: 16px; font-weight: bold; margin: 3px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                    Discount: -$${orderData.coupon_info.total_discount.toFixed(2)}
                                </p>
                                <p style="color: #047857; font-size: 16px; font-weight: bold; margin: 3px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                    You Saved: $${orderData.coupon_info.total_discount.toFixed(2)}!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- Order Total -->
            ${orderData.is_deposit_payment ? `
                <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border: 2px solid #f59e0b; margin-bottom: 20px;">
                    <h3 style="color: #92400e; font-size: 18px; margin: 0 0 15px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                        💰 Down Payment Confirmation
                    </h3>
                    <div style="background-color: white; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                        <p style="color: #92400e; font-size: 16px; margin: 0 0 10px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                            <strong>✅ Down Payment Charged:</strong> <span style="color: #10b981; font-weight: bold;">$${orderData.deposit_amount?.toFixed(2)}</span>
                        </p>
                        <p style="color: #92400e; font-size: 14px; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                            MyGravelGuy will negotiate the best price for your remaining balance and present you with payment options.
                        </p>
                    </div>
                    <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px;">
                        <h4 style="color: #0c4a6e; font-size: 16px; margin: 0 0 10px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                            Balance Due Options:
                        </h4>
                        <div style="display: table; width: 100%;">
                            <div class="mobile-stack" style="display: table-cell; width: 50%; padding-right: 10px;">
                                <div style="background-color: #dbeafe; padding: 12px; border-radius: 6px; border-left: 3px solid #3b82f6;">
                                    <p style="color: #1e40af; font-size: 13px; margin: 0 0 5px 0; font-weight: bold; font-family: 'Helvetica Neue', Arial, sans-serif;">💳 Card Price</p>
                                    <p style="color: #1e40af; font-size: 14px; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                        $${Math.round((orderData.total_amount - (orderData.deposit_amount || 0)) * 0.85)} - $${Math.round((orderData.total_amount - (orderData.deposit_amount || 0)) * 1.0)}
                                    </p>
                                    <p style="color: #6b7280; font-size: 11px; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">(85% - 100%)</p>
                                </div>
                            </div>
                            <div class="mobile-stack" style="display: table-cell; width: 50%;">
                                <div style="background-color: #dcfce7; padding: 12px; border-radius: 6px; border-left: 3px solid #10b981;">
                                    <p style="color: #15803d; font-size: 13px; margin: 0 0 5px 0; font-weight: bold; font-family: 'Helvetica Neue', Arial, sans-serif;">💵 Cash Price</p>
                                    <p style="color: #15803d; font-size: 14px; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                        $${Math.round((orderData.total_amount - (orderData.deposit_amount || 0)) * 0.70)} - $${Math.round((orderData.total_amount - (orderData.deposit_amount || 0)) * 0.90)}
                                    </p>
                                    <p style="color: #6b7280; font-size: 11px; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">(70% - 90%)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ` : `
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 2px solid #10b981; margin-bottom: 30px;">
                    <div style="text-align: right;">
                        <p style="color: #1f2937; font-size: 20px; font-weight: bold; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                            Total: <span style="color: #10b981;">$${orderData.total_amount.toFixed(2)}</span>
                        </p>
                    </div>
                </div>
            `}

            <!-- What's Next -->
            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 20px;">
                <h3 style="color: #92400e; font-size: 16px; margin: 0 0 15px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    🎯 What's Next?
                </h3>
                ${orderData.is_deposit_payment ? `
                    <ol style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px; font-family: 'Helvetica Neue', Arial, sans-serif;">
                        <li style="margin-bottom: 8px;">We've charged your down payment of $${orderData.deposit_amount?.toFixed(2)}</li>
                        <li style="margin-bottom: 8px;">Our team will negotiate the best price for your remaining balance</li>
                        <li style="margin-bottom: 8px;">You'll receive both cash and card pricing options within 24 hours</li>
                        <li style="margin-bottom: 8px;">Choose your preferred payment method for the balance</li>
                        <li>Your materials will be scheduled for delivery once balance is paid</li>
                    </ol>
                ` : `
                    <ol style="color: #92400e; font-size: 14px; margin: 0; padding-left: 20px; font-family: 'Helvetica Neue', Arial, sans-serif;">
                        <li style="margin-bottom: 8px;">Your order is being processed by our team</li>
                        <li style="margin-bottom: 8px;">We'll prepare your materials for delivery</li>
                        <li style="margin-bottom: 8px;">Our driver will deliver on your scheduled date</li>
                        <li>You'll receive tracking updates via email</li>
                    </ol>
                `}
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
                <a href="mailto:support@mygravelguy.com" class="button" style="background-color: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; display: inline-block; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    Contact Support
                </a>
            </div>
        </div>

        ${getEmailFooter()}
    </div>

    <!-- Tracking pixel for email analytics -->
    <img src="https://api.mygravelguy.com/email/track?order_id=${orderData.order_id}&type=customer_confirmation" width="1" height="1" style="display: none;" alt="">
</body>
</html>
  `;
};

export const generateInternalNotificationEmail = (orderData: OrderData): string => {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  
  const getUrgencyLevel = (totalAmount: number) => {
    if (totalAmount >= 1000) return { level: 'HIGH', color: '#dc2626', emoji: '🔴' };
    if (totalAmount >= 500) return { level: 'MEDIUM', color: '#f59e0b', emoji: '🟡' };
    return { level: 'NORMAL', color: '#10b981', emoji: '🟢' };
  };

  const urgency = getUrgencyLevel(orderData.total_amount);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>🚨 New Order: ${orderData.order_id}</title>
    ${getEmailStyles()}
</head>
<body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: 'Helvetica Neue', Arial, sans-serif;">
    <div class="container" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
        ${getEmailHeader('New Order Received')}
        
        <div class="content-wrapper" style="padding: 30px 20px;">
            <!-- Alert Banner -->
            <div style="background-color: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 15px; margin-bottom: 25px; text-align: center;">
                <h2 style="color: #dc2626; font-size: 22px; margin: 0 0 5px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    🚨 ACTION REQUIRED
                </h2>
                <p style="color: #7f1d1d; font-size: 14px; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    New order requiring immediate attention
                </p>
            </div>

            <!-- Order Overview -->
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid ${urgency.color};">
                <div style="display: table; width: 100%;">
                    <div style="display: table-cell; vertical-align: middle;">
                        <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 10px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                            Order ${orderData.order_id}
                        </h3>
                        <p style="color: #6b7280; font-size: 14px; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                            Received: ${new Date().toLocaleString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                        </p>
                    </div>
                    <div style="display: table-cell; vertical-align: middle; text-align: right;">
                        <div style="background-color: ${urgency.color}; color: white; padding: 8px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block;">
                            ${urgency.emoji} ${urgency.level} PRIORITY
                        </div>
                        <p style="color: #1f2937; font-size: 24px; font-weight: bold; margin: 5px 0 0 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                            ${formatCurrency(orderData.total_amount)}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Customer Information -->
            <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #0ea5e9;">
                <h3 style="color: #0c4a6e; font-size: 16px; margin: 0 0 15px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    👤 Customer Information
                </h3>
                <div style="display: table; width: 100%;">
                    <div class="mobile-stack" style="display: table-cell; vertical-align: top; width: 50%; padding-right: 15px;">
                        <p style="color: #0c4a6e; font-size: 14px; margin: 5px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                            <strong>📧 Email:</strong><br>
                            <a href="mailto:${orderData.customer_email}" style="color: #0ea5e9; text-decoration: none;">
                              ${orderData.customer_email}
                            </a>
                        </p>
                        ${orderData.customer_name ? `
                            <p style="color: #0c4a6e; font-size: 14px; margin: 5px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                <strong>👤 Name:</strong> ${orderData.customer_name}
                            </p>
                        ` : ''}
                    </div>
                    <div class="mobile-stack" style="display: table-cell; vertical-align: top; width: 50%;">
                        ${orderData.items[0]?.contact_info ? `
                            <p style="color: #0c4a6e; font-size: 14px; margin: 5px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                <strong>📞 Phone:</strong><br>
                                <a href="tel:${orderData.items[0].contact_info.phone}" style="color: #0ea5e9; text-decoration: none;">
                                  ${orderData.items[0].contact_info.phone}
                                </a>
                            </p>
                        ` : ''}
                    </div>
                </div>
            </div>

            <!-- Coupon Information (Internal) -->
            ${orderData.coupon_info ? `
                <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; border: 2px solid #10b981; margin-bottom: 20px;">
                    <h3 style="color: #047857; font-size: 16px; margin: 0 0 15px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                        🎟️ Coupon Applied - Revenue Impact
                    </h3>
                    <div style="background-color: white; padding: 15px; border-radius: 6px;">
                        <div style="display: table; width: 100%;">
                            <div style="display: table-cell; vertical-align: top; width: 50%;">
                                <p style="color: #065f46; font-size: 14px; margin: 3px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                    <strong>Coupon Code:</strong> ${orderData.coupon_info.code}
                                </p>
                                <p style="color: #065f46; font-size: 14px; margin: 3px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                    <strong>Original Amount:</strong> $${(orderData.base_total || orderData.total_amount + orderData.coupon_info.total_discount).toFixed(2)}
                                </p>
                            </div>
                            <div style="display: table-cell; vertical-align: top; text-align: right;">
                                <p style="color: #dc2626; font-size: 16px; font-weight: bold; margin: 3px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                    Revenue Loss: -$${orderData.coupon_info.total_discount.toFixed(2)}
                                </p>
                                <p style="color: #047857; font-size: 14px; margin: 3px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                    Final Order Value: $${orderData.total_amount.toFixed(2)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}

            <!-- Order Items -->
            <div style="margin-bottom: 25px;">
                <h3 style="color: #1f2937; font-size: 16px; margin: 0 0 15px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    📦 Order Items (${orderData.items.length})
                </h3>
                ${orderData.items.map((item, index) => `
                    <div style="background-color: white; padding: 20px; margin: 15px 0; border-radius: 8px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);">
                        <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 15px;">
                            <div style="display: table; width: 100%;">
                                <div style="display: table-cell; vertical-align: top;">
                                    <h4 style="color: #1f2937; font-size: 16px; margin: 0 0 5px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                        ${item.product_name}
                                    </h4>
                                    <p style="color: #6b7280; font-size: 14px; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                        Quantity: ${item.quantity} tons
                                    </p>
                                </div>
                                <div style="display: table-cell; vertical-align: top; text-align: right;">
                                    <p style="color: #dc2626; font-size: 18px; font-weight: bold; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                        ${formatCurrency(item.total_price)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        ${item.delivery_address ? `
                            <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
                                <h5 style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                    🚚 Delivery Details
                                </h5>
                                <div style="display: table; width: 100%;">
                                    <div class="mobile-stack" style="display: table-cell; vertical-align: top; width: 50%; padding-right: 10px;">
                                        ${item.delivery_date ? `
                                            <p style="color: #92400e; font-size: 13px; margin: 2px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                                <strong>📅 Date:</strong> ${new Date(item.delivery_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </p>
                                        ` : ''}
                                        ${item.delivery_time_preference ? `
                                            <p style="color: #92400e; font-size: 13px; margin: 2px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                                <strong>🕒 Time:</strong> ${item.delivery_time_preference}
                                            </p>
                                        ` : ''}
                                    </div>
                                    <div class="mobile-stack" style="display: table-cell; vertical-align: top; width: 50%;">
                                        <p style="color: #92400e; font-size: 13px; margin: 2px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                            <strong>📍 Address:</strong><br>
                                            ${item.delivery_address.street}<br>
                                            ${item.delivery_address.city}, ${item.delivery_address.state} ${item.delivery_address.zip}
                                        </p>
                                    </div>
                                </div>
                                ${item.delivery_instructions ? `
                                    <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #fcd34d;">
                                        <p style="color: #92400e; font-size: 13px; margin: 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                            <strong>📝 Instructions:</strong> ${item.delivery_instructions}
                                        </p>
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>

            <!-- Action Items -->
            <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; border: 2px solid #dc2626; margin-bottom: 25px;">
                <h3 style="color: #dc2626; font-size: 16px; margin: 0 0 15px 0; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    ⚠️ IMMEDIATE ACTION REQUIRED
                </h3>
                <ul style="color: #7f1d1d; font-size: 14px; margin: 0; padding-left: 20px; font-family: 'Helvetica Neue', Arial, sans-serif;">
                    <li style="margin-bottom: 8px;"><strong>Review order details</strong> and verify inventory availability</li>
                    <li style="margin-bottom: 8px;"><strong>Contact customer</strong> if delivery details need clarification</li>
                    <li style="margin-bottom: 8px;"><strong>Schedule delivery</strong> with operations team</li>
                    <li style="margin-bottom: 8px;"><strong>Update order status</strong> in the dashboard system</li>
                    <li><strong>Send confirmation</strong> to customer within 2 hours</li>
                </ul>
            </div>

            <!-- Quick Actions -->
            <div style="text-align: center; margin: 30px 0;">
                <table style="margin: 0 auto; border-collapse: separate; border-spacing: 10px;">
                    <tr>
                        <td>
                            <a href="mailto:${orderData.customer_email}?subject=Order%20${orderData.order_id}%20-%20Delivery%20Confirmation" 
                               style="background-color: #10b981; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                📧 Email Customer
                            </a>
                        </td>
                        <td>
                            <a href="tel:${orderData.items[0]?.contact_info?.phone || ''}"
                               style="background-color: #3b82f6; color: white; padding: 12px 20px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block; font-family: 'Helvetica Neue', Arial, sans-serif;">
                                📞 Call Customer
                            </a>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        ${getEmailFooter()}
    </div>

    <!-- Tracking pixel for email analytics -->
    <img src="https://api.mygravelguy.com/email/track?order_id=${orderData.order_id}&type=internal_notification" width="1" height="1" style="display: none;" alt="">
</body>
</html>
  `;
};
