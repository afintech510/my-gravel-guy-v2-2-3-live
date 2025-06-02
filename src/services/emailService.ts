
import { supabase } from '@/integrations/supabase/client';
import { generateCustomerConfirmationEmail, generateInternalNotificationEmail } from '@/utils/emailTemplates';

interface OrderData {
  order_id: string;
  items: any[];
  total_amount: number;
  customer_email: string;
  customer_name?: string;
}

export const sendOrderConfirmationEmail = async (orderData: OrderData) => {
  try {
    console.log('=== CUSTOMER EMAIL DEBUG ===');
    console.log('Sending customer confirmation email to:', orderData.customer_email);
    console.log('Customer email type:', typeof orderData.customer_email);
    console.log('Order data:', JSON.stringify(orderData, null, 2));
    
    const emailHtml = generateCustomerConfirmationEmail(orderData);
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: orderData.customer_email,
        subject: `Order Confirmation - ${orderData.order_id}`,
        html: emailHtml,
        type: 'customer_confirmation',
        orderData
      }
    });

    if (error) {
      console.error('Error sending customer confirmation email:', error);
      throw error;
    }

    console.log('Customer confirmation email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send customer confirmation email:', error);
    throw error;
  }
};

export const sendInternalNotificationEmail = async (orderData: OrderData, salesEmail: string = 'order.support@mygravelguy.com') => {
  try {
    console.log('=== INTERNAL EMAIL DEBUG ===');
    console.log('Sending internal notification email to:', salesEmail);
    console.log('Sales email type:', typeof salesEmail);
    console.log('Sales email length:', salesEmail.length);
    console.log('Order customer email (for reference):', orderData.customer_email);
    console.log('Are they the same?', salesEmail === orderData.customer_email);
    console.log('Hardcoded internal email: order.support@mygravelguy.com');
    console.log('Using default param?', salesEmail === 'order.support@mygravelguy.com');
    
    const emailHtml = generateInternalNotificationEmail(orderData);
    
    const requestBody = {
      to: salesEmail,
      subject: `🚨 New Order: ${orderData.order_id} - $${orderData.total_amount.toFixed(2)}`,
      html: emailHtml,
      type: 'internal_notification',
      orderData
    };
    
    console.log('Internal email request body:', JSON.stringify(requestBody, null, 2));
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: requestBody
    });

    if (error) {
      console.error('Error sending internal notification email:', error);
      throw error;
    }

    console.log('Internal notification email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Failed to send internal notification email:', error);
    throw error;
  }
};

export const sendBothOrderEmails = async (orderData: OrderData) => {
  try {
    console.log('=== SENDING BOTH EMAILS DEBUG ===');
    console.log('Order data received:', JSON.stringify(orderData, null, 2));
    console.log('Customer email from order data:', orderData.customer_email);
    
    // Send both emails in parallel
    const [customerResult, internalResult] = await Promise.allSettled([
      sendOrderConfirmationEmail(orderData),
      sendInternalNotificationEmail(orderData) // Using default internal email
    ]);

    const results = {
      customerEmail: customerResult,
      internalEmail: internalResult
    };

    console.log('Email sending results:', results);
    
    // Log any failures but don't throw - we don't want email failures to break the order flow
    if (customerResult.status === 'rejected') {
      console.error('Customer email failed:', customerResult.reason);
    }
    
    if (internalResult.status === 'rejected') {
      console.error('Internal email failed:', internalResult.reason);
    }

    return results;
  } catch (error) {
    console.error('Error sending order emails:', error);
    throw error;
  }
};
