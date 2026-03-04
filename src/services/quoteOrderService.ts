
import { supabase } from '@/integrations/supabase/client';

export interface QuoteOrderData {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  zipCode: string;
  street?: string;
  city?: string;
  state?: string;
  projectDetails: string;
  estimatedTons?: number;
  productId?: string;
  productName?: string;
  material?: string;
  timeframe?: string;
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
  
  // Build notes field with all relevant info for dashboard display
  const notesLines: string[] = [];
  if (quoteData.material) {
    notesLines.push(`Material: ${quoteData.material}`);
  }
  if (quoteData.estimatedTons) {
    notesLines.push(`Amount: ${quoteData.estimatedTons} tons`);
  }
  if (quoteData.timeframe) {
    notesLines.push(`Timeframe: ${quoteData.timeframe}`);
  }
  if (quoteData.projectDetails) {
    notesLines.push(`Notes: ${quoteData.projectDetails}`);
  }
  if (quoteData.sourcePage) {
    notesLines.push(`Source: ${quoteData.sourcePage}`);
  }
  
  const orderRecord = {
    order_id: orderId,
    product_id: quoteData.productId || quoteData.material || 'general-quote',
    unit: 'quote',
    unit_price: 0,
    total_price: 0,
    quantity: quoteData.estimatedTons || 0,
    delivery_name: quoteData.customerName,
    delivery_email: quoteData.customerEmail,
    delivery_phone: quoteData.customerPhone,
    delivery_street: quoteData.street || null,
    delivery_city: quoteData.city || null,
    delivery_state: quoteData.state || null,
    delivery_zip: quoteData.zipCode,
    delivery_time_preference: quoteData.timeframe || null,
    notes: notesLines.join('\n'),
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
