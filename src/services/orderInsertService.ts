
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
    // Process each item and handle both direct properties and metadata structure
    const orderRecords = orderData.items.map((item, index) => {
      console.log('=== PROCESSING CART ITEM FOR DB INSERT ===', {
        id: item.id,
        name: item.name,
        itemKeys: Object.keys(item),
        hasMetadata: !!item.metadata,
        metadataKeys: item.metadata ? Object.keys(item.metadata) : [],
        hasDirectContactInfo: !!(item as any).contactInfo,
        hasDirectDeliveryAddress: !!(item as any).deliveryAddress,
        hasDirectDeliveryDate: !!(item as any).deliveryDate,
        hasMetadataContactName: !!item.metadata?.contactName,
        hasMetadataDeliveryAddress: !!item.metadata?.deliveryAddress,
        hasMetadataDeliveryDate: !!item.metadata?.deliveryDate
      });

      // Function to get contact info - try both direct and metadata
      const getContactInfo = () => {
        // Try direct properties first (original cart structure)
        const directContactInfo = (item as any).contactInfo;
        if (directContactInfo) {
          console.log('Using direct contact info:', directContactInfo);
          return {
            name: directContactInfo.name,
            phone: directContactInfo.phone,
            email: directContactInfo.email
          };
        }
        
        // Fallback to metadata
        if (item.metadata) {
          console.log('Using metadata contact info');
          return {
            name: item.metadata.contactName,
            phone: item.metadata.contactPhone,
            email: item.metadata.contactEmail
          };
        }
        
        console.log('No contact info found');
        return { name: null, phone: null, email: null };
      };

      // Function to get delivery address - try both direct and metadata
      const getDeliveryAddress = () => {
        // Try direct properties first (original cart structure)
        const directAddress = (item as any).deliveryAddress;
        if (directAddress && typeof directAddress === 'object') {
          console.log('Using direct delivery address:', directAddress);
          return {
            street: directAddress.street,
            city: directAddress.city,
            state: directAddress.state,
            zip: directAddress.zip
          };
        }
        
        // Fallback to metadata
        if (item.metadata?.deliveryAddress) {
          console.log('Using metadata delivery address');
          
          if (typeof item.metadata.deliveryAddress === 'string') {
            try {
              const parsed = JSON.parse(item.metadata.deliveryAddress);
              return {
                street: parsed.street,
                city: parsed.city,
                state: parsed.state,
                zip: parsed.zip
              };
            } catch {
              console.log('Failed to parse delivery address string');
              return { street: null, city: null, state: null, zip: null };
            }
          }
          
          if (typeof item.metadata.deliveryAddress === 'object') {
            const addr = item.metadata.deliveryAddress as any;
            return {
              street: addr.street,
              city: addr.city,
              state: addr.state,
              zip: addr.zip
            };
          }
        }
        
        console.log('No delivery address found');
        return { street: null, city: null, state: null, zip: null };
      };

      // Function to get delivery date - try both direct and metadata
      const getDeliveryDate = () => {
        // Try direct properties first (original cart structure)
        const directDate = (item as any).deliveryDate;
        if (directDate) {
          console.log('Using direct delivery date:', directDate);
          return directDate instanceof Date ? directDate.toISOString() : directDate;
        }
        
        // Fallback to metadata
        if (item.metadata?.deliveryDate) {
          console.log('Using metadata delivery date:', item.metadata.deliveryDate);
          return item.metadata.deliveryDate;
        }
        
        console.log('No delivery date found');
        return null;
      };

      // Function to get quantity - try tons first, then quantity
      const getQuantity = () => {
        const directTons = (item as any).tons;
        if (directTons !== undefined && directTons !== null) {
          console.log('Using direct tons for quantity:', directTons);
          return directTons;
        }
        
        if (item.quantity !== undefined && item.quantity !== null) {
          console.log('Using item quantity:', item.quantity);
          return item.quantity;
        }
        
        console.log('No quantity found, defaulting to 0');
        return 0;
      };

      // Get all the data
      const contactInfo = getContactInfo();
      const deliveryAddress = getDeliveryAddress();
      const deliveryDate = getDeliveryDate();
      const quantity = getQuantity();
      
      // Get other properties
      const deliveryTimePreference = (item as any).deliveryTimePreference || item.metadata?.deliveryTimePreference || null;
      const deliveryInstructions = (item as any).deliveryInstructions || item.metadata?.deliveryInstructions || null;

      const record = {
        order_id: orderData.orderId,
        stripe_session_id: orderData.stripeSessionId || `test_session_${orderData.orderId}_${index}`,
        stripe_payment_intent_id: orderData.stripePaymentIntentId || null,
        product_id: item.id.toString(),
        unit: 'tons',
        unit_price: item.price,
        total_price: item.price * quantity,
        quantity: quantity,
        status: 'confirmed',
        delivery_name: contactInfo.name,
        delivery_phone: contactInfo.phone,
        delivery_email: contactInfo.email,
        billing_name: contactInfo.name,
        billing_email: contactInfo.email,
        delivery_date: deliveryDate,
        delivery_street: deliveryAddress.street,
        delivery_city: deliveryAddress.city,
        delivery_state: deliveryAddress.state,
        delivery_zip: deliveryAddress.zip,
        delivery_time_preference: deliveryTimePreference,
        delivery_instructions: deliveryInstructions
      };

      console.log('Generated order record:', record);
      return record;
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
