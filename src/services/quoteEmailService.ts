
import { supabase } from '@/integrations/supabase/client';
import { generateQuoteRequestEmail } from '@/utils/quoteEmailTemplates';
import { createQuoteOrder, type QuoteOrderData } from './quoteOrderService';
import { createLeadFromForm } from './supplierQuoteService';

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
  timeframe?: string;
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
      material: formData.material,
      timeframe: formData.timeframe,
      sourcePage: formData.sourcePage,
    };

    const dbResult = await createQuoteOrder(quoteOrderData);
    
    if (!dbResult.success) {
      console.error('Failed to create quote order record:', dbResult.error);
      return { success: false, error: 'Failed to save quote request' };
    }

    // Also create a lead entry for the supplier quotes system
    try {
      await createLeadFromForm({
        displayName: formData.name,
        email: formData.email,
        phone: formData.phone,
        material: formData.material || formData.selectedProduct?.name,
        requestedQty: formData.estimatedTons,
        requestedUnit: 'tons',
        jobZip: formData.zipCode,
        timeline: formData.timeframe,
        notes: `Source: ${formData.sourcePage || 'Quote Form'}\n${formData.message || ''}`.trim(),
      });
      console.log('Lead created from quote form');
    } catch (leadErr) {
      console.warn('Failed to create lead from quote form (non-blocking):', leadErr);
    }

    console.log('Quote order record created, now sending emails');

    // Generate email content with order ID reference
    const emailHtml = generateQuoteRequestEmail({
      ...formData,
      orderId: dbResult.orderId
    });

    // Send internal notification email
    const materialSubject = formData.material || formData.selectedProduct?.name || 'General Inquiry';
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: {
        to: 'sales@mygravelguy.com',
        subject: `Quote Request from ${formData.name} - ${materialSubject}`,
        html: emailHtml,
        type: 'internal_notification',
        reply_to: 'operations@mygravelguy.com',
        orderData: {
          customer_email: formData.email,
          customer_name: formData.name,
          order_id: dbResult.orderId
        }
      }
    });

    if (error) {
      console.error('Error sending internal quote email:', error);
    } else {
      console.log('Internal quote email sent successfully:', data);
    }

    // Send customer confirmation copy
    const customerEmailHtml = generateCustomerQuoteConfirmationEmail({
      ...formData,
      orderId: dbResult.orderId
    });

    const { error: customerEmailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: formData.email,
        subject: `Your Quote Request - ${materialSubject} | MyGravelGuy`,
        html: customerEmailHtml,
        type: 'customer_confirmation',
        reply_to: 'operations@mygravelguy.com',
        orderData: {
          customer_email: formData.email,
          customer_name: formData.name,
          order_id: dbResult.orderId
        }
      }
    });

    if (customerEmailError) {
      console.error('Error sending customer confirmation email:', customerEmailError);
      // Even if customer email fails, we still have the internal notification
      return { 
        success: true, 
        orderId: dbResult.orderId,
        error: 'Quote saved but customer confirmation email failed'
      };
    }

    console.log('Customer confirmation email sent successfully');
    return { success: true, orderId: dbResult.orderId };
  } catch (error) {
    console.error('Failed to process quote request:', error);
    return { success: false, error: (error as Error).message };
  }
};

// Generate customer-facing confirmation email
const generateCustomerQuoteConfirmationEmail = (formData: QuoteFormData & { orderId?: string }): string => {
  const materialInfo = formData.material || formData.selectedProduct?.name || 'Not specified';
  const tonsInfo = formData.estimatedTons ? `${formData.estimatedTons} tons` : 'To be determined';
  const timeframeInfo = formData.timeframe || 'Not specified';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Quote Request Confirmation</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <img src="https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//mygravelguy_wide_logo.png" alt="MyGravelGuy" style="height: 60px; width: auto;">
        </div>
        
        <h1 style="color: #0F1115; font-size: 24px; margin-bottom: 20px;">We Received Your Quote Request!</h1>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
          Thank you for reaching out to MyGravelGuy. Our team is reviewing your request and will get back to you within 2 hours with competitive pricing.
        </p>
        
        <div style="background-color: #f7fafc; border-radius: 8px; padding: 20px; margin: 30px 0;">
          <h2 style="color: #0F1115; font-size: 18px; margin-bottom: 15px;">Your Request Details</h2>
          ${formData.orderId ? `<p style="color: #4a5568; margin: 8px 0;"><strong>Reference ID:</strong> ${formData.orderId}</p>` : ''}
          <p style="color: #4a5568; margin: 8px 0;"><strong>Name:</strong> ${formData.name}</p>
          <p style="color: #4a5568; margin: 8px 0;"><strong>Phone:</strong> ${formData.phone}</p>
          <p style="color: #4a5568; margin: 8px 0;"><strong>Email:</strong> ${formData.email}</p>
          <p style="color: #4a5568; margin: 8px 0;"><strong>Delivery ZIP:</strong> ${formData.zipCode}</p>
          <p style="color: #4a5568; margin: 8px 0;"><strong>Material:</strong> ${materialInfo}</p>
          <p style="color: #4a5568; margin: 8px 0;"><strong>Amount:</strong> ${tonsInfo}</p>
          <p style="color: #4a5568; margin: 8px 0;"><strong>Timeframe:</strong> ${timeframeInfo}</p>
          ${formData.message ? `<p style="color: #4a5568; margin: 8px 0;"><strong>Notes:</strong><br>${formData.message.replace(/\n/g, '<br>')}</p>` : ''}
        </div>
        
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
          Have questions? Simply reply to this email and our operations team will assist you.
        </p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://mygravelguy.com/shop" style="display: inline-block; background-color: #BADF24; color: #000000; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold; text-transform: uppercase;">Browse Our Materials</a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        
        <p style="color: #718096; font-size: 12px; text-align: center;">
          MyGravelGuy - Nationwide Aggregate Delivery<br>
          <a href="https://mygravelguy.com" style="color: #BADF24;">mygravelguy.com</a> | operations@mygravelguy.com
        </p>
      </div>
    </body>
    </html>
  `;
};
