
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
  productPrice: number
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
    // Calculate tons but don't round here, let the component decide how to display
    return +(cubicYards * 1.5).toFixed(1);
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
