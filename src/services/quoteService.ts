import { supabase } from '@/integrations/supabase/client';
import { GroupedOrder } from '@/types/order.types';
import { generateQuoteProposalEmail } from '@/utils/quoteEmailTemplates';

interface SendQuoteOptions {
  notes?: string;
  expirationDays?: number;
}

export class QuoteService {
  static async sendQuoteFromExistingOrder(
    order: GroupedOrder, 
    options: SendQuoteOptions = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { notes = '', expirationDays = 30 } = options;
      
      // Calculate total amount from order items
      const totalAmount = order.items.reduce((sum, item) => sum + item.total_price, 0);
      
      // Set quote expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      // Update order to quote status with expiration
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'Quote',
          fulfillment_status: 'Quote Sent',
          quote_expires_at: expirationDate.toISOString(),
          quote_status: 'sent',
          quoted_price: totalAmount,
          quote_notes: notes || undefined
        })
        .eq('order_id', order.order_id);

      if (updateError) {
        console.error('Error updating order to quote:', updateError);
        return { success: false, error: 'Failed to update order status' };
      }

      // Get updated order items for email
      const { data: quoteItems } = await supabase
        .from('orders')
        .select('*')
        .eq('order_id', order.order_id);

      // Get product names for the email
      const { data: products } = await supabase
        .from('products')
        .select('id, name');
      
      const productNameMap = products?.reduce((map, product) => {
        map[product.id] = product.name;
        return map;
      }, {} as { [key: string]: string }) || {};

      // Get customer info from first item
      const firstItem = order.items[0];
      if (!firstItem) {
        return { success: false, error: 'No order items found' };
      }

      // Generate quote proposal email using current order items
      const htmlContent = generateQuoteProposalEmail(
        {
          name: firstItem.delivery_name || order.billing_name || 'Customer',
          email: firstItem.delivery_email || order.billing_email || '',
          phone: firstItem.delivery_phone || '',
          message: notes || 'Quote generated from existing order',
          zipCode: firstItem.delivery_address?.zip || '',
          orderId: order.order_id
        }, 
        order.items, // Use current order items instead of stale database data
        window.location.origin,
        productNameMap
      );

      // Send quote email to customer
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: firstItem.delivery_email || order.billing_email,
          subject: `Your Quote #${order.order_id} - Ready for Review & Payment`,
          html: htmlContent,
          type: 'customer_confirmation'
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        return { 
          success: false, 
          error: 'Quote updated but email failed to send' 
        };
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

      return { success: true };
    } catch (error) {
      console.error('Error sending quote:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}