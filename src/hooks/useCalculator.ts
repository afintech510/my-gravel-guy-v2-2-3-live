
interface CalculationResult {
  totalSquareFeet: number;
  totalCubicYards: number;
  totalTons: number;
  estimatedCost: number;
  discountedCost: number;
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
  manualTons?: number // Manual tons parameter
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
    // Ensure we're using exact tons for pricing, without rounding
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

  // Calculate costs based on exact tons (rounding only happens in UI)
  const estimatedCost = calculateEstimatedCost(totalTons);
  const discountedCost = +(estimatedCost - 50).toFixed(2);

  return {
    totalSquareFeet,
    totalCubicYards,
    totalTons,
    estimatedCost,
    discountedCost
  };
};
