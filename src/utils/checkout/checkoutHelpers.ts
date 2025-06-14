
import { CartItem } from "../../contexts/CartContext";

// Transform cart items to a format suitable for Stripe
export const formatCartItemsForStripe = (items: CartItem[]) => {
  return items.map(item => {
    const itemTotal = item.price * item.tons;
    const couponDiscount = item.couponApplied && item.couponAmount ? item.couponAmount : 0;
    const discountedTotal = itemTotal - couponDiscount;
    const discountedPricePerTon = discountedTotal / item.tons;

    let metadata = {};
    
    if (item.deliveryAddress) {
      metadata = {
        deliveryDate: item.deliveryDate ? item.deliveryDate.toISOString() : undefined,
        deliveryAddress: item.deliveryAddress ? JSON.stringify(item.deliveryAddress) : undefined,
        contactPhone: item.contactPhone,
        deliveryTimePreference: item.deliveryTimePreference,
        deliveryInstructions: item.deliveryInstructions
      };
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description?.substring(0, 100) || '',
      price: Math.max(0.01, discountedPricePerTon),
      quantity: item.tons,
      image: item.image || item.images?.[0],
      metadata
    };
  });
};

// Validate cart items before checkout
export const validateCartItems = (items: CartItem[]) => {
  if (!items || items.length === 0) {
    throw new Error('Cart is empty');
  }

  const itemsWithoutDelivery = items.filter(item => 
    !item.deliveryAddress || !item.contactInfo || !item.deliveryDate
  );
  
  if (itemsWithoutDelivery.length > 0) {
    throw new Error('Some items are missing required delivery information. Please complete all delivery forms.');
  }
};
