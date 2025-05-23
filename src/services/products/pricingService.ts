
import { supabase } from '@/integrations/supabase/client';
import { Product, PriceTier } from './types';
import { getPriceAdjustmentForZipCode } from './zipCodeQueries';

/**
 * Fetch price tiers for a specific product
 */
export async function getPriceTiersForProduct(productId: string | number): Promise<PriceTier[]> {
  try {
    console.log(`Fetching price tiers for product ID: ${productId} (${typeof productId})`);
    
    // Convert productId to string to ensure consistent comparison
    const productIdString = productId.toString();
    console.log(`Using productIdString: ${productIdString} for query`);
    
    // Fix: Use a proper Supabase query format that works with the TypeScript definitions
    const { data, error } = await supabase
      .from('price_tiers')
      .select('*')
      .filter('product_id', 'eq', productIdString);
    
    if (error) {
      console.error(`Error fetching price tiers:`, error);
      throw error;
    }
    
    console.log(`Found ${data?.length || 0} price tiers for product ${productId}:`, data);
    
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
    console.log(`Getting price multiplier for product ID: ${productId}, tons: ${tons}`);
    const tiers = await getPriceTiersForProduct(productId);
    
    // If no tiers, use multiplier of 1 (no change)
    if (!tiers.length) {
      console.log(`No price tiers found for product ${productId}, using default multiplier: 1`);
      return 1;
    }
    
    console.log(`Searching through ${tiers.length} tiers for appropriate multiplier:`);
    console.table(tiers);
    
    // Find the appropriate tier
    const tier = tiers.find(t => {
      // If tier has max_tons, check if tons is in range
      if (t.max_tons !== null && t.max_tons !== undefined) {
        const isInRange = tons >= t.min_tons && tons <= t.max_tons;
        console.log(`Checking tier min: ${t.min_tons}, max: ${t.max_tons}, multiplier: ${t.multiplier}, tons: ${tons}, in range: ${isInRange}`);
        return isInRange;
      }
      // If no max_tons, this is for "tons >= min_tons"
      const meetsMinimum = tons >= t.min_tons;
      console.log(`Checking tier min: ${t.min_tons}, no max, multiplier: ${t.multiplier}, tons: ${tons}, meets minimum: ${meetsMinimum}`);
      return meetsMinimum;
    });
    
    // Return the multiplier from the matching tier, or 1 if no tier found
    const finalMultiplier = tier ? tier.multiplier : 1;
    console.log(`Selected tier:`, tier);
    console.log(`Final multiplier: ${finalMultiplier}`);
    
    return finalMultiplier;
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
    console.log(`Calculating final price for product:`, product.name, `(ID: ${product.id}), tons: ${tons}, ZIP: ${zipCode || 'none'}`);
    
    // Get the appropriate multiplier for the quantity
    const multiplier = await getPriceMultiplierForQuantity(product.id, tons);
    console.log(`Volume-based price multiplier: ${multiplier}`);
    
    // Get ZIP code adjustment if applicable - now as a direct multiplier (e.g., 1.2 for +20%)
    let zipAdjustment = 1; // Default to 1 (no adjustment)
    if (zipCode) {
      zipAdjustment = await getPriceAdjustmentForZipCode(zipCode);
      console.log(`ZIP code adjustment for ${zipCode}: ${zipAdjustment}`);
    }
    
    // Apply the multiplier to the base price
    const baseWithMultiplier = product.price * multiplier;
    console.log(`Base price: $${product.price}, after volume multiplier: $${baseWithMultiplier}`);
    
    // Apply ZIP code adjustment as a direct multiplier
    const pricePerTon = Math.round(baseWithMultiplier * zipAdjustment * 100) / 100;
    console.log(`After ZIP adjustment: $${pricePerTon} per ton`);
    
    // Calculate the total price
    const finalPrice = Math.round(pricePerTon * tons * 100) / 100;
    console.log(`Final price for ${tons} tons: $${finalPrice}`);
    
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
