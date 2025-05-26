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
  if (!tiers.length) {
    console.log(`[pricingUtils] No price tiers provided, using default multiplier: 1`);
    return 1;
  }
  
  console.log(`[pricingUtils] Finding price multiplier for ${tons} tons from ${tiers.length} tiers`);
  
  // Sort tiers by min_tons to ensure we check in ascending order
  const sortedTiers = [...tiers].sort((a, b) => a.min_tons - b.min_tons);
  
  // Find the appropriate tier
  const tier = sortedTiers.find(t => {
    // If tier has max_tons, check if tons is in range
    if (t.max_tons !== null && t.max_tons !== undefined) {
      const isInRange = tons >= t.min_tons && tons <= t.max_tons;
      console.log(`[pricingUtils] Checking tier min: ${t.min_tons}, max: ${t.max_tons}, multiplier: ${t.multiplier}, tons: ${tons}, in range: ${isInRange}`);
      return isInRange;
    }
    
    // If no max_tons, this is for "tons >= min_tons"
    const meetsMinimum = tons >= t.min_tons;
    console.log(`[pricingUtils] Checking tier min: ${t.min_tons}, no max, multiplier: ${t.multiplier}, tons: ${tons}, meets minimum: ${meetsMinimum}`);
    return meetsMinimum;
  });
  
  // If we found a tier, use its multiplier
  if (tier) {
    console.log(`[pricingUtils] Found matching tier:`, tier);
    console.log(`[pricingUtils] Using multiplier: ${tier.multiplier}`);
    return tier.multiplier;
  }
  
  // If no tier found and quantity is below the minimum tier, use the highest multiplier (surcharge for small orders)
  if (tons < sortedTiers[0].min_tons) {
    const smallestTier = sortedTiers[0];
    console.log(`[pricingUtils] Quantity ${tons} is below minimum tier ${smallestTier.min_tons}, applying surcharge multiplier: ${smallestTier.multiplier}`);
    return smallestTier.multiplier;
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
    console.log(`[pricingUtils] Calculating final price for ${product.name}, ${tons} tons, ZIP: ${zipCode || 'none'}`);
    
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
    // If multiplier > 1, it's a surcharge for small quantities
    // If multiplier < 1, it's a discount for large quantities
    const priceWithTierAdjustment = product.price * multiplier;
    
    // 5. Apply ZIP code adjustment
    const pricePerTon = Math.round(priceWithTierAdjustment * zipAdjustment * 100) / 100;
    
    // 6. Calculate the total price
    const finalPrice = Math.round(pricePerTon * tons * 100) / 100;
    
    console.log(`[pricingUtils] Price calculation:
      Base price: $${product.price}
      Tier multiplier: ${multiplier} ${multiplier !== 1 ? `(${(multiplier > 1 ? '+' : '') + ((multiplier - 1) * 100).toFixed(0)}%)` : ''}
      After tier adjustment: $${priceWithTierAdjustment}
      ZIP adjustment: ${zipAdjustment} ${zipAdjustment !== 1 ? `(${(zipAdjustment > 1 ? '+' : '') + ((zipAdjustment - 1) * 100).toFixed(0)}%)` : ''}
      Final price per ton: $${pricePerTon}
      Total for ${tons} tons: $${finalPrice}`);
    
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
