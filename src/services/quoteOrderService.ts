
import { supabase } from '@/integrations/supabase/client';

export interface QuoteOrderData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  zipCode: string;
  projectDetails: string;
  estimatedTons?: number;
  productId?: string;
  productName?: string;
  sourcePage?: string;
}

export const generateQuoteOrderId = (): string => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timestamp = Math.floor(now.getTime() / 1000);
  return `QUOTE-${dateStr}-${timestamp}`;
};

export const createQuoteOrder = async (quoteData: QuoteOrderData) => {
  console.log('Creating quote order record:', quoteData);
  
  const orderId = generateQuoteOrderId();
  
  const orderRecord = {
    order_id: orderId,
    product_id: quoteData.productId || 'general-quote',
    unit: 'quote',
    unit_price: 0,
    total_price: 0,
    quantity: quoteData.estimatedTons || 0,
    delivery_name: quoteData.customerName,
    delivery_email: quoteData.customerEmail,
    delivery_phone: quoteData.customerPhone,
    delivery_zip: quoteData.zipCode,
    notes: quoteData.projectDetails,
    fulfillment_status: 'Quote Needed' as const,
    status: 'Quote',
    billing_name: quoteData.customerName,
    billing_email: quoteData.customerEmail,
  };

  console.log('Inserting quote order record:', orderRecord);

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([orderRecord])
      .select()
      .single();

    if (error) {
      console.error('Error creating quote order:', error);
      throw error;
    }

    console.log('Quote order created successfully:', data);
    return { success: true, orderId, data };
  } catch (error) {
    console.error('Failed to create quote order:', error);
    return { success: false, error: error.message };
  }
};
