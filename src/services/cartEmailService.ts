
import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/contexts/CartContext';
import { generateCartSaveCustomerEmail } from '@/utils/emailTemplates';

export interface CartEmailData {
  items: CartItem[];
  cartId: string;
  actionType: 'save' | 'checkout';
}

export const sendCartConfirmationEmail = async (emailData: CartEmailData) => {
  try {
    console.log('=== SENDING CART CONFIRMATION EMAIL ===');
    console.log('Email data:', {
      cartId: emailData.cartId,
      actionType: emailData.actionType,
      itemCount: emailData.items.length
    });

    // Get customer info from the first item's contact info
    const customerEmail = emailData.items[0]?.contactInfo?.email;
    const customerName = emailData.items[0]?.contactInfo?.name || 'Cart Customer';
    
    console.log('Customer email:', customerEmail);
    console.log('Customer name:', customerName);
    
    if (!customerEmail) {
      console.error('No customer email found in cart form data');
      return;
    }

    // Create order data for email
    const orderData = {
      order_id: emailData.cartId,
      action_type: emailData.actionType,
      items: emailData.items.map(item => ({
        product_name: item.name,
        quantity: item.tons,
        total_price: item.price * item.tons,
        delivery_date: item.deliveryDate?.toISOString(),
        delivery_address: item.deliveryAddress ? {
          street: item.deliveryAddress.street,
          city: item.deliveryAddress.city,
          state: item.deliveryAddress.state,
          zip: item.deliveryAddress.zip
        } : null,
        contact_info: item.contactInfo ? {
          name: item.contactInfo.name,
          email: item.contactInfo.email,
          phone: item.contactInfo.phone
        } : null,
        delivery_time_preference: item.deliveryTimePreference,
        delivery_instructions: item.deliveryInstructions
      })),
      total_amount: emailData.items.reduce((sum, item) => sum + (item.price * item.tons), 0),
      customer_email: customerEmail,
      customer_name: customerName
    };

    console.log('Cart email order data:', orderData);

    const subject = emailData.actionType === 'save' 
      ? `Cart Information Saved - ${customerName}`
      : `Enhanced Cart Confirmation - Complete Delivery Information`;

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'order.support@mygravelguy.com',
        subject: subject,
        html: generateCartConfirmationEmail(orderData),
        type: 'internal_notification',
        orderData
      }
    });

    if (error) {
      console.error('Cart confirmation email error:', error);
    } else {
      console.log('Cart confirmation email sent successfully:', data);
    }

    // Send customer-facing cart save email
    if (emailData.actionType === 'save' && customerEmail) {
      try {
        const customerHtml = generateCartSaveCustomerEmail({
          customer_name: customerName,
          order_id: emailData.cartId,
          items: orderData.items,
          total_amount: orderData.total_amount,
        });

        const { error: custError } = await supabase.functions.invoke('send-email', {
          body: {
            to: customerEmail,
            subject: 'Your Cart Has Been Saved | MyGravelGuy',
            html: customerHtml,
            type: 'customer_confirmation',
            reply_to: 'operations@mygravelguy.com',
          },
        });

        if (custError) {
          console.error('Customer cart save email error:', custError);
        } else {
          console.log('Customer cart save email sent to:', customerEmail);
        }
      } catch (custErr) {
        console.error('Customer cart save email exception:', custErr);
      }
    }
  } catch (error) {
    console.error('Cart confirmation email exception:', error);
  }
};

// Generate email template for cart confirmation
const generateCartConfirmationEmail = (orderData: any) => {
  const actionLabel = orderData.action_type === 'save' ? 'Cart Information Saved' : 'Enhanced Cart Confirmation';
  const actionIcon = orderData.action_type === 'save' ? '💾' : '🛒';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${actionLabel}</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #1e3a8a; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">${actionLabel} ${actionIcon}</h1>
        <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">
          ${orderData.action_type === 'save' 
            ? 'Customer saved delivery information for later'
            : 'Customer completed enhanced delivery information'
          }
        </p>
      </div>
      
      <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Cart ID: ${orderData.order_id}</h2>
        <p><strong>Customer:</strong> ${orderData.customer_name}</p>
        <p><strong>Email:</strong> ${orderData.customer_email}</p>
        <p><strong>Total Amount:</strong> $${orderData.total_amount.toFixed(2)}</p>
        <p><strong>Items:</strong> ${orderData.items.length}</p>
        
        <div style="margin: 20px 0;">
          <h3>Cart Items with Delivery Details:</h3>
          ${orderData.items.map((item: any) => `
            <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #1e3a8a;">
              <h4 style="margin-top: 0; color: #1e3a8a;">${item.product_name}</h4>
              <p><strong>Quantity:</strong> ${item.quantity} tons</p>
              <p><strong>Price:</strong> $${item.total_price.toFixed(2)}</p>
              
              ${item.contact_info ? `
                <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <h5 style="margin-top: 0; color: #1e40af;">✅ Contact Information:</h5>
                  <p><strong>Name:</strong> ${item.contact_info.name}</p>
                  <p><strong>Phone:</strong> ${item.contact_info.phone}</p>
                  <p><strong>Email:</strong> ${item.contact_info.email}</p>
                </div>
              ` : '<p style="color: #dc2626;">❌ Missing contact information</p>'}
              
              ${item.delivery_address ? `
                <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <h5 style="margin-top: 0; color: #1e40af;">✅ Delivery Address:</h5>
                  <p>${item.delivery_address.street}</p>
                  <p>${item.delivery_address.city}, ${item.delivery_address.state} ${item.delivery_address.zip}</p>
                </div>
              ` : '<p style="color: #dc2626;">❌ Missing delivery address</p>'}
              
              ${item.delivery_date ? `
                <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <h5 style="margin-top: 0; color: #1e40af;">✅ Delivery Schedule:</h5>
                   <p><strong>Date:</strong> ${(() => {
                     if (!item.delivery_date) return 'Not set';
                     // Handle ISO date string properly
                     const date = new Date(item.delivery_date);
                     if (isNaN(date.getTime())) return 'Invalid Date';
                     return date.toLocaleDateString('en-US', {
                       weekday: 'long',
                       month: 'short',
                       day: 'numeric',
                       year: 'numeric'
                     });
                   })()}</p>
                  ${item.delivery_time_preference ? `
                    <p><strong>Time Preference:</strong> ${
                      item.delivery_time_preference === 'anytime' ? 'Anytime (7am-5pm)' : 
                      item.delivery_time_preference === 'morning' ? 'Morning (7am-12pm)' : 
                      item.delivery_time_preference === 'afternoon' ? 'Afternoon (12pm-5pm)' : 
                      'Not specified'
                    }</p>
                  ` : ''}
                </div>
              ` : '<p style="color: #dc2626;">❌ Missing delivery date</p>'}
              
              ${item.delivery_instructions ? `
                <div style="background: #fff7ed; padding: 15px; border-radius: 6px; margin: 10px 0;">
                  <h5 style="margin-top: 0; color: #c2410c;">📝 Special Instructions:</h5>
                  <p>${item.delivery_instructions}</p>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        
        <div style="background: ${orderData.action_type === 'save' ? '#fef3c7' : '#dcfce7'}; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid ${orderData.action_type === 'save' ? '#f59e0b' : '#16a34a'};">
          <h5 style="margin-top: 0; color: ${orderData.action_type === 'save' ? '#92400e' : '#166534'};">
            ${orderData.action_type === 'save' ? '💾 Cart Saved' : '✅ Data Quality Check'}:
          </h5>
          <p style="color: ${orderData.action_type === 'save' ? '#92400e' : '#166534'}; margin: 0;">
            ${orderData.action_type === 'save' 
              ? 'Customer saved their cart information and may return to complete the purchase.'
              : 'All required delivery information has been collected and is ready for checkout processing.'
            }
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};
