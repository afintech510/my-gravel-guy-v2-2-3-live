
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
        if (!item.deliveryAddress) return null;
        
        if (typeof item.deliveryAddress === 'string') {
          try {
            const parsed = JSON.parse(item.deliveryAddress);
            return parsed[property] || null;
          } catch {
            return null;
          }
        }
        
        if (typeof item.deliveryAddress === 'object' && item.deliveryAddress !== null) {
          return (item.deliveryAddress as any)[property] || null;
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
        delivery_name: item.contactInfo?.name || null,
        delivery_phone: item.contactInfo?.phone || null,
        delivery_email: item.contactInfo?.email || null,
        billing_name: item.contactInfo?.name || null,
        billing_email: item.contactInfo?.email || null,
        delivery_date: item.deliveryDate instanceof Date ? 
          item.deliveryDate.toISOString().split('T')[0] : 
          (typeof item.deliveryDate === 'string' ? item.deliveryDate : null),
        delivery_street: getDeliveryAddressValue('street'),
        delivery_city: getDeliveryAddressValue('city'),
        delivery_state: getDeliveryAddressValue('state'),
        delivery_zip: getDeliveryAddressValue('zip'),
        delivery_time_preference: item.deliveryTimePreference,
        delivery_instructions: item.deliveryInstructions
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
