
import { useMemo } from 'react';

type AreaInput = {
  length: number;
  width: number;
};

export const useCalculator = (
  areas: AreaInput[],
  depth: number,
  extraPercentage: number,
  pricePerTon: number,
  tonYardRatio: number = 1.5,
  manualTons?: number
) => {
  const calculations = useMemo(() => {
    // Calculate total square feet
    const totalSquareFeet = areas.reduce((sum, area) => {
      return sum + (area.length * area.width);
    }, 0);

    // Calculate cubic yards
    const depthInFeet = depth / 12;
    const cubicFeet = totalSquareFeet * depthInFeet;
    const cubicYards = cubicFeet / 27;

    // Add extra percentage
    const totalCubicYards = cubicYards * (1 + extraPercentage / 100);

    // Calculate tons using ton-yard ratio
    const calculatedTons = totalCubicYards * tonYardRatio;
    const totalTons = manualTons !== undefined ? manualTons : Math.ceil(calculatedTons);

    // Calculate costs
    const estimatedCost = totalTons * pricePerTon;
    const discountedCost = estimatedCost - 50; // $50 discount

    return {
      totalSquareFeet,
      totalCubicYards,
      totalTons,
      estimatedCost,
      discountedCost: Math.max(0, discountedCost)
    };
  }, [areas, depth, extraPercentage, pricePerTon, tonYardRatio, manualTons]);

  return calculations;
};
