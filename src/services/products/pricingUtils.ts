
import { supabase } from '@/integrations/supabase/client';
import { Product, PriceTier } from './types';
import { applyZipCodeAdjustment } from './priceUtils';

/**
 * Fetch price tiers for a specific product from the database
 * @param productId The product ID to fetch tiers for
 */
export async function getPriceTiersForProduct(productId: string | number): Promise<PriceTier[]> {
  try {
    console.log(`[pricingUtils] Fetching price tiers for product ID: ${productId}`);
    
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
    
    // Query the zip_code_pricing table
    const { data, error } = await supabase
      .from('zip_code_pricing')
      .select('adjustment')
      .eq('zip_code', zipCode)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No adjustment found for this ZIP code
        console.log(`[pricingUtils] No specific adjustment found for ZIP: ${zipCode}, using default multiplier: 1`);
        return 1;
      }
      console.error(`[pricingUtils] Error fetching ZIP price adjustment:`, error);
      return 1;
    }
    
    if (!data || typeof data.adjustment !== 'number') {
      console.log(`[pricingUtils] Invalid adjustment data for ZIP: ${zipCode}, using default multiplier: 1`);
      return 1;
    }
    
    // Convert percentage format to multiplier (e.g., 20% -> 1.2, -10% -> 0.9)
    const adjustmentMultiplier = 1 + (data.adjustment / 100);
    console.log(`[pricingUtils] ZIP ${zipCode} has adjustment of ${data.adjustment}%, multiplier: ${adjustmentMultiplier}`);
    
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
 * @returns The appropriate multiplier from the matching tier, or 1 if no tier matches
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
  
  // Return the multiplier from the matching tier, or 1 if no tier found
  const finalMultiplier = tier ? tier.multiplier : 1;
  console.log(`[pricingUtils] Selected tier:`, tier);
  console.log(`[pricingUtils] Final multiplier: ${finalMultiplier}`);
  
  return finalMultiplier;
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
    
    // 4. Apply the multiplier to the base price
    const baseWithMultiplier = product.price * multiplier;
    
    // 5. Apply ZIP code adjustment
    const pricePerTon = Math.round(baseWithMultiplier * zipAdjustment * 100) / 100;
    
    // 6. Calculate the total price
    const finalPrice = Math.round(pricePerTon * tons * 100) / 100;
    
    console.log(`[pricingUtils] Price calculation:
      Base price: $${product.price}
      Volume multiplier: ${multiplier} (${(multiplier > 1 ? '+' : '') + ((multiplier - 1) * 100).toFixed(0)}%)
      After volume adjustment: $${baseWithMultiplier}
      ZIP adjustment: ${zipAdjustment} (${(zipAdjustment > 1 ? '+' : '') + ((zipAdjustment - 1) * 100).toFixed(0)}%)
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
