
import { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { useProduct } from '@/hooks/useProduct';

/**
 * Custom hook to update cart pricing when ZIP code changes
 */
export const useCartPricing = () => {
  const { items, updateDeliveryDetails } = useCart();
  const { zipCode } = useZipCode();

  useEffect(() => {
    if (!zipCode || items.length === 0) return;

    console.log('[useCartPricing] ZIP code changed to:', zipCode);
    console.log('[useCartPricing] Updating pricing for', items.length, 'cart items');

    // Update pricing for each cart item
    items.forEach((item) => {
      // Use the useProduct hook's pricing logic to get updated price
      const { adjustedPrice } = useProduct(item.slug, zipCode, item.tons);
      
      if (adjustedPrice && adjustedPrice !== item.price) {
        console.log(`[useCartPricing] Updating price for ${item.name} from $${item.price} to $${adjustedPrice}`);
        
        // Update the item's price in the cart
        updateDeliveryDetails(item.id, {
          price: adjustedPrice
        });
      }
    });
  }, [zipCode, items, updateDeliveryDetails]);
};
