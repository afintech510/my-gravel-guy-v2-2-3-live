
import { supabase } from '@/integrations/supabase/client';
import type { OrderItemData } from '../utils/paymentUtils';

export interface OrderInsertData {
  orderId: string;
  items: OrderItemData[];
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
}

export const insertOrderToDatabase = async (orderData: OrderInsertData) => {
  console.log('=== INSERTING ORDER TO DATABASE ===', {
    orderId: orderData.orderId,
    itemsCount: orderData.items.length,
    stripeSessionId: orderData.stripeSessionId?.substring(0, 20) + '...' || 'none'
  });

  try {
    // Use the exact same logic as the working checkout test button
    const orderRecords = orderData.items.map((item, index) => {
      // Helper function to safely get delivery address properties
      const getDeliveryAddressValue = (property: string) => {
        if (!item.metadata?.deliveryAddress) return null;
        
        if (typeof item.metadata.deliveryAddress === 'string') {
          try {
            const parsed = JSON.parse(item.metadata.deliveryAddress);
            return parsed[property] || null;
          } catch {
            return null;
          }
        }
        
        if (typeof item.metadata.deliveryAddress === 'object' && item.metadata.deliveryAddress !== null) {
          return (item.metadata.deliveryAddress as any)[property] || null;
        }
        
        return null;
      };

      return {
        order_id: orderData.orderId,
        stripe_session_id: orderData.stripeSessionId || `test_session_${orderData.orderId}_${index}`,
        stripe_payment_intent_id: orderData.stripePaymentIntentId || null,
        product_id: item.id.toString(),
        unit: 'tons',
        unit_price: item.price,
        total_price: item.price * (item.quantity || item.tons || 0),
        quantity: item.quantity || item.tons || 0,
        status: 'confirmed',
        delivery_name: item.metadata?.contactName || null,
        delivery_phone: item.metadata?.contactPhone || null,
        delivery_email: item.metadata?.contactEmail || null,
        billing_name: item.metadata?.contactName || null,
        billing_email: item.metadata?.contactEmail || null,
        delivery_date: item.metadata?.deliveryDate || null,
        delivery_street: getDeliveryAddressValue('street'),
        delivery_city: getDeliveryAddressValue('city'),
        delivery_state: getDeliveryAddressValue('state'),
        delivery_zip: getDeliveryAddressValue('zip'),
        delivery_time_preference: item.metadata?.deliveryTimePreference || null,
        delivery_instructions: item.metadata?.deliveryInstructions || null
      };
    });

    console.log('Schema-accurate order records to insert:', orderRecords);

    const { data, error } = await supabase
      .from('orders')
      .insert(orderRecords)
      .select();

    if (error) {
      console.error('Failed to create order records:', error);
      throw new Error(`Database insert failed: ${error.message}`);
    }

    console.log('Successfully created order records:', data);
    return data;

  } catch (error) {
    console.error('Error inserting order to database:', error);
    throw error;
  }
};
