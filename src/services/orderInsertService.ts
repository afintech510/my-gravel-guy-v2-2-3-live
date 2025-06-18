
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
    // Validate input data
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('No items provided for database insert');
    }

    // Process each item - use direct properties from backup data and match database schema
    const orderRecords = orderData.items.map((item, index) => {
      console.log('=== PROCESSING CART ITEM FOR DB INSERT ===', {
        itemIndex: index,
        id: item.id,
        name: item.name,
        price: item.price,
        itemKeys: Object.keys(item),
        hasDirectContactInfo: !!(item as any).contactInfo,
        hasDirectDeliveryAddress: !!(item as any).deliveryAddress,
        hasDirectDeliveryDate: !!(item as any).deliveryDate,
        hasDirectTons: !!(item as any).tons,
        directContactInfo: (item as any).contactInfo,
        directDeliveryAddress: (item as any).deliveryAddress,
        directDeliveryDate: (item as any).deliveryDate,
        directTons: (item as any).tons
      });

      // Get contact info directly from item properties
      const contactInfo = (item as any).contactInfo || {};
      const deliveryAddress = (item as any).deliveryAddress || {};
      const deliveryDate = (item as any).deliveryDate;
      const quantity = (item as any).tons || item.quantity || 1;
      const deliveryTimePreference = (item as any).deliveryTimePreference;
      const deliveryInstructions = (item as any).deliveryInstructions;

      console.log('Extracted data for record:', {
        contactInfo,
        deliveryAddress,
        deliveryDate,
        quantity,
        deliveryTimePreference,
        deliveryInstructions
      });

      // Validate required fields
      if (!contactInfo.name) {
        console.warn('Missing contact name for item:', item.id);
      }
      if (!deliveryAddress.street) {
        console.warn('Missing delivery address for item:', item.id);
      }

      // Record structure to match the original database schema field names
      const record = {
        order_id: orderData.orderId,
        stripe_session_id: orderData.stripeSessionId || `test_session_${orderData.orderId}_${index}`,
        stripe_payment_intent_id: orderData.stripePaymentIntentId || `test_intent_${orderData.orderId}`,
        product_id: item.id.toString(),
        unit: 'tons',
        unit_price: item.price || 0,
        total_price: (item.price || 0) * quantity,
        delivery_date: deliveryDate || new Date().toISOString(),
        delivery_address: deliveryAddress.street || 'Unknown Address', // Using original field name
        delivery_city: deliveryAddress.city || null,
        delivery_state: deliveryAddress.state || null,
        delivery_zip: deliveryAddress.zip || null,
        customer_name: contactInfo.name || null, // Using original field name
        customer_email: contactInfo.email || null, // Using original field name
        customer_phone: contactInfo.phone || null, // Using original field name
        instructions: deliveryInstructions || null,
        status: 'confirmed',
        tons: quantity, // Using original field name
        zip_adjust: 0 // Using original field name
      };

      console.log('Final order record to insert:', record);
      return record;
    });

    console.log('All order records prepared for insert:', orderRecords);

    // Attempt database insert
    const { data, error } = await supabase
      .from('orders')
      .insert(orderRecords)
      .select();

    if (error) {
      console.error('Database insert error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Database insert failed: ${error.message}`);
    }

    console.log('Successfully created order records:', data);
    return data;

  } catch (error) {
    console.error('Error in insertOrderToDatabase:', {
      error: error.message,
      stack: error.stack,
      orderData: orderData
    });
    throw error;
  }
};

// Test function to insert sample data - using original field names
export const testDatabaseInsert = async () => {
  console.log('=== TESTING DATABASE INSERT ===');
  
  const testOrderData = {
    orderId: `TEST-${Date.now()}`,
    items: [{
      id: 'test-product-1',
      name: 'Test Gravel',
      price: 50,
      quantity: 2,
      tons: 2,
      contactInfo: {
        name: 'Test User',
        phone: '555-1234',
        email: 'test@example.com'
      },
      deliveryAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TX',
        zip: '12345'
      },
      deliveryDate: new Date().toISOString(),
      deliveryTimePreference: 'morning',
      deliveryInstructions: 'Test delivery instructions'
    }],
    stripeSessionId: 'test_session_123'
  };

  try {
    const result = await insertOrderToDatabase(testOrderData);
    console.log('Test insert successful:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Test insert failed:', error);
    return { success: false, error: error.message };
  }
};
