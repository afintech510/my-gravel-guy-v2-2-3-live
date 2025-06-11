
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
    // Prepare order records for each cart item with correct field mapping
    const orderRecords = orderData.items.map((item, index) => {
      let deliveryAddress = null;

      if (item.metadata?.deliveryAddress) {
        try {
          deliveryAddress = typeof item.metadata.deliveryAddress === 'string' ? 
            JSON.parse(item.metadata.deliveryAddress) : item.metadata.deliveryAddress;
        } catch (e) {
          console.warn(`Failed to parse delivery address for item ${index}:`, e);
        }
      }

      return {
        order_id: orderData.orderId,
        stripe_session_id: orderData.stripeSessionId || null,
        stripe_payment_intent_id: orderData.stripePaymentIntentId || null,
        product_id: String(item.id || ''),
        unit: 'tons', // Required field for the schema
        unit_price: item.price,
        total_price: item.price * (item.quantity || item.tons || 0),
        quantity: item.quantity || item.tons || 0,
        delivery_date: item.metadata?.deliveryDate || null,
        delivery_street: deliveryAddress?.street || null,
        delivery_city: deliveryAddress?.city || null,
        delivery_state: deliveryAddress?.state || null,
        delivery_zip: deliveryAddress?.zip || null,
        delivery_name: item.metadata?.contactName || null,
        delivery_phone: item.metadata?.contactPhone || null,
        delivery_email: item.metadata?.contactEmail || null,
        delivery_time_preference: item.metadata?.deliveryTimePreference || null,
        delivery_instructions: item.metadata?.deliveryInstructions || null,
        billing_name: item.metadata?.contactName || null,
        billing_email: item.metadata?.contactEmail || null,
        status: 'confirmed'
      };
    });

    console.log('Inserting order records:', orderRecords);

    // Insert order records into the database
    const { data: orderInsertData, error: orderError } = await supabase
      .from('orders')
      .insert(orderRecords)
      .select();

    if (orderError) {
      console.error('Failed to create order records:', orderError);
      throw new Error(`Database insert failed: ${orderError.message}`);
    }

    console.log('Successfully created order records:', orderInsertData);
    return orderInsertData;

  } catch (error) {
    console.error('Error inserting order to database:', error);
    throw error;
  }
};
