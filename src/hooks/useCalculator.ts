
import { PriceTier } from '../services/productTypes';
import { getMultiplierForTons } from '../services/productService';

interface CalculationResult {
  totalSquareFeet: number;
  totalCubicYards: number;
  totalTons: number;
  estimatedCost: number;
  discountedCost: number;
  appliedMultiplier?: number;
  appliedTier?: PriceTier;
  originalCost?: number; // Cost without tier discount
  savings?: number; // Amount saved with tier discount
}

interface AreaInput {
  length: number;
  width: number;
}

export const useCalculator = (
  areas: AreaInput[],
  depth: number,
  extraPercentage: number,
  productPrice: number,
  tonYardRatio: number = 1.5, // Default ratio is 1.5 tons per cubic yard
  manualTons?: number, // Manual tons parameter
  priceTiers?: PriceTier[] // Optional parameter for price tiers
) => {
  const calculateTotalSquareFeet = (): number => {
    return areas.reduce((total, area) => total + (area.length * area.width), 0);
  };

  const calculateCubicYards = (squareFeet: number): number => {
    const cubicFeet = (squareFeet * depth) / 12;
    const baseYards = cubicFeet / 27;
    return +(baseYards * (1 + extraPercentage / 100)).toFixed(2);
  };

  const calculateCubicYardsFromTons = (tons: number): number => {
    // Reverse calculation: cubic yards = tons / tonYardRatio
    return +(tons / tonYardRatio).toFixed(2);
  };

  const calculateTotalTons = (cubicYards: number): number => {
    // Use the provided tonYardRatio for conversion
    return +(cubicYards * tonYardRatio).toFixed(2);
  };

  const calculateEstimatedCost = (tons: number): number => {
    // If we have price tiers, apply the appropriate multiplier
    if (priceTiers && priceTiers.length > 0) {
      const multiplier = getMultiplierForTons(priceTiers, tons);
      // Apply tier-based pricing
      return +(tons * productPrice * multiplier).toFixed(2);
    }
    
    // Traditional pricing if no tiers available
    return +(tons * productPrice).toFixed(2);
  };
  
  const calculateOriginalCost = (tons: number): number => {
    // Cost without any tier discount
    return +(tons * productPrice).toFixed(2);
  };

  const totalSquareFeet = calculateTotalSquareFeet();
  
  // If manual tons is provided, use it and calculate cubic yards from tons
  // Otherwise, calculate cubic yards from area and then get tons from cubic yards
  let totalCubicYards: number;
  let totalTons: number;

  if (manualTons !== undefined) {
    // When manual tons is set, use the exact value provided (may be rounded in UI)
    totalTons = manualTons;
    totalCubicYards = calculateCubicYardsFromTons(totalTons);
  } else {
    // Normal flow: area -> cubic yards -> tons
    totalCubicYards = calculateCubicYards(totalSquareFeet);
    totalTons = calculateTotalTons(totalCubicYards);
  }

  // Get the appropriate multiplier for this quantity
  const appliedMultiplier = priceTiers && priceTiers.length > 0 
    ? getMultiplierForTons(priceTiers, totalTons)
    : 1.0;
  
  // Find which tier was applied (if any)
  const appliedTier = priceTiers?.find(tier => {
    const meetsMinimum = totalTons >= tier.min_tons;
    const belowMaximum = tier.max_tons === null || totalTons <= tier.max_tons;
    return meetsMinimum && belowMaximum;
  });

  // Calculate costs
  const originalCost = calculateOriginalCost(totalTons);
  const estimatedCost = calculateEstimatedCost(totalTons);
  const savings = priceTiers && priceTiers.length > 0 ? +(originalCost - estimatedCost).toFixed(2) : 0;
  
  // Apply fixed discount (for compatibility with existing code)
  const discountedCost = +(estimatedCost - 50).toFixed(2);

  return {
    totalSquareFeet,
    totalCubicYards,
    totalTons,
    estimatedCost,
    discountedCost,
    appliedMultiplier,
    appliedTier,
    originalCost,
    savings
  };
};
