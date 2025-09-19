/**
 * Calculate coverage area for a given amount of material
 */
export const calculateCoverage = (tons: number, tonYardRatio: number = 1.5, depthInches: number = 3): number => {
  // Convert tons to cubic yards
  const cubicYards = tons / tonYardRatio;
  
  // Convert cubic yards to cubic feet
  const cubicFeet = cubicYards * 27;
  
  // Convert cubic feet to square feet at specified depth
  const squareFeet = cubicFeet / (depthInches / 12);
  
  return Math.round(squareFeet);
};

/**
 * Format coverage text for display
 */
export const formatCoverageText = (tons: number, tonYardRatio: number = 1.5, depthInches: number = 3): string => {
  const coverage = calculateCoverage(tons, tonYardRatio, depthInches);
  return `Covers ${coverage.toLocaleString()} sq ft at ${depthInches} inches deep`;
};