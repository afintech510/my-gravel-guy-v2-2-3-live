
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
  tonYardRatio: number = 1.5 // Default ratio is 1.5 tons per cubic yard
) => {
  const calculateTotalSquareFeet = (): number => {
    return areas.reduce((total, area) => total + (area.length * area.width), 0);
  };

  const calculateCubicYards = (squareFeet: number): number => {
    const cubicFeet = (squareFeet * depth) / 12;
    const baseYards = cubicFeet / 27;
    return +(baseYards * (1 + extraPercentage / 100)).toFixed(2);
  };

  const calculateTotalTons = (cubicYards: number): number => {
    // Calculate tons using the provided ratio, defaulting to 1.5
    return +(cubicYards * tonYardRatio).toFixed(1);
  };

  const calculateEstimatedCost = (tons: number): number => {
    return +(tons * productPrice).toFixed(2);
  };

  const totalSquareFeet = calculateTotalSquareFeet();
  const totalCubicYards = calculateCubicYards(totalSquareFeet);
  const totalTons = calculateTotalTons(totalCubicYards);
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
