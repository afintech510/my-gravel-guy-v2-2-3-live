
import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/contexts/CartContext';

export interface CartInsertData {
  items: CartItem[];
}

export const insertCartToDatabase = async (cartData: CartInsertData) => {
  console.log('=== INSERTING CART TO DATABASE ===', {
    itemsCount: cartData.items.length
  });

  try {
    if (!cartData.items || cartData.items.length === 0) {
      throw new Error('No items provided for cart database insert');
    }

    const cartId = `CART-${Date.now()}`;
    console.log('Generated cart ID:', cartId);

    // Process each item for database insertion
    const cartRecords = cartData.items.map((item, index) => {
      console.log('Processing cart item for DB insert:', {
        itemIndex: index,
        id: item.id,
        name: item.name,
        hasContactInfo: !!item.contactInfo,
        hasDeliveryAddress: !!item.deliveryAddress,
        hasDeliveryDate: !!item.deliveryDate
      });

      const contactInfo = item.contactInfo || { name: null, phone: null, email: null };
      const deliveryAddress = item.deliveryAddress || { street: null, city: null, state: null, zip: null };
      const quantity = item.tons || 1;

      // Calculate pricing with coupon consideration
      const basePrice = (item.price || 0) * quantity;
      const couponDiscount = item.couponApplied && item.couponAmount ? item.couponAmount : 0;
      const finalPrice = basePrice - couponDiscount;

      const record = {
        order_id: cartId,
        stripe_session_id: `cart_session_${cartId}_${index}`,
        stripe_payment_intent_id: null,
        product_id: item.id.toString(),
        unit: 'tons',
        unit_price: item.price || 0,
        total_price: finalPrice, // Store the discounted price
        quantity: quantity,
        status: 'cart',
        delivery_name: contactInfo.name || null,
        delivery_phone: contactInfo.phone || null,
        delivery_email: contactInfo.email || null,
        billing_name: contactInfo.name || null,
        billing_email: contactInfo.email || null,
        delivery_date: item.deliveryDate ? item.deliveryDate.toISOString().split('T')[0] : null,
        delivery_street: deliveryAddress.street || null,
        delivery_city: deliveryAddress.city || null,
        delivery_state: deliveryAddress.state || null,
        delivery_zip: deliveryAddress.zip || null,
        delivery_time_preference: item.deliveryTimePreference || null,
        delivery_instructions: item.deliveryInstructions || null,
        coupon: item.couponApplied ? 'APPLIED' : null // Store coupon status for now
      };

      console.log('Cart record prepared for insert:', {
        order_id: record.order_id,
        product_id: record.product_id,
        delivery_email: record.delivery_email,
        status: record.status
      });

      return record;
    });

    // Insert to database
    const { data, error } = await supabase
      .from('orders')
      .insert(cartRecords)
      .select();

    if (error) {
      console.error('Cart database insert error:', error);
      throw new Error(`Cart database insert failed: ${error.message}`);
    }

    console.log('Successfully created cart records:', {
      insertedCount: data?.length || 0,
      cartId: cartId
    });
    
    return { data, cartId };

  } catch (error) {
    console.error('Error in insertCartToDatabase:', error);
    throw error;
  }
};
