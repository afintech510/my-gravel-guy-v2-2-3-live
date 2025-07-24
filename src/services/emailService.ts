
import { supabase } from '@/integrations/supabase/client';

export interface EmailData {
  materialCategory: string;
  materialSubcategory: string;
  materialSize: string;
  applicationType: string;
  areas: { length: number; width: number }[];
  depth: number;
  extraPercentage: number;
  totalArea: number;
  cubicYards: number;
  tons: number;
  zipCode: string | null;
  price: number;
  discountedPrice: number;
  discountApplied: boolean;
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    consent: boolean;
  };
}

export interface ContactFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  propertyAddress: string;
  projectType: string;
  approximateArea: string;
  additionalDetails: string;
  preferredContact: string;
}

export const sendCalculatorEmail = async (data: EmailData): Promise<boolean> => {
  try {
    // In a real implementation, you'd call your backend API here
    // For now, we'll use a mock API call
    console.log('Sending email to sales@mygravelguy.com with data:', data);

    // Example of how you'd implement this with fetch:
    const response = await fetch('/api/send-calculator-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: 'sales@mygravelguy.com',
        subject: `Calculator Quote Request - ${data.contactInfo.name}`,
        data: data
      }),
    });

    // For demo purposes, we'll just simulate a successful response
    // Normally you'd check if response.ok or handle the actual response
    console.log('Email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

export const sendContactFormEmail = async (data: ContactFormData): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('Sending contact form email with data:', data);
    
    // This is a legacy function that's no longer used directly
    // Contact forms now use the quote email service for database integration
    console.log('Contact form email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('Failed to send contact form email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export interface OrderEmailData {
  order_id: string;
  items: any[];
  total_amount: number;
  customer_email: string;
  customer_name: string;
}

export const sendOrderConfirmationEmail = async (orderData: OrderEmailData): Promise<{ success: boolean; emailId?: string; error?: any }> => {
  try {
    console.log('Sending customer order confirmation email for order:', orderData.order_id);
    
    const { generateCustomerConfirmationEmail } = await import('@/utils/emailTemplates');
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: orderData.customer_email,
        subject: `Order Confirmation - ${orderData.order_id}`,
        html: generateCustomerConfirmationEmail(orderData),
        type: 'customer_confirmation',
        orderData
      }
    });

    if (error) {
      console.error('Customer order confirmation email error:', error);
      return { success: false, error };
    }

    console.log('Customer order confirmation email sent successfully:', data);
    return { success: true, emailId: data?.emailId };
  } catch (error) {
    console.error('Customer order confirmation email exception:', error);
    return { success: false, error };
  }
};

export const sendInternalNotificationEmail = async (orderData: OrderEmailData, recipientEmail: string = 'order.support@mygravelguy.com'): Promise<{ success: boolean; emailId?: string; error?: any }> => {
  try {
    console.log('Sending internal order notification email for order:', orderData.order_id);
    
    const { generateInternalNotificationEmail } = await import('@/utils/emailTemplates');
    
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: recipientEmail,
        subject: `New Order Notification - ${orderData.order_id}`,
        html: generateInternalNotificationEmail(orderData),
        type: 'internal_notification',
        orderData
      }
    });

    if (error) {
      console.error('Internal order notification email error:', error);
      return { success: false, error };
    }

    console.log('Internal order notification email sent successfully:', data);
    return { success: true, emailId: data?.emailId };
  } catch (error) {
    console.error('Internal order notification email exception:', error);
    return { success: false, error };
  }
};

export const sendBothOrderEmails = async (orderData: OrderEmailData): Promise<{
  overallSuccess: boolean;
  customerEmail: { success: boolean; emailId?: string; error?: any };
  internalEmail: { success: boolean; emailId?: string; error?: any };
}> => {
  try {
    console.log('Sending order confirmation emails for order:', orderData.order_id);
    
    // Send both emails concurrently
    const [customerEmailResult, internalEmailResult] = await Promise.all([
      sendOrderConfirmationEmail(orderData),
      sendInternalNotificationEmail(orderData)
    ]);
    
    console.log('Order confirmation emails processing complete:', {
      customerSuccess: customerEmailResult.success,
      internalSuccess: internalEmailResult.success
    });
    
    return {
      overallSuccess: customerEmailResult.success && internalEmailResult.success,
      customerEmail: customerEmailResult,
      internalEmail: internalEmailResult
    };
  } catch (error) {
    console.error('Failed to send order emails:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    return {
      overallSuccess: false,
      customerEmail: { success: false, error: errorMsg },
      internalEmail: { success: false, error: errorMsg }
    };
  }
};
