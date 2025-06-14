
import { supabase } from '@/integrations/supabase/client';
import type { OrderItemData } from '../utils/paymentUtils';

export interface OrderInsertData {
  orderId: string;
  items: OrderItemData[];
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
}

const extractDeliveryDetails = (item: any) => {
  console.log('=== EXTRACTING DELIVERY DETAILS ===', {
    itemId: item.id,
    hasDirectContactInfo: !!(item as any).contactInfo,
    hasDirectDeliveryAddress: !!(item as any).deliveryAddress,
    hasDirectDeliveryDate: !!(item as any).deliveryDate,
    hasMetadata: !!item.metadata,
    metadataKeys: item.metadata ? Object.keys(item.metadata) : []
  });

  // Helper function to safely parse JSON strings
  const safeJsonParse = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  // Extract contact info - check direct properties first, then metadata
  let contactInfo = (item as any).contactInfo;
  if (!contactInfo && item.metadata) {
    contactInfo = {
      name: item.metadata.contactName,
      phone: item.metadata.contactPhone,
      email: item.metadata.contactEmail
    };
  }

  // Extract delivery address - check direct properties first, then metadata
  let deliveryAddress = (item as any).deliveryAddress;
  if (!deliveryAddress && item.metadata?.deliveryAddress) {
    // Try to parse if it's a JSON string
    if (typeof item.metadata.deliveryAddress === 'string') {
      deliveryAddress = safeJsonParse(item.metadata.deliveryAddress);
    } else {
      deliveryAddress = item.metadata.deliveryAddress;
    }
  }

  // Extract delivery date - check direct properties first, then metadata
  let deliveryDate = (item as any).deliveryDate;
  if (!deliveryDate && item.metadata?.deliveryDate) {
    deliveryDate = item.metadata.deliveryDate;
  }

  // Extract other delivery details
  const deliveryTimePreference = (item as any).deliveryTimePreference || item.metadata?.deliveryTimePreference;
  const deliveryInstructions = (item as any).deliveryInstructions || item.metadata?.deliveryInstructions;
  const quantity = (item as any).tons || item.quantity || 1;

  console.log('Extracted delivery details:', {
    contactInfo,
    deliveryAddress,
    deliveryDate,
    deliveryTimePreference,
    deliveryInstructions,
    quantity
  });

  return {
    contactInfo: contactInfo || {},
    deliveryAddress: deliveryAddress || {},
    deliveryDate,
    deliveryTimePreference,
    deliveryInstructions,
    quantity
  };
};

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

    // Process each item with enhanced delivery details extraction
    const orderRecords = orderData.items.map((item, index) => {
      console.log('=== PROCESSING CART ITEM FOR DB INSERT ===', {
        itemIndex: index,
        id: item.id,
        name: item.name,
        price: item.price
      });

      const {
        contactInfo,
        deliveryAddress,
        deliveryDate,
        deliveryTimePreference,
        deliveryInstructions,
        quantity
      } = extractDeliveryDetails(item);

      // Validate required fields
      if (!contactInfo.name) {
        console.warn('Missing contact name for item:', item.id);
      }
      if (!deliveryAddress.street) {
        console.warn('Missing delivery address for item:', item.id);
      }

      const record = {
        order_id: orderData.orderId,
        stripe_session_id: orderData.stripeSessionId || `test_session_${orderData.orderId}_${index}`,
        stripe_payment_intent_id: orderData.stripePaymentIntentId || null,
        product_id: item.id.toString(),
        unit: 'tons',
        unit_price: item.price || 0,
        total_price: (item.price || 0) * quantity,
        quantity: quantity,
        status: 'confirmed',
        delivery_name: contactInfo.name || null,
        delivery_phone: contactInfo.phone || null,
        delivery_email: contactInfo.email || null,
        billing_name: contactInfo.name || null,
        billing_email: contactInfo.email || null,
        delivery_date: deliveryDate || null,
        delivery_street: deliveryAddress.street || null,
        delivery_city: deliveryAddress.city || null,
        delivery_state: deliveryAddress.state || null,
        delivery_zip: deliveryAddress.zip || null,
        delivery_time_preference: deliveryTimePreference || null,
        delivery_instructions: deliveryInstructions || null
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

// Test function to insert sample data
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
