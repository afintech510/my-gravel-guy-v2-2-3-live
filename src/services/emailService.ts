
import { supabase } from '@/integrations/supabase/client';
import { generateCustomerConfirmationEmail, generateInternalNotificationEmail } from '@/utils/emailTemplates';

interface OrderData {
  order_id: string;
  items: any[];
  total_amount: number;
  customer_email: string;
  customer_name?: string;
}

interface ContactFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  propertyAddress: string;
  projectType: string;
  approximateArea: string;
  additionalDetails: string;
  preferredContact: string;
}

interface EmailResult {
  success: boolean;
  emailId?: string;
  error?: string;
  emailType: 'customer_confirmation' | 'internal_notification' | 'contact_form';
  recipient: string;
  timestamp: string;
}

// Enhanced helper function to extract customer email from order data
const extractCustomerEmailFromOrderData = (orderData: any): string | null => {
  console.log('=== EXTRACTING CUSTOMER EMAIL FROM ORDER DATA ===');
  console.log('Order data keys:', Object.keys(orderData));
  console.log('Direct customer_email:', orderData.customer_email);
  
  // Try direct customer_email first
  if (orderData.customer_email) {
    console.log('Found direct customer_email:', orderData.customer_email);
    return orderData.customer_email;
  }
  
  // Try customerInfo
  if (orderData.customerInfo?.email) {
    console.log('Found customerInfo.email:', orderData.customerInfo.email);
    return orderData.customerInfo.email;
  }
  
  // Try to extract from first item's contact info
  if (orderData.items && orderData.items.length > 0) {
    for (const item of orderData.items) {
      console.log('Checking item for contact info:', {
        hasContactInfo: !!item.contactInfo,
        hasDirectEmail: !!item.contact_info?.email,
        hasMetadataEmail: !!item.metadata?.contactEmail
      });
      
      // Check direct contactInfo
      if (item.contactInfo?.email) {
        console.log('Found item.contactInfo.email:', item.contactInfo.email);
        return item.contactInfo.email;
      }
      
      // Check contact_info
      if (item.contact_info?.email) {
        console.log('Found item.contact_info.email:', item.contact_info.email);
        return item.contact_info.email;
      }
      
      // Check metadata
      if (item.metadata?.contactEmail) {
        console.log('Found item.metadata.contactEmail:', item.metadata.contactEmail);
        return item.metadata.contactEmail;
      }
    }
  }
  
  console.log('No customer email found in order data');
  return null;
};

class EmailService {
  private async logEmailAttempt(
    orderData: OrderData | ContactFormData, 
    emailType: 'customer_confirmation' | 'internal_notification' | 'contact_form',
    recipient: string,
    result: EmailResult
  ) {
    console.log(`=== EMAIL LOG ${new Date().toISOString()} ===`);
    console.log('Email Type:', emailType);
    console.log('Data ID:', (orderData as OrderData).order_id || 'Contact Form');
    console.log('Recipient:', recipient);
    console.log('Success:', result.success);
    console.log('Email ID:', result.emailId);
    if (result.error) {
      console.error('Error:', result.error);
    }
    console.log('=== END EMAIL LOG ===');
  }

  private async sendEmailWithRetry(
    emailData: {
      to: string;
      subject: string;
      html: string;
      type: 'customer_confirmation' | 'internal_notification' | 'contact_form';
      orderData: OrderData | ContactFormData;
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

  async sendOrderConfirmationEmail(orderData: any): Promise<EmailResult> {
    try {
      console.log('=== ENHANCED CUSTOMER EMAIL SERVICE DEBUG ===');
      console.log('Sending enhanced customer confirmation email...');
      console.log('Raw order data:', JSON.stringify(orderData, null, 2));
      
      // Enhanced customer email extraction
      const customerEmail = extractCustomerEmailFromOrderData(orderData);
      
      if (!customerEmail) {
        const errorMsg = 'No customer email found in order data after enhanced extraction';
        console.error(errorMsg);
        console.error('Order data structure:', {
          hasCustomerEmail: !!orderData.customer_email,
          hasCustomerInfo: !!orderData.customerInfo,
          itemsCount: orderData.items?.length || 0,
          firstItemKeys: orderData.items?.[0] ? Object.keys(orderData.items[0]) : []
        });
        
        return {
          success: false,
          error: errorMsg,
          emailType: 'customer_confirmation',
          recipient: 'unknown',
          timestamp: new Date().toISOString()
        };
      }

      if (!customerEmail.includes('@')) {
        throw new Error('Invalid customer email format');
      }
      
      // Create properly formatted order data for email template
      const formattedOrderData = {
        order_id: orderData.order_id,
        items: orderData.items || [],
        total_amount: orderData.total_amount || 0,
        customer_email: customerEmail,
        customer_name: orderData.customer_name || orderData.customerInfo?.name || 'Valued Customer'
      };
      
      console.log('Formatted order data for email:', formattedOrderData);
      
      const emailHtml = generateCustomerConfirmationEmail(formattedOrderData);
      
      return await this.sendEmailWithRetry({
        to: customerEmail,
        subject: `Order Confirmation - ${formattedOrderData.order_id} 📦`,
        html: emailHtml,
        type: 'customer_confirmation',
        orderData: formattedOrderData
      });

    } catch (error) {
      console.error('Failed to send enhanced customer confirmation email:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        emailType: 'customer_confirmation',
        recipient: orderData.customer_email || 'unknown',
        timestamp: new Date().toISOString()
      };
    }
  }

  async sendInternalNotificationEmail(
    orderData: any, 
    salesEmail: string = 'order.support@mygravelguy.com'
  ): Promise<EmailResult> {
    try {
      console.log('=== ENHANCED INTERNAL EMAIL SERVICE DEBUG ===');
      console.log('Sending enhanced internal notification email to:', salesEmail);
      console.log('Order total:', orderData.total_amount);
      
      if (!salesEmail) {
        throw new Error('Sales email is required');
      }

      if (!salesEmail.includes('@')) {
        throw new Error('Invalid sales email format');
      }
      
      // Extract customer email for internal email context
      const customerEmail = extractCustomerEmailFromOrderData(orderData);
      
      // Create properly formatted order data for internal email
      const formattedOrderData = {
        order_id: orderData.order_id,
        items: orderData.items || [],
        total_amount: orderData.total_amount || 0,
        customer_email: customerEmail || 'guest@mygravelguy.com',
        customer_name: orderData.customer_name || orderData.customerInfo?.name || 'Guest User'
      };
      
      console.log('Formatted order data for internal email:', formattedOrderData);
      
      const emailHtml = generateInternalNotificationEmail(formattedOrderData);
      
      return await this.sendEmailWithRetry({
        to: salesEmail,
        subject: `🚨 New Order: ${formattedOrderData.order_id} - $${formattedOrderData.total_amount.toFixed(2)}`,
        html: emailHtml,
        type: 'internal_notification',
        orderData: formattedOrderData
      });

    } catch (error) {
      console.error('Failed to send enhanced internal notification email:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        emailType: 'internal_notification',
        recipient: salesEmail,
        timestamp: new Date().toISOString()
      };
    }
  }

  async sendBothOrderEmails(orderData: any): Promise<{
    customerEmail: EmailResult;
    internalEmail: EmailResult;
    overallSuccess: boolean;
  }> {
    try {
      console.log('=== SENDING BOTH ENHANCED EMAILS SERVICE DEBUG ===');
      console.log('Enhanced order data received:', JSON.stringify(orderData, null, 2));
      
      // Send both emails in parallel
      const [customerResult, internalResult] = await Promise.allSettled([
        this.sendOrderConfirmationEmail(orderData),
        this.sendInternalNotificationEmail(orderData)
      ]);

      const customerEmail = customerResult.status === 'fulfilled' 
        ? customerResult.value 
        : {
            success: false,
            error: customerResult.reason?.message || 'Promise rejected',
            emailType: 'customer_confirmation' as const,
            recipient: extractCustomerEmailFromOrderData(orderData) || 'unknown',
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

      console.log('Enhanced email sending results:', {
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
          recipient: extractCustomerEmailFromOrderData(orderData) || 'unknown'
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

  async sendContactFormEmail(contactData: ContactFormData): Promise<EmailResult> {
    try {
      console.log('=== CONTACT FORM EMAIL SERVICE DEBUG ===');
      console.log('Sending contact form email...');
      console.log('Contact data:', contactData);
      
      // Generate HTML email content for contact form
      const emailHtml = this.generateContactFormEmailHtml(contactData);
      
      return await this.sendEmailWithRetry({
        to: 'support@mygravelguy.com', // Internal email for contact form submissions
        subject: `New Contact Form Submission - ${contactData.projectType} Project`,
        html: emailHtml,
        type: 'contact_form',
        orderData: contactData
      });

    } catch (error) {
      console.error('Failed to send contact form email:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        emailType: 'contact_form',
        recipient: 'support@mygravelguy.com',
        timestamp: new Date().toISOString()
      };
    }
  }

  private generateContactFormEmailHtml(contactData: ContactFormData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { background-color: #fff; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; }
            .field { margin-bottom: 15px; }
            .field-label { font-weight: bold; color: #555; }
            .field-value { margin-top: 5px; padding: 10px; background-color: #f8f9fa; border-radius: 4px; }
            .highlight { color: #007bff; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🚨 New Contact Form Submission - My Gravel Guy</h2>
              <p>A new contact form has been submitted on the website.</p>
            </div>
            
            <div class="content">
              <div class="field">
                <div class="field-label">Full Name:</div>
                <div class="field-value">${contactData.fullName}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Email:</div>
                <div class="field-value"><a href="mailto:${contactData.email}">${contactData.email}</a></div>
              </div>
              
              <div class="field">
                <div class="field-label">Phone Number:</div>
                <div class="field-value"><a href="tel:${contactData.phoneNumber}">${contactData.phoneNumber}</a></div>
              </div>
              
              <div class="field">
                <div class="field-label">Property Address:</div>
                <div class="field-value">${contactData.propertyAddress}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Project Type:</div>
                <div class="field-value"><span class="highlight">${contactData.projectType}</span></div>
              </div>
              
              <div class="field">
                <div class="field-label">Approximate Area:</div>
                <div class="field-value">${contactData.approximateArea} sq ft</div>
              </div>
              
              <div class="field">
                <div class="field-label">Preferred Contact Method:</div>
                <div class="field-value">${contactData.preferredContact}</div>
              </div>
              
              <div class="field">
                <div class="field-label">Additional Details:</div>
                <div class="field-value">${contactData.additionalDetails || 'No additional details provided'}</div>
              </div>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background-color: #e7f3ff; border-radius: 8px;">
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>Contact the customer within 24 hours</li>
                <li>Preferred contact method: <strong>${contactData.preferredContact}</strong></li>
                <li>Prepare quote for <strong>${contactData.projectType}</strong> project</li>
              </ul>
            </div>
          </div>
        </body>
      </html>
    `;
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

export const sendContactFormEmail = (contactData: ContactFormData) =>
  emailService.sendContactFormEmail(contactData);

// Export the service class for testing
export { EmailService };
export type { EmailResult, OrderData, ContactFormData };
