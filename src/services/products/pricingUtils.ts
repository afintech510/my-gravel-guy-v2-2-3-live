
import { supabase } from '@/integrations/supabase/client';
import { Product, PriceTier } from './types';
import { applyZipCodeAdjustment } from './priceUtils';

// Cache for pricing tiers to avoid repeated database calls
const priceTierCache = new Map<string, PriceTier[]>();
const zipCodeAdjustmentCache = new Map<string, number>();

/**
 * Fetch price tiers for a specific product from the database
 * @param productId The product ID to fetch tiers for
 */
export async function getPriceTiersForProduct(productId: string | number): Promise<PriceTier[]> {
  try {
    // Check cache first
    const cacheKey = productId.toString();
    if (priceTierCache.has(cacheKey)) {
      return priceTierCache.get(cacheKey) || [];
    }
    
    // Convert productId to string for consistent comparison
    const productIdString = productId.toString();
    
    const { data, error } = await supabase
      .from('price_tiers')
      .select('*')
      .contains('product_id', [productIdString]);
    
    if (error) {
      console.error(`Error fetching price tiers for product ${productId}:`, error);
      throw error;
    }
    
    // Cache the result
    priceTierCache.set(cacheKey, data || []);
    
    return data || [];
  } catch (error) {
    console.error("Error fetching price tiers:", error);
    return [];
  }
}

/**
 * Get price adjustment for a specific ZIP code from the database
 * @param zipCode The ZIP code to check for price adjustments
 * @returns A multiplier (e.g., 1.2 for +20% adjustment)
 */
export async function getPriceAdjustmentForZipCode(zipCode: string): Promise<number> {
  try {
    // Check cache first
    if (zipCodeAdjustmentCache.has(zipCode)) {
      return zipCodeAdjustmentCache.get(zipCode) || 1;
    }
    
    // Query the service_zip_codes table (not zip_code_pricing)
    const { data, error } = await supabase
      .from('service_zip_codes')
      .select('price_adjustment')
      .eq('zip', zipCode)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No adjustment found for this ZIP code
        return 1;
      }
      console.error(`Error fetching ZIP price adjustment:`, error);
      return 1; // Default to no adjustment on error
    }
    
    if (!data || typeof data.price_adjustment !== 'number') {
      return 1;
    }
    
    // Use price_adjustment, not adjustment
    const adjustmentMultiplier = data.price_adjustment;
    
    // Cache the result
    zipCodeAdjustmentCache.set(zipCode, adjustmentMultiplier);
    
    return adjustmentMultiplier;
  } catch (error) {
    console.error("Error getting ZIP code price adjustment:", error);
    return 1; // Default to no adjustment
  }
}

/**
 * Find the appropriate price tier multiplier for a given quantity
 * @param tiers Array of price tiers
 * @param tons Quantity in tons
 * @returns The appropriate multiplier from the matching tier
 */
export function findPriceMultiplierForQuantity(tiers: PriceTier[], tons: number): number {
  if (!tiers.length) {
    return 1;
  }
  
  // Sort tiers by min_tons to ensure we check in ascending order
  const sortedTiers = [...tiers].sort((a, b) => a.min_tons - b.min_tons);
  
  // Find the appropriate tier - we need to find the tier where tons fits within the range
  let matchingTier = null;
  
  for (const tier of sortedTiers) {
    // If tier has max_tons, check if tons is in range [min_tons, max_tons]
    if (tier.max_tons !== null && tier.max_tons !== undefined) {
      const isInRange = tons >= tier.min_tons && tons <= tier.max_tons;
      if (isInRange) {
        matchingTier = tier;
        break;
      }
    } else {
      // If no max_tons, this tier applies to "tons >= min_tons"
      // But we should only use this if no other tier with a max applies
      const meetsMinimum = tons >= tier.min_tons;
      if (meetsMinimum && !matchingTier) {
        matchingTier = tier;
        // Don't break here - continue to see if there's a more specific tier
      }
    }
  }
  
  // If we found a matching tier, use its multiplier
  if (matchingTier) {
    return matchingTier.multiplier;
  }
  
  // If no tier found and quantity is below the minimum tier, use 1 (no surcharge)
  if (tons < sortedTiers[0].min_tons) {
    return 1;
  }
  
  // Default to no adjustment if no tier matches
  return 1;
}

/**
 * Calculate the final price based on all adjustments
 * @param product The product to calculate price for
 * @param tons Quantity in tons
 * @param zipCode Optional ZIP code for location-based adjustments
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
    // 1. Get price tiers for this product
    const priceTiers = await getPriceTiersForProduct(product.id);
    
    // 2. Find the appropriate multiplier for the quantity
    const multiplier = findPriceMultiplierForQuantity(priceTiers, tons);
    
    // 3. Get ZIP code adjustment if applicable
    let zipAdjustment = 1; // Default to no adjustment
    if (zipCode) {
      zipAdjustment = await getPriceAdjustmentForZipCode(zipCode);
    }
    
    // 4. Calculate price per ton with tier adjustment
    const priceWithTierAdjustment = product.price * multiplier;
    
    // 5. Apply ZIP code adjustment
    const pricePerTon = Math.round(priceWithTierAdjustment * zipAdjustment * 100) / 100;
    
    // 6. Calculate the total price
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

// Method to clear cache (useful for testing or when data is known to have changed)
export function clearPricingCache() {
  priceTierCache.clear();
  zipCodeAdjustmentCache.clear();
}
