
/**
 * Apply ZIP code pricing adjustment to a base price
 * @param basePrice The base price to adjust
 * @param adjustment The adjustment factor (e.g., 1.2 for 20% increase)
 * @returns The adjusted price
 */
export function applyZipCodeAdjustment(basePrice: number, adjustment: number): number {
  // Apply the adjustment directly as a multiplier (e.g., 1.2 for +20%)
  // If no adjustment or invalid adjustment, return the original price
  if (!adjustment || isNaN(adjustment)) {
    return basePrice;
  }
  
  // Calculate the adjusted price and round to 2 decimal places
  const adjustedPrice = basePrice * adjustment;
  return Math.round(adjustedPrice * 100) / 100;
}
