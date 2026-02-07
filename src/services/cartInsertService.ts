
import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/contexts/CartContext';
import { createLeadFromForm, findLeadByEmailOrPhone, updateLead } from './supplierQuoteService';

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

      // Calculate base pricing
      const basePrice = (item.price || 0) * quantity;
      const finalPrice = basePrice;

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
        coupon: null // Coupon is now handled at cart level
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

    // Create or update lead from cart data (for supplier quotes system)
    const firstItem = cartData.items[0];
    if (firstItem?.contactInfo?.name) {
      try {
        const productNames = cartData.items.map(item => item.name).join(', ');
        const totalTons = cartData.items.reduce((sum, item) => sum + (item.tons || 0), 0);
        const firstAddress = cartData.items.find(item => item.deliveryAddress);
        
        // Prepare delivery scheduling data
        const deliveryDate = firstItem.deliveryDate?.toISOString().split('T')[0];
        const deliveryTimePreference = firstItem.deliveryTimePreference;
        const deliveryInstructions = firstItem.deliveryInstructions;
        
        console.log('=== LEAD UPSERT: Checking for existing lead ===', {
          email: firstItem.contactInfo.email,
          phone: firstItem.contactInfo.phone,
          deliveryDate,
          deliveryTimePreference,
          deliveryInstructions,
        });
        
        // Check if a lead already exists with this email or phone
        const existingLead = await findLeadByEmailOrPhone(
          firstItem.contactInfo.email,
          firstItem.contactInfo.phone
        );
        
        if (existingLead) {
          // Update existing lead with delivery scheduling data
          console.log('=== LEAD UPSERT: Found existing lead, updating ===', {
            leadId: existingLead.id,
            existingName: existingLead.display_name,
          });
          
          await updateLead(existingLead.id, {
            material: productNames,
            requested_qty: totalTons,
            requested_unit: 'tons',
            job_address: firstAddress?.deliveryAddress?.street || existingLead.job_address,
            job_city: firstAddress?.deliveryAddress?.city || existingLead.job_city,
            job_state: firstAddress?.deliveryAddress?.state || existingLead.job_state,
            job_zip: firstAddress?.deliveryAddress?.zip || existingLead.job_zip,
            delivery_date: deliveryDate,
            delivery_time_preference: deliveryTimePreference,
            delivery_instructions: deliveryInstructions,
            notes: existingLead.notes 
              ? `${existingLead.notes}\nCart saved: ${cartId}` 
              : `Cart saved: ${cartId}`,
          });
          
          console.log('=== LEAD UPSERT: Successfully updated existing lead ===', {
            leadId: existingLead.id,
            deliveryDate,
            deliveryTimePreference,
          });
        } else {
          // Create new lead
          console.log('=== LEAD UPSERT: No existing lead found, creating new ===');
          
          await createLeadFromForm({
            displayName: firstItem.contactInfo.name,
            email: firstItem.contactInfo.email,
            phone: firstItem.contactInfo.phone,
            material: productNames,
            requestedQty: totalTons,
            requestedUnit: 'tons',
            jobAddress: firstAddress?.deliveryAddress?.street,
            jobCity: firstAddress?.deliveryAddress?.city,
            jobState: firstAddress?.deliveryAddress?.state,
            jobZip: firstAddress?.deliveryAddress?.zip,
            deliveryDate,
            deliveryTimePreference,
            deliveryInstructions,
            notes: `Cart saved: ${cartId}`,
          });
          
          console.log('=== LEAD UPSERT: Successfully created new lead ===', {
            email: firstItem.contactInfo.email,
            deliveryDate,
            deliveryTimePreference,
          });
        }
      } catch (leadErr) {
        console.warn('Failed to upsert lead from cart (non-blocking):', leadErr);
      }
    }
    
    return { data, cartId };

  } catch (error) {
    console.error('Error in insertCartToDatabase:', error);
    throw error;
  }
};
