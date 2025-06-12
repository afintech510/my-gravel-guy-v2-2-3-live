
import { supabase } from '@/integrations/supabase/client';
import { generateCustomerConfirmationEmail, generateInternalNotificationEmail } from '@/utils/emailTemplates';
import { OrderService } from './orderService';

interface OrderData {
  order_id: string;
  items: any[];
  total_amount: number;
  customer_email: string;
  customer_name?: string;
}

interface EmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
  emailType: 'customer_confirmation' | 'internal_notification';
  recipient: string;
  timestamp: string;
}

class EmailService {
  private async logEmailAttempt(
    orderData: OrderData, 
    emailType: 'customer_confirmation' | 'internal_notification',
    recipient: string,
    result: EmailResult
  ) {
    console.log(`=== EMAIL LOG ${new Date().toISOString()} ===`);
    console.log('Email Type:', emailType);
    console.log('Order ID:', orderData.order_id);
    console.log('Recipient:', recipient);
    console.log('Success:', result.success);
    console.log('Email ID:', result.emailId);
    if (result.error) {
      console.error('Error:', result.error);
    }
    console.log('=== END EMAIL LOG ===');
  }

  private async resolveOrderProductNames(orderData: OrderData): Promise<OrderData> {
    try {
      console.log('Resolving product names for email order data...');
      
      // Fetch the full order to get resolved product names
      const resolvedOrder = await OrderService.fetchOrderById(orderData.order_id);
      
      if (resolvedOrder) {
        // Use the resolved product names from the OrderService
        return {
          ...orderData,
          items: resolvedOrder.items.map(item => ({
            ...item,
            product_name: item.product_name // Already resolved by OrderService
          }))
        };
      } else {
        console.warn('Could not fetch resolved order, using original data');
        return orderData;
      }
    } catch (error) {
      console.error('Error resolving product names for email:', error);
      return orderData; // Return original data if resolution fails
    }
  }

  private async sendEmailWithRetry(
    emailData: {
      to: string;
      subject: string;
      html: string;
      type: 'customer_confirmation' | 'internal_notification';
      orderData: OrderData;
    },
    maxRetries: number = 3
  ): Promise<EmailResult> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Sending ${emailData.type} email attempt ${attempt}/${maxRetries} to: ${emailData.to}`);
        
        const { data, error } = await supabase.functions.invoke('send-email', {
          body: emailData
        });

        if (error) {
          throw error;
        }

        const result: EmailResult = {
          success: true,
          emailId: data?.emailId,
          emailType: emailData.type,
          recipient: emailData.to,
          timestamp: new Date().toISOString()
        };

        await this.logEmailAttempt(emailData.orderData, emailData.type, emailData.to, result);
        return result;

      } catch (error) {
        lastError = error;
        console.error(`Email attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    const result: EmailResult = {
      success: false,
      error: lastError?.message || 'Unknown error',
      emailType: emailData.type,
      recipient: emailData.to,
      timestamp: new Date().toISOString()
    };

    await this.logEmailAttempt(emailData.orderData, emailData.type, emailData.to, result);
    return result;
  }

  async sendOrderConfirmationEmail(orderData: OrderData): Promise<EmailResult> {
    try {
      console.log('=== CUSTOMER EMAIL SERVICE DEBUG ===');
      console.log('Sending customer confirmation email to:', orderData.customer_email);
      console.log('Order data:', JSON.stringify(orderData, null, 2));
      
      if (!orderData.customer_email) {
        throw new Error('Customer email is required');
      }

      if (!orderData.customer_email.includes('@')) {
        throw new Error('Invalid customer email format');
      }
      
      // Resolve product names before generating email
      const resolvedOrderData = await this.resolveOrderProductNames(orderData);
      console.log('Resolved order data for customer email:', resolvedOrderData);
      
      const emailHtml = generateCustomerConfirmationEmail(resolvedOrderData);
      
      return await this.sendEmailWithRetry({
        to: resolvedOrderData.customer_email,
        subject: `Order Confirmation - ${resolvedOrderData.order_id} 📦`,
        html: emailHtml,
        type: 'customer_confirmation',
        orderData: resolvedOrderData
      });

    } catch (error) {
      console.error('Failed to send customer confirmation email:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        emailType: 'customer_confirmation',
        recipient: orderData.customer_email,
        timestamp: new Date().toISOString()
      };
    }
  }

  async sendInternalNotificationEmail(
    orderData: OrderData, 
    salesEmail: string = 'order.support@mygravelguy.com'
  ): Promise<EmailResult> {
    try {
      console.log('=== INTERNAL EMAIL SERVICE DEBUG ===');
      console.log('Sending internal notification email to:', salesEmail);
      console.log('Order total:', orderData.total_amount);
      
      if (!salesEmail) {
        throw new Error('Sales email is required');
      }

      if (!salesEmail.includes('@')) {
        throw new Error('Invalid sales email format');
      }
      
      // Resolve product names before generating email
      const resolvedOrderData = await this.resolveOrderProductNames(orderData);
      console.log('Resolved order data for internal email:', resolvedOrderData);
      
      const emailHtml = generateInternalNotificationEmail(resolvedOrderData);
      
      return await this.sendEmailWithRetry({
        to: salesEmail,
        subject: `🚨 New Order: ${resolvedOrderData.order_id} - ${resolvedOrderData.total_amount.toFixed(2)}`,
        html: emailHtml,
        type: 'internal_notification',
        orderData: resolvedOrderData
      });

    } catch (error) {
      console.error('Failed to send internal notification email:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        emailType: 'internal_notification',
        recipient: salesEmail,
        timestamp: new Date().toISOString()
      };
    }
  }

  async sendBothOrderEmails(orderData: OrderData): Promise<{
    customerEmail: EmailResult;
    internalEmail: EmailResult;
    overallSuccess: boolean;
  }> {
    try {
      console.log('=== SENDING BOTH EMAILS SERVICE DEBUG ===');
      console.log('Order data received:', JSON.stringify(orderData, null, 2));
      
      // Resolve product names once for both emails
      const resolvedOrderData = await this.resolveOrderProductNames(orderData);
      console.log('Resolved order data for both emails:', resolvedOrderData);
      
      // Send both emails in parallel
      const [customerResult, internalResult] = await Promise.allSettled([
        this.sendOrderConfirmationEmail(resolvedOrderData),
        this.sendInternalNotificationEmail(resolvedOrderData)
      ]);

      const customerEmail = customerResult.status === 'fulfilled' 
        ? customerResult.value 
        : {
            success: false,
            error: customerResult.reason?.message || 'Promise rejected',
            emailType: 'customer_confirmation' as const,
            recipient: resolvedOrderData.customer_email,
            timestamp: new Date().toISOString()
          };

      const internalEmail = internalResult.status === 'fulfilled' 
        ? internalResult.value 
        : {
            success: false,
            error: internalResult.reason?.message || 'Promise rejected',
            emailType: 'internal_notification' as const,
            recipient: 'order.support@mygravelguy.com',
            timestamp: new Date().toISOString()
          };

      const overallSuccess = customerEmail.success && internalEmail.success;

      console.log('Email sending results:', {
        customerEmail,
        internalEmail,
        overallSuccess
      });

      return {
        customerEmail,
        internalEmail,
        overallSuccess
      };

    } catch (error) {
      console.error('Error in sendBothOrderEmails:', error);
      
      const errorResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };

      return {
        customerEmail: {
          ...errorResult,
          emailType: 'customer_confirmation' as const,
          recipient: orderData.customer_email
        },
        internalEmail: {
          ...errorResult,
          emailType: 'internal_notification' as const,
          recipient: 'order.support@mygravelguy.com'
        },
        overallSuccess: false
      };
    }
  }
}

// Export a singleton instance
const emailService = new EmailService();

export const sendOrderConfirmationEmail = (orderData: OrderData) => 
  emailService.sendOrderConfirmationEmail(orderData);

export const sendInternalNotificationEmail = (orderData: OrderData, salesEmail?: string) => 
  emailService.sendInternalNotificationEmail(orderData, salesEmail);

export const sendBothOrderEmails = (orderData: OrderData) => 
  emailService.sendBothOrderEmails(orderData);

// Export the service class for testing
export { EmailService };
export type { EmailResult, OrderData };
