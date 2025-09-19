
import { supabase } from '@/integrations/supabase/client';
import { generateQuoteRequestEmail } from '@/utils/quoteEmailTemplates';
import { createQuoteOrder, type QuoteOrderData } from './quoteOrderService';

interface QuoteFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  zipCode: string;
  selectedProduct?: { name: string } | null;
  estimatedTons?: number;
  projectType?: string;
  material?: string;
  sourcePage?: string;
}

export const sendQuoteRequestEmail = async (formData: QuoteFormData): Promise<{ success: boolean; orderId?: string; error?: string }> => {
  try {
    console.log('Processing quote request with database insertion');
    console.log('Form data:', formData);

    // First, create the quote order record in the database
    const quoteOrderData: QuoteOrderData = {
      customerName: formData.name,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      zipCode: formData.zipCode,
      projectDetails: formData.message,
      estimatedTons: formData.estimatedTons,
      productName: formData.selectedProduct?.name,
      sourcePage: formData.sourcePage,
    };

    const dbResult = await createQuoteOrder(quoteOrderData);
    
    if (!dbResult.success) {
      console.error('Failed to create quote order record:', dbResult.error);
      return { success: false, error: 'Failed to save quote request' };
    }

    console.log('Quote order record created, now sending email');

    // Generate email content with order ID reference
    const emailHtml = generateQuoteRequestEmail({
      ...formData,
      orderId: dbResult.orderId
    });

    // Send the email
    const materialSubject = formData.material || formData.selectedProduct?.name || 'General Inquiry';
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'sales@mygravelguy.com',
        subject: `Quote Request from ${formData.name} - ${materialSubject}`,
        html: emailHtml,
        type: 'internal_notification',
        orderData: {
          customer_email: formData.email,
          customer_name: formData.name,
          order_id: dbResult.orderId
        }
      }
    });

    if (error) {
      console.error('Error sending quote email:', error);
      // Even if email fails, we still have the database record
      return { 
        success: true, 
        orderId: dbResult.orderId,
        error: 'Quote saved but email notification failed'
      };
    }

    console.log('Quote email sent successfully:', data);
    return { success: true, orderId: dbResult.orderId };
  } catch (error) {
    console.error('Failed to process quote request:', error);
    return { success: false, error: error.message };
  }
};
