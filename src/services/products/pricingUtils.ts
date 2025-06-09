
import { supabase } from '@/integrations/supabase/client';
import { Product } from './types';
import { applyZipCodeAdjustment } from './priceUtils';
import { calculateProductExponentialPrice } from './exponentialPricing';

// Cache for ZIP code adjustments to avoid repeated database calls
const zipCodeAdjustmentCache = new Map<string, number>();

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
    
    // Query the service_zip_codes table
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
 * Calculate the final price using exponential pricing model
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
    console.log(`[pricingUtils] ======= CALCULATING EXPONENTIAL PRICE =======`);
    console.log(`[pricingUtils] Product: ${product.name} (ID: ${product.id})`);
    console.log(`[pricingUtils] Base price: $${product.price}`);
    console.log(`[pricingUtils] Quantity: ${tons} tons`);
    console.log(`[pricingUtils] ZIP code: ${zipCode || 'none'}`);
    
    // 1. Calculate exponential pricing
    const exponentialResult = calculateProductExponentialPrice(product, tons);
    console.log(`[pricingUtils] Exponential multiplier: ${exponentialResult.multiplier}`);
    console.log(`[pricingUtils] Price after exponential calculation: $${exponentialResult.pricePerTon}`);
    
    // 2. Get ZIP code adjustment if applicable
    let zipAdjustment = 1; // Default to no adjustment
    if (zipCode) {
      zipAdjustment = await getPriceAdjustmentForZipCode(zipCode);
    }
    console.log(`[pricingUtils] ZIP adjustment: ${zipAdjustment}`);
    
    // 3. Apply ZIP code adjustment to the exponential price
    const pricePerTon = Math.round(exponentialResult.pricePerTon * zipAdjustment * 100) / 100;
    console.log(`[pricingUtils] Final price per ton after ZIP adjustment: $${exponentialResult.pricePerTon} * ${zipAdjustment} = $${pricePerTon}`);
    
    // 4. Calculate the total price
    const finalPrice = Math.round(pricePerTon * tons * 100) / 100;
    console.log(`[pricingUtils] Final total price: $${pricePerTon} * ${tons} = $${finalPrice}`);
    
    console.log(`[pricingUtils] ======= EXPONENTIAL PRICE CALCULATION SUMMARY =======`);
    console.log(`[pricingUtils] Base: $${exponentialResult.basePrice}, Multiplier: ${exponentialResult.multiplier}, ZIP: ${zipAdjustment}`);
    console.log(`[pricingUtils] Result: $${pricePerTon}/ton, Total: $${finalPrice}`);
    console.log(`[pricingUtils] ===============================================`);
    
    return {
      basePrice: product.price,
      multiplier: exponentialResult.multiplier,
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



export function findPriceMultiplierForQuantity(tons: number): number {
  console.log(`[pricingUtils] findPriceMultiplierForQuantity called - now using exponential pricing`);
  return 1; // Default multiplier since we use exponential calculation now
}

// Method to clear cache (useful for testing or when data is known to have changed)
export function clearPricingCache() {
  zipCodeAdjustmentCache.clear();
  console.log("[pricingUtils] Pricing cache cleared");
}
