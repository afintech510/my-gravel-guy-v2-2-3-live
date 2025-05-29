
import { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { getPriceAdjustmentForZipCode } from '@/services/products/pricingUtils';
import { calculateProductExponentialPrice } from '@/services/products/exponentialPricing';

/**
 * Component that listens for ZIP code changes and updates cart pricing
 */
export const CartPricingUpdater = () => {
  const { items, updateItemPrice } = useCart();
  const { zipCode } = useZipCode();

  useEffect(() => {
    if (!zipCode || items.length === 0) return;

    console.log('[CartPricingUpdater] ZIP code changed to:', zipCode);
    console.log('[CartPricingUpdater] Updating pricing for', items.length, 'cart items');

    const updatePricing = async () => {
      try {
        // Get ZIP code adjustment
        const zipAdjustment = await getPriceAdjustmentForZipCode(zipCode);
        console.log('[CartPricingUpdater] ZIP adjustment factor:', zipAdjustment);

        // Update pricing for each cart item
        items.forEach((item) => {
          // Calculate exponential pricing
          const exponentialResult = calculateProductExponentialPrice(item, item.tons);
          
          // Apply ZIP adjustment
          const newPricePerTon = Math.round(exponentialResult.pricePerTon * zipAdjustment * 100) / 100;
          
          if (newPricePerTon !== item.price) {
            console.log(`[CartPricingUpdater] Updating ${item.name}: $${item.price} → $${newPricePerTon}`);
            updateItemPrice(item.id, newPricePerTon);
          }
        });
      } catch (error) {
        console.error('[CartPricingUpdater] Error updating cart pricing:', error);
      }
    };

    updatePricing();
  }, [zipCode, items, updateItemPrice]);

  return null; // This component doesn't render anything
};
