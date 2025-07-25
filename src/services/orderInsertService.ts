
import { supabase } from '@/integrations/supabase/client';
import type { OrderItemData } from '../utils/paymentUtils';

export interface OrderInsertData {
  orderId: string;
  items: OrderItemData[];
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
}

export const insertOrderToDatabase = async (orderData: OrderInsertData) => {
  console.log('=== INSERTING ENHANCED ORDER TO DATABASE ===', {
    orderId: orderData.orderId,
    itemsCount: orderData.items.length,
    stripeSessionId: orderData.stripeSessionId?.substring(0, 20) + '...' || 'none',
    stripePaymentIntentId: orderData.stripePaymentIntentId?.substring(0, 20) + '...' || 'none'
  });

  try {
    // Validate input data
    if (!orderData.items || orderData.items.length === 0) {
      throw new Error('No items provided for database insert');
    }

    // Process each item with enhanced data structure handling
    const orderRecords = orderData.items.map((item, index) => {
      console.log('=== PROCESSING ENHANCED CART ITEM FOR DB INSERT ===', {
        itemIndex: index,
        id: item.id,
        name: item.name,
        price: item.price,
        itemKeys: Object.keys(item),
        hasDirectContactInfo: !!item.contactInfo,
        hasDirectDeliveryAddress: !!item.deliveryAddress,
        hasDirectDeliveryDate: !!item.deliveryDate,
        hasDirectTons: !!item.tons,
        directContactInfo: item.contactInfo,
        directDeliveryAddress: item.deliveryAddress,
        directDeliveryDate: item.deliveryDate,
        directTons: item.tons
      });

      // Enhanced: Try multiple sources for contact info
      const contactInfo = item.contactInfo || 
                         (item as any).contact_info || 
                         (item.metadata ? {
                           name: item.metadata.contactName,
                           email: item.metadata.contactEmail,
                           phone: item.metadata.contactPhone
                         } : {});

      // Enhanced: Try multiple sources for delivery address
      const deliveryAddress = item.deliveryAddress || 
                             (item as any).delivery_address ||
                             (item.metadata?.deliveryAddress ? 
                               JSON.parse(item.metadata.deliveryAddress) : {});

      // Enhanced: Try multiple sources for delivery date
      const deliveryDate = item.deliveryDate || 
                          (item as any).delivery_date ||
                          item.metadata?.deliveryDate;

      const quantity = item.tons || (item as any).tons || item.quantity || 1;
      const deliveryTimePreference = item.deliveryTimePreference || 
                                   (item as any).delivery_time_preference ||
                                   item.metadata?.deliveryTimePreference;
      const deliveryInstructions = item.deliveryInstructions || 
                                 (item as any).delivery_instructions ||
                                 item.metadata?.deliveryInstructions;

      console.log('Enhanced extracted data for record:', {
        contactInfo,
        deliveryAddress,
        deliveryDate,
        quantity,
        deliveryTimePreference,
        deliveryInstructions
      });

      // Validate required fields with enhanced logging
      if (!contactInfo.name) {
        console.warn('Missing contact name for item:', item.id);
      }
      if (!deliveryAddress.street) {
        console.warn('Missing delivery address for item:', item.id);
      }
      if (!contactInfo.email) {
        console.warn('Missing contact email for item:', item.id);
      }

      // Enhanced Stripe ID handling with better fallbacks
      const finalStripeSessionId = orderData.stripeSessionId || `fallback_session_${orderData.orderId}_${index}`;
      const finalStripePaymentIntentId = orderData.stripePaymentIntentId || null;

      console.log('=== STRIPE IDs FOR THIS RECORD ===', {
        provided_session_id: orderData.stripeSessionId,
        provided_payment_intent_id: orderData.stripePaymentIntentId,
        final_session_id: finalStripeSessionId,
        final_payment_intent_id: finalStripePaymentIntentId
      });

      const record = {
        order_id: orderData.orderId,
        stripe_session_id: finalStripeSessionId,
        stripe_payment_intent_id: finalStripePaymentIntentId,
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

      console.log('Final enhanced order record to insert:', {
        order_id: record.order_id,
        stripe_session_id: record.stripe_session_id,
        stripe_payment_intent_id: record.stripe_payment_intent_id,
        product_id: record.product_id,
        delivery_email: record.delivery_email
      });
      return record;
    });

    console.log('All enhanced order records prepared for insert:', {
      recordCount: orderRecords.length,
      firstRecordStripeIds: {
        session_id: orderRecords[0]?.stripe_session_id,
        payment_intent_id: orderRecords[0]?.stripe_payment_intent_id
      }
    });

    // Attempt database insert
    const { data, error } = await supabase
      .from('orders')
      .insert(orderRecords)
      .select();

    if (error) {
      console.error('Enhanced database insert error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw new Error(`Enhanced database insert failed: ${error.message}`);
    }

    console.log('Successfully created enhanced order records:', {
      insertedCount: data?.length || 0,
      sampleRecord: data?.[0] ? {
        id: data[0].id,
        order_id: data[0].order_id,
        stripe_session_id: data[0].stripe_session_id,
        stripe_payment_intent_id: data[0].stripe_payment_intent_id
      } : null
    });
    
    return data;

  } catch (error) {
    console.error('Error in enhanced insertOrderToDatabase:', {
      error: error.message,
      stack: error.stack,
      orderData: {
        orderId: orderData.orderId,
        itemCount: orderData.items?.length || 0,
        hasStripeSessionId: !!orderData.stripeSessionId,
        hasStripePaymentIntentId: !!orderData.stripePaymentIntentId
      }
    });
    throw error;
  }
};

// Function to create manual order records in database
export const createManualOrderRecords = async (orderData: {
  orderId: string;
  orderItems: any[];
  customerInfo: any;
  deliveryInfo: any;
  status: string;
  fulfillmentStatus: string;
  quotedPrice?: number;
  salesPerson?: string;
  notes?: string;
}) => {
  console.log('Creating manual order records:', orderData);

  const records = orderData.orderItems.map((item, index) => ({
    order_id: orderData.orderItems.length > 1 ? `${orderData.orderId}-${index + 1}` : orderData.orderId,
    product_id: item.productId,
    unit: item.unit,
    unit_price: item.unitPrice,
    total_price: item.totalPrice,
    quantity: item.quantity,
    delivery_name: orderData.customerInfo.name,
    delivery_email: orderData.customerInfo.email,
    delivery_phone: orderData.customerInfo.phone,
    delivery_street: orderData.deliveryInfo.street,
    delivery_city: orderData.deliveryInfo.city,
    delivery_state: orderData.deliveryInfo.state,
    delivery_zip: orderData.deliveryInfo.zip,
    delivery_date: orderData.deliveryInfo.date,
    delivery_time_preference: orderData.deliveryInfo.timePreference,
    delivery_instructions: orderData.deliveryInfo.instructions,
    status: orderData.status,
    fulfillment_status: orderData.fulfillmentStatus as "Quote Needed" | "Quote Sent" | "New Order" | "Pending" | "Assigned" | "Scheduled" | "Delivered" | "Cancelled" | "Refunded",
    quoted_price: orderData.quotedPrice || null,
    sales_person: orderData.salesPerson === 'not-assigned' ? null : orderData.salesPerson,
    notes: orderData.notes,
    billing_name: orderData.customerInfo.name,
    billing_email: orderData.customerInfo.email,
  }));

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert(records)
      .select();

    if (error) {
      console.error('Error creating manual order records:', error);
      throw error;
    }

    console.log('Manual order records created successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to create manual order records:', error);
    throw error;
  }
};

// Enhanced test function with complete delivery data
export const testEnhancedDatabaseInsert = async () => {
  console.log('=== TESTING ENHANCED DATABASE INSERT ===');
  
  const testOrderData = {
    orderId: `ENHANCED-TEST-${Date.now()}`,
    items: [{
      id: 'enhanced-test-product-1',
      name: 'Enhanced Test Gravel',
      price: 50,
      quantity: 2,
      tons: 2,
      // Enhanced: Include all delivery data structures
      contactInfo: {
        name: 'Enhanced Test User',
        phone: '555-1234',
        email: 'enhanced.test@example.com'
      },
      deliveryAddress: {
        street: '123 Enhanced Test St',
        city: 'Enhanced Test City',
        state: 'TX',
        zip: '12345'
      },
      deliveryDate: new Date().toISOString(),
      deliveryTimePreference: 'morning',
      deliveryInstructions: 'Enhanced test delivery instructions with complete data'
    }],
    stripeSessionId: 'cs_test_enhanced_session_123',
    stripePaymentIntentId: 'pi_test_enhanced_payment_intent_123'
  };

  try {
    const result = await insertOrderToDatabase(testOrderData);
    console.log('Enhanced test insert successful:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Enhanced test insert failed:', error);
    return { success: false, error: error.message };
  }
};
