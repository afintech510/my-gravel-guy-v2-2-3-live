
import { supabase } from '@/integrations/supabase/client';
import { Product, PriceTier } from './types';
import { getPriceAdjustmentForZipCode } from './zipCodeQueries';

/**
 * Fetch price tiers for a specific product
 */
export async function getPriceTiersForProduct(productId: string | number): Promise<PriceTier[]> {
  try {
    const { data, error } = await supabase
      .from('price_tiers')
      .select('*')
      .contains('product_id', [productId.toString()])
      .order('min_tons', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Error fetching price tiers:", error);
    return [];
  }
}

/**
 * Get the appropriate multiplier for a given quantity of tons
 */
export async function getPriceMultiplierForQuantity(productId: string | number, tons: number): Promise<number> {
  try {
    const tiers = await getPriceTiersForProduct(productId);
    
    // If no tiers, use multiplier of 1 (no change)
    if (!tiers.length) return 1;
    
    // Find the appropriate tier
    const tier = tiers.find(t => {
      // If tier has max_tons, check if tons is in range
      if (t.max_tons !== null && t.max_tons !== undefined) {
        return tons >= t.min_tons && tons <= t.max_tons;
      }
      // If no max_tons, this is for "tons >= min_tons"
      return tons >= t.min_tons;
    });
    
    // Return the multiplier from the matching tier, or 1 if no tier found
    return tier ? tier.multiplier : 1;
  } catch (error) {
    console.error("Error getting price multiplier:", error);
    return 1; // Default multiplier if there's an error
  }
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
  try {
    // Get the appropriate multiplier for the quantity
    const multiplier = await getPriceMultiplierForQuantity(product.id, tons);
    
    // Get ZIP code adjustment if applicable - now as a direct multiplier (e.g., 1.2 for +20%)
    let zipAdjustment = 1; // Default to 1 (no adjustment)
    if (zipCode) {
      zipAdjustment = await getPriceAdjustmentForZipCode(zipCode);
    }
    
    // Apply the multiplier to the base price
    const baseWithMultiplier = product.price * multiplier;
    
    // Apply ZIP code adjustment as a direct multiplier
    const pricePerTon = Math.round(baseWithMultiplier * zipAdjustment * 100) / 100;
    
    // Calculate the total price
    const finalPrice = Math.round(pricePerTon * tons * 100) / 100;
    
    return {
      basePrice: product.price,
      multiplier,
      zipAdjustment,
      finalPrice,
      pricePerTon
    };
  } catch (error) {
    console.error("Error calculating final price:", error);
    // Return default values in case of error
    return {
      basePrice: product.price,
      multiplier: 1,
      zipAdjustment: 1,
      finalPrice: product.price * tons,
      pricePerTon: product.price
    };
  }
}
