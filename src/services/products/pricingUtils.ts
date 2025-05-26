
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
    console.log(`[pricingUtils] Fetching price tiers for product ID: ${productId}`);
    
    // Check cache first
    const cacheKey = productId.toString();
    if (priceTierCache.has(cacheKey)) {
      console.log(`[pricingUtils] Using cached price tiers for product ID: ${productId}`);
      return priceTierCache.get(cacheKey) || [];
    }
    
    // Convert productId to string for consistent comparison
    const productIdString = productId.toString();
    
    const { data, error } = await supabase
      .from('price_tiers')
      .select('*')
      .contains('product_id', [productIdString]);
    
    if (error) {
      console.error(`[pricingUtils] Error fetching price tiers:`, error);
      throw error;
    }
    
    console.log(`[pricingUtils] Found ${data?.length || 0} price tiers for product ${productId}:`, data);
    
    // Cache the result
    priceTierCache.set(cacheKey, data || []);
    
    return data || [];
  } catch (error) {
    console.error("[pricingUtils] Error fetching price tiers:", error);
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
    console.log(`[pricingUtils] Getting price adjustment for ZIP code: ${zipCode}`);
    
    // Check cache first
    if (zipCodeAdjustmentCache.has(zipCode)) {
      console.log(`[pricingUtils] Using cached adjustment for ZIP: ${zipCode}`);
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
        console.log(`[pricingUtils] No specific adjustment found for ZIP: ${zipCode}, using default multiplier: 1`);
        return 1;
      }
      console.error(`[pricingUtils] Error fetching ZIP price adjustment:`, error);
      return 1; // Default to no adjustment on error
    }
    
    if (!data || typeof data.price_adjustment !== 'number') {
      console.log(`[pricingUtils] Invalid adjustment data for ZIP: ${zipCode}, using default multiplier: 1`);
      return 1;
    }
    
    // Use price_adjustment, not adjustment
    const adjustmentMultiplier = data.price_adjustment;
    console.log(`[pricingUtils] ZIP ${zipCode} has adjustment multiplier: ${adjustmentMultiplier}`);
    
    // Cache the result
    zipCodeAdjustmentCache.set(zipCode, adjustmentMultiplier);
    
    return adjustmentMultiplier;
  } catch (error) {
    console.error("[pricingUtils] Error getting ZIP code price adjustment:", error);
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
  console.log(`[pricingUtils] ======= DEBUGGING TIER MATCHING =======`);
  console.log(`[pricingUtils] Looking for tier for ${tons} tons`);
  console.log(`[pricingUtils] Available tiers:`, JSON.stringify(tiers, null, 2));
  
  if (!tiers.length) {
    console.log(`[pricingUtils] No price tiers provided, using default multiplier: 1`);
    return 1;
  }
  
  // Sort tiers by min_tons to ensure we check in ascending order
  const sortedTiers = [...tiers].sort((a, b) => a.min_tons - b.min_tons);
  console.log(`[pricingUtils] Sorted tiers by min_tons:`, JSON.stringify(sortedTiers, null, 2));
  
  // Find the appropriate tier - we need to find the tier where tons fits within the range
  let matchingTier = null;
  
  for (const tier of sortedTiers) {
    console.log(`[pricingUtils] Checking tier: min=${tier.min_tons}, max=${tier.max_tons}, multiplier=${tier.multiplier}`);
    
    // If tier has max_tons, check if tons is in range [min_tons, max_tons]
    if (tier.max_tons !== null && tier.max_tons !== undefined) {
      const isInRange = tons >= tier.min_tons && tons <= tier.max_tons;
      console.log(`[pricingUtils] Range tier: ${tons} >= ${tier.min_tons} && ${tons} <= ${tier.max_tons} = ${isInRange}`);
      if (isInRange) {
        matchingTier = tier;
        break;
      }
    } else {
      // If no max_tons, this tier applies to "tons >= min_tons"
      // But we should only use this if no other tier with a max applies
      const meetsMinimum = tons >= tier.min_tons;
      console.log(`[pricingUtils] Open-ended tier: ${tons} >= ${tier.min_tons} = ${meetsMinimum}`);
      if (meetsMinimum && !matchingTier) {
        matchingTier = tier;
        // Don't break here - continue to see if there's a more specific tier
      }
    }
  }
  
  // If we found a matching tier, use its multiplier
  if (matchingTier) {
    console.log(`[pricingUtils] FOUND MATCHING TIER:`, matchingTier);
    console.log(`[pricingUtils] Using multiplier: ${matchingTier.multiplier}`);
    return matchingTier.multiplier;
  }
  
  // If no tier found and quantity is below the minimum tier, use 1 (no surcharge)
  if (tons < sortedTiers[0].min_tons) {
    console.log(`[pricingUtils] Quantity ${tons} is below minimum tier ${sortedTiers[0].min_tons}, using base price multiplier: 1`);
    return 1;
  }
  
  // Default to no adjustment if no tier matches
  console.log(`[pricingUtils] No tier found, using default multiplier: 1`);
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
    console.log(`[pricingUtils] ======= CALCULATING FINAL PRICE =======`);
    console.log(`[pricingUtils] Product: ${product.name} (ID: ${product.id})`);
    console.log(`[pricingUtils] Base price: $${product.price}`);
    console.log(`[pricingUtils] Quantity: ${tons} tons`);
    console.log(`[pricingUtils] ZIP code: ${zipCode || 'none'}`);
    
    // 1. Get price tiers for this product
    const priceTiers = await getPriceTiersForProduct(product.id);
    console.log(`[pricingUtils] Retrieved ${priceTiers.length} price tiers`);
    
    // 2. Find the appropriate multiplier for the quantity
    const multiplier = findPriceMultiplierForQuantity(priceTiers, tons);
    console.log(`[pricingUtils] Tier multiplier: ${multiplier}`);
    
    // 3. Get ZIP code adjustment if applicable
    let zipAdjustment = 1; // Default to no adjustment
    if (zipCode) {
      zipAdjustment = await getPriceAdjustmentForZipCode(zipCode);
    }
    console.log(`[pricingUtils] ZIP adjustment: ${zipAdjustment}`);
    
    // 4. Calculate price per ton with tier adjustment
    const priceWithTierAdjustment = product.price * multiplier;
    console.log(`[pricingUtils] Price after tier adjustment: $${product.price} * ${multiplier} = $${priceWithTierAdjustment}`);
    
    // 5. Apply ZIP code adjustment
    const pricePerTon = Math.round(priceWithTierAdjustment * zipAdjustment * 100) / 100;
    console.log(`[pricingUtils] Price per ton after ZIP adjustment: $${priceWithTierAdjustment} * ${zipAdjustment} = $${pricePerTon}`);
    
    // 6. Calculate the total price
    const finalPrice = Math.round(pricePerTon * tons * 100) / 100;
    console.log(`[pricingUtils] Final total price: $${pricePerTon} * ${tons} = $${finalPrice}`);
    
    console.log(`[pricingUtils] ======= PRICE CALCULATION SUMMARY =======`);
    console.log(`[pricingUtils] Expected for 10 tons Driveway Gravel to 11967: $900`);
    console.log(`[pricingUtils] Actual result: $${finalPrice}`);
    console.log(`[pricingUtils] =======================================`);
    
    return {
      basePrice: product.price,
      multiplier,
      zipAdjustment,
      finalPrice,
      pricePerTon
    };
  } catch (error) {
    console.error("[pricingUtils] Error calculating final price:", error);
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
  console.log("[pricingUtils] Pricing cache cleared");
}
