
import { Product, PriceTier } from './types';
import { 
  getPriceTiersForProduct as fetchPriceTiers,
  findPriceMultiplierForQuantity,
  getPriceAdjustmentForZipCode as fetchZipAdjustment,
  calculateFinalPrice as calculatePrice
} from './pricingUtils';

/**
 * Re-export the pricing utility functions with wrappers to maintain backward compatibility
 */
export async function getPriceTiersForProduct(productId: string | number): Promise<PriceTier[]> {
  return fetchPriceTiers(productId);
}

/**
 * Get the appropriate multiplier for a given quantity of tons
 */
export async function getPriceMultiplierForQuantity(productId: string | number, tons: number): Promise<number> {
  const tiers = await fetchPriceTiers(productId);
  return findPriceMultiplierForQuantity(tiers, tons);
}

/**
 * Get price adjustment for a specific ZIP code
 */
export async function getPriceAdjustmentForZipCode(zipCode: string): Promise<number> {
  return fetchZipAdjustment(zipCode);
}

/**
 * Calculate final price based on base price, quantity, multiplier, and ZIP code adjustment
 */
export async function calculateFinalPrice(
  product: Product, 
  tons: number, 
  zipCode?: string
): Promise<{ 
  basePrice: number, 
  multiplier: number, 
  zipAdjustment: number,
  finalPrice: number,
  pricePerTon: number
}> {
  return calculatePrice(product, tons, zipCode);
}
