import { supabase } from '@/integrations/supabase/client';
import { GroupedOrder } from '@/types/order.types';
import { generateQuoteProposalEmail } from '@/utils/quoteEmailTemplates';
import { extractBaseOrderId, getOrderPatternQuery } from '@/utils/orderIdUtils';

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
      const baseOrderId = extractBaseOrderId(order.order_id);
      
      console.log('Quote Service - Processing order:', {
        originalOrderId: order.order_id,
        extractedBaseOrderId: baseOrderId,
        totalItems: order.items.length
      });
      
      // Update ALL related order items to quote status with expiration
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
        .or(getOrderPatternQuery(baseOrderId));

      if (updateError) {
        console.error('Error updating order to quote:', updateError);
        return { success: false, error: 'Failed to update order status' };
      }

      // Get ALL related order items for email (but only for this specific base order)
      const { data: allQuoteItems } = await supabase
        .from('orders')
        .select('*')
        .or(getOrderPatternQuery(baseOrderId));

      console.log('📧 Quote email - fetching items for base order:', baseOrderId);
      console.log('📧 Raw query result:', allQuoteItems?.length || 0, 'items found');
      
      // Filter to ensure we only get items that truly belong to this order family
      // and have the same customer to prevent accidentally grouping different customers' orders
      const orderFamilyItems = allQuoteItems?.filter(item => {
        const itemBaseId = extractBaseOrderId(item.order_id);
        const belongsToFamily = itemBaseId === baseOrderId;
        return belongsToFamily;
      }) || [];

      // Validate customer consistency
      if (orderFamilyItems.length > 1) {
        const firstCustomer = orderFamilyItems[0].delivery_name || orderFamilyItems[0].billing_name;
        const customerEmails = [...new Set(orderFamilyItems.map(item => item.delivery_email || item.billing_email))];
        
        if (customerEmails.length > 1) {
          console.error('❌ CRITICAL: Quote email would combine orders from different customers!', {
            baseOrderId,
            customerEmails,
            orderIds: orderFamilyItems.map(item => item.order_id)
          });
          return { success: false, error: 'Cannot send quote - multiple customers detected in order group' };
        }
      }

      console.log('📧 Filtered to order family:', orderFamilyItems.length, 'items');
      
      // Filter out $0 general-quote items for the email
      const validQuoteItems = orderFamilyItems.filter(item => 
        !(item.product_id === 'general-quote' && item.total_price === 0)
      );

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

      console.log('Quote Service - Email data:', {
        baseOrderId,
        totalItemsFromDB: allQuoteItems?.length || 0,
        validItemsForEmail: validQuoteItems.length,
        validItems: validQuoteItems.map(item => ({
          product_id: item.product_id,
          total_price: item.total_price
        }))
      });

      // Generate quote proposal email using valid items only
      const htmlContent = generateQuoteProposalEmail(
        {
          name: firstItem.delivery_name || order.billing_name || 'Customer',
          email: firstItem.delivery_email || order.billing_email || '',
          phone: firstItem.delivery_phone || '',
          message: notes || 'Quote generated from existing order',
          zipCode: firstItem.delivery_address?.zip || '',
          orderId: baseOrderId
        }, 
        validQuoteItems, // Use filtered items excluding $0 general-quote items
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

  // Note: extractBaseOrderId is now imported from orderIdUtils
}