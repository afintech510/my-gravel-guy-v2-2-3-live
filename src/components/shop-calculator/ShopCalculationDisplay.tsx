
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { MaterialCategory, MaterialSize } from './ShopCalculator';
import { Product } from '@/services/productTypes';

interface ShopCalculationDisplayProps {
  areas: Array<{ length: number; width: number }>;
  depth: number;
  extraPercentage: number;
  product: Product | null;
  materialCategory: MaterialCategory;
  materialSize: MaterialSize;
}

const ShopCalculationDisplay: React.FC<ShopCalculationDisplayProps> = ({
  areas,
  depth,
  extraPercentage,
  product,
  materialCategory,
  materialSize
}) => {
  // State for calculations
  const [totalArea, setTotalArea] = useState(0);
  const [totalCubicYards, setTotalCubicYards] = useState(0);
  const [totalTons, setTotalTons] = useState(0);

  // Helper functions for calculations
  const calculateTotalArea = (areas: Array<{ length: number; width: number }>): number => {
    return areas.reduce((sum, area) => sum + (area.length * area.width), 0);
  };

  const calculateCubicYards = (squareFeet: number, depthInches: number): number => {
    // Formula: (square feet * depth in inches) / 324
    return (squareFeet * depthInches) / 324;
  };

  const calculateTons = (cubicYards: number, tonYardRatio: number): number => {
    // Convert cubic yards to tons using the ton-yard ratio
    return cubicYards * tonYardRatio;
  };

  // Perform calculations when inputs change
  useEffect(() => {
    const area = calculateTotalArea(areas);
    setTotalArea(area);
    
    const cubicYards = calculateCubicYards(area, depth);
    const cubicYardsWithExtra = cubicYards * (1 + extraPercentage / 100);
    setTotalCubicYards(cubicYardsWithExtra);
    
    // Use the product's tonYardRatio if available, otherwise use category-based defaults
    let tonYardRatio = 1.5; // Default ratio
    
    if (product?.tonYardRatio) {
      tonYardRatio = product.tonYardRatio;
    } else {
      // Fallback category-based defaults if no product is selected
      switch (materialCategory) {
        case 'gravel':
          tonYardRatio = 1.5;
          break;
        case 'sand':
          tonYardRatio = 1.3;
          break;
        case 'dirt':
          tonYardRatio = 1.1;
          break;
        case 'mulch':
          tonYardRatio = 0.5; // Mulch is lighter
          break;
        case 'base':
          tonYardRatio = 1.7; // Base is heavier
          break;
        default:
          tonYardRatio = 1.5;
      }
    }
    
    console.log(`ShopCalculationDisplay: Using tonYardRatio: ${tonYardRatio} for ${product?.name || materialCategory}`);
    const tons = calculateTons(cubicYardsWithExtra, tonYardRatio);
    setTotalTons(tons);
  }, [areas, depth, extraPercentage, product, materialCategory]);

  return (
    <Card className="border-2 border-primary/20 shadow-md">
      <div className="p-6">
        <h3 className="text-lg font-bold mb-4">Calculation Results</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Area</p>
            <p className="text-xl font-semibold">{totalArea.toFixed(1)} sq ft</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Volume</p>
            <p className="text-xl font-semibold">{totalCubicYards.toFixed(1)} cu yds</p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground">Weight</p>
            <p className="text-2xl font-bold text-primary">{Math.ceil(totalTons)} tons</p>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="text-sm text-muted-foreground mb-2">Selected Material</div>
          <div className="p-3 bg-gray-50 rounded-md">
            {product ? (
              <p className="font-medium">
                {product.name} {materialSize && `(${materialSize})`}
              </p>
            ) : (
              <p className="font-medium">
                {materialCategory.charAt(0).toUpperCase() + materialCategory.slice(1)} {materialSize && `(${materialSize})`}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ShopCalculationDisplay;
