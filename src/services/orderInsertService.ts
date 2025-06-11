
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
    const orderRecords = orderData.items.map((item, index) => ({
      order_id: orderData.orderId,
      stripe_session_id: orderData.stripeSessionId || `test_session_${orderData.orderId}_${index}`,
      stripe_payment_intent_id: orderData.stripePaymentIntentId || null,
      product_id: item.id.toString(),
      unit: 'tons',
      unit_price: item.price,
      total_price: item.price * (item.quantity || item.tons || 0),
      quantity: item.quantity || item.tons || 0,
      status: 'confirmed',
      delivery_name: item.metadata?.contactName,
      delivery_phone: item.metadata?.contactPhone,
      delivery_email: item.metadata?.contactEmail,
      billing_name: item.metadata?.contactName,
      billing_email: item.metadata?.contactEmail,
      delivery_date: item.metadata?.deliveryDate,
      delivery_street: item.metadata?.deliveryAddress ? 
        (typeof item.metadata.deliveryAddress === 'string' ? 
          JSON.parse(item.metadata.deliveryAddress).street : 
          item.metadata.deliveryAddress.street) : null,
      delivery_city: item.metadata?.deliveryAddress ? 
        (typeof item.metadata.deliveryAddress === 'string' ? 
          JSON.parse(item.metadata.deliveryAddress).city : 
          item.metadata.deliveryAddress.city) : null,
      delivery_state: item.metadata?.deliveryAddress ? 
        (typeof item.metadata.deliveryAddress === 'string' ? 
          JSON.parse(item.metadata.deliveryAddress).state : 
          item.metadata.deliveryAddress.state) : null,
      delivery_zip: item.metadata?.deliveryAddress ? 
        (typeof item.metadata.deliveryAddress === 'string' ? 
          JSON.parse(item.metadata.deliveryAddress).zip : 
          item.metadata.deliveryAddress.zip) : null,
      delivery_time_preference: item.metadata?.deliveryTimePreference,
      delivery_instructions: item.metadata?.deliveryInstructions
    }));

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
