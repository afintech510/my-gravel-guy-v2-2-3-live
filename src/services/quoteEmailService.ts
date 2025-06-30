
import { supabase } from '@/integrations/supabase/client';
import { generateQuoteRequestEmail } from '@/utils/quoteEmailTemplates';

interface QuoteFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
  zipCode: string;
  selectedProduct?: { name: string } | null;
}

export const sendQuoteRequestEmail = async (formData: QuoteFormData): Promise<boolean> => {
  try {
    console.log('Sending quote request email to sales@mygravelguy.com');
    console.log('Form data:', formData);

    const emailHtml = generateQuoteRequestEmail(formData);

    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'sales@mygravelguy.com',
        subject: `Quote Request from ${formData.name} - ${formData.selectedProduct?.name || 'General Inquiry'}`,
        html: emailHtml,
        type: 'internal_notification',
        orderData: {
          customer_email: formData.email,
          customer_name: formData.name
        }
      }
    });

    if (error) {
      console.error('Error sending quote email:', error);
      return false;
    }

    console.log('Quote email sent successfully:', data);
    return true;
  } catch (error) {
    console.error('Failed to send quote request email:', error);
    return false;
  }
};
