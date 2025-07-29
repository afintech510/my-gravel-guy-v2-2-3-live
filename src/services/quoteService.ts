import { supabase } from '@/integrations/supabase/client';
import { GroupedOrder } from '@/types/order.types';
import { generateQuoteProposalEmail } from '@/utils/quoteEmailTemplates';

export interface QuoteOptions {
  customMessage?: string;
  expirationDays?: number;
  customPrice?: number;
}

export const quoteService = {
  /**
   * Send a quote email from an existing order
   */
  async sendQuoteFromExistingOrder(order: GroupedOrder, options: QuoteOptions = {}) {
    const { customMessage, expirationDays = 30, customPrice } = options;

    try {
      // Set quote expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      // Update order to quote status
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          quote_expires_at: expirationDate.toISOString(),
          quote_status: 'sent',
          fulfillment_status: 'Quote Sent',
          quoted_price: customPrice || order.total_price
        })
        .eq('order_id', order.order_id);

      if (updateError) {
        console.error('Error updating order to quote status:', updateError);
        throw new Error('Failed to update order status');
      }

      // Get product names for the email
      const { data: products } = await supabase
        .from('products')
        .select('id, name');
      
      const productNameMap = products?.reduce((map, product) => {
        map[product.id] = product.name;
        return map;
      }, {} as { [key: string]: string }) || {};

      // Generate quote proposal email
      const htmlContent = generateQuoteProposalEmail(
        {
          name: order.billing_name || 'Customer',
          email: order.billing_email || '',
          phone: order.items[0]?.delivery_phone || '',
          message: customMessage || 'Quote updated and ready for review',
          zipCode: order.items[0]?.delivery_address?.zip || '',
          selectedProduct: null,
          orderId: order.order_id
        }, 
        order.items,
        window.location.origin,
        productNameMap
      );

      // Send quote email to customer
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: order.billing_email,
          subject: `Your Quote #${order.order_id} - Ready for Review & Payment`,
          html: htmlContent,
          type: 'customer_confirmation'
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        throw new Error('Failed to send quote email to customer');
      }

      // Send internal notification
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'sales@mygravelguy.com',
          subject: `Quote Sent - ${order.order_id}`,
          html: htmlContent,
          type: 'internal_notification'
        }
      });

      return {
        success: true,
        quoteId: order.order_id,
        expirationDate
      };

    } catch (error) {
      console.error('Error sending quote:', error);
      throw error;
    }
  },

  /**
   * Check if an order can be converted to a quote
   */
  canSendQuote(order: GroupedOrder): boolean {
    // Can send quote if order has customer email and items
    return !!(order.billing_email && order.items.length > 0);
  },

  /**
   * Get quote status and expiration info
   */
  getQuoteInfo(order: GroupedOrder) {
    // Check if this is a quote by looking at fulfillment status
    const hasQuote = order.fulfillment_status === 'Quote Sent';
    const isExpired = false; // We'll need to add quote expiration logic if needed

    return {
      hasQuote,
      status: order.fulfillment_status,
      isExpired,
      expirationDate: null // Will be null for now since OrderItem doesn't have this field
    };
  }
};