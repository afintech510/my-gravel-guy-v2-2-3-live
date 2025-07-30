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
      
      // Calculate total amount from ALL order items
      const totalAmount = order.items.reduce((sum, item) => sum + item.total_price, 0);
      
      // Set quote expiration date
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expirationDays);

      // Extract base order ID to update all related items
      const baseOrderId = this.extractBaseOrderId(order.order_id);
      console.log(`Processing quote for order: ${order.order_id}, base ID: ${baseOrderId}`);
      
      // Build query based on order ID type
      const isTimestampId = baseOrderId === order.order_id;
      const updateQuery = isTimestampId 
        ? supabase.from('orders').update({ 
            status: 'Quote',
            fulfillment_status: 'Quote Sent',
            quote_expires_at: expirationDate.toISOString(),
            quote_status: 'sent',
            quoted_price: totalAmount,
            quote_notes: notes || undefined
          }).eq('order_id', baseOrderId)
        : supabase.from('orders').update({ 
            status: 'Quote',
            fulfillment_status: 'Quote Sent',
            quote_expires_at: expirationDate.toISOString(),
            quote_status: 'sent',
            quoted_price: totalAmount,
            quote_notes: notes || undefined
          }).or(`order_id.eq.${baseOrderId},order_id.like.${baseOrderId}-%`);
      
      const { error: updateError } = await updateQuery;

      if (updateError) {
        console.error('Error updating order to quote:', updateError);
        return { success: false, error: 'Failed to update order status' };
      }

      // Get ALL related order items for email with validation
      const selectQuery = isTimestampId
        ? supabase.from('orders').select('*').eq('order_id', baseOrderId)
        : supabase.from('orders').select('*').or(`order_id.eq.${baseOrderId},order_id.like.${baseOrderId}-%`);
      
      const { data: allQuoteItems, error: selectError } = await selectQuery;
      
      if (selectError) {
        console.error('Error fetching quote items:', selectError);
        return { success: false, error: 'Failed to fetch order items' };
      }
      
      // Validate customer data consistency
      if (allQuoteItems && allQuoteItems.length > 1) {
        const firstCustomer = allQuoteItems[0];
        const hasMultipleCustomers = allQuoteItems.some(item => 
          item.delivery_email !== firstCustomer.delivery_email ||
          item.billing_email !== firstCustomer.billing_email
        );
        
        if (hasMultipleCustomers) {
          console.error('ALERT: Multiple customers detected in quote items:', {
            orderId: order.order_id,
            baseOrderId,
            itemCount: allQuoteItems.length,
            customers: allQuoteItems.map(item => ({
              delivery_email: item.delivery_email,
              billing_email: item.billing_email
            }))
          });
          return { success: false, error: 'Data integrity issue: Multiple customers in quote' };
        }
      }

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

      // Generate quote proposal email using ALL order items
      const htmlContent = generateQuoteProposalEmail(
        {
          name: firstItem.delivery_name || order.billing_name || 'Customer',
          email: firstItem.delivery_email || order.billing_email || '',
          phone: firstItem.delivery_phone || '',
          message: notes || 'Quote generated from existing order',
          zipCode: firstItem.delivery_address?.zip || '',
          orderId: baseOrderId
        }, 
        allQuoteItems || [], // Use the fresh database items with quote_notes
        window.location.origin,
        productNameMap
      );

      // Send quote email to customer
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: firstItem.delivery_email || order.billing_email,
          subject: `MyGravelGuy Quote is ready for review`,
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
          subject: `Quote Sent - ${baseOrderId}`,
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

  /**
   * Extract base order ID from a potentially suffixed order ID
   * Handles timestamp-based IDs correctly (e.g., CART-1753825876923)
   */
  private static extractBaseOrderId(orderId: string): string {
    const parts = orderId.split('-');
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      // If last part is a timestamp (13 digits), keep the full ID
      if (lastPart.length === 13 && !isNaN(parseInt(lastPart))) {
        console.log(`Timestamp-based order ID detected: ${orderId}`);
        return orderId; // Return full ID for timestamp-based orders
      }
      // If last part is a small number (likely a suffix), remove it
      if (!isNaN(parseInt(lastPart)) && lastPart.length < 10) {
        const baseId = parts.slice(0, -1).join('-');
        console.log(`Suffix-based order ID detected: ${orderId}, base: ${baseId}`);
        return baseId;
      }
    }
    return orderId;
  }
}