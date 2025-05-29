
import React from 'react';
import { Card } from '@/components/ui/card';
import { Product } from '@/services/productTypes';
import { calculateProductExponentialPrice } from '@/services/products/exponentialPricing';

interface ShopCalculationDisplayProps {
  cubicYards: number;
  tons: number;
  materialInfo: {
    category: string;
    subcategory: string;
  };
  selectedProduct: Product | null;
}

const ShopCalculationDisplay: React.FC<ShopCalculationDisplayProps> = ({ 
  cubicYards, 
  tons, 
  materialInfo,
  selectedProduct
}) => {
  // Calculate the estimated price range using exponential pricing
  const getEstimatedPriceRange = () => {
    if (!selectedProduct) return "Contact for pricing";
    
    try {
      // Calculate exponential price for the exact tons
      const exactPrice = calculateProductExponentialPrice(selectedProduct, tons);
      
      // Create a range with ±5% for estimate variation
      const minPrice = Math.round(exactPrice.totalPrice * 0.95);
      const maxPrice = Math.round(exactPrice.totalPrice * 1.05);
      
      return `$${minPrice} - $${maxPrice}`;
    } catch (error) {
      console.error("Error calculating exponential price range:", error);
      return "Contact for pricing";
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Material Estimate</h2>
        
        {selectedProduct && (
          <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {selectedProduct.name}
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500">Material Needed (Cubic Yards)</p>
            <p className="text-2xl font-medium">{cubicYards} yd³</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Material Needed (Tons)</p>
            <p className="text-2xl font-medium">{tons} tons</p>
          </div>
        </div>
        
        <div className="pt-2 border-t border-gray-200 mt-2">
          <p className="text-xs text-gray-500">Material Selected</p>
          <p className="font-medium">
            {selectedProduct ? selectedProduct.name : `${materialInfo.subcategory.replace(/-/g, ' ')}`}
          </p>
        </div>
        
        <div className="pt-2 border-t border-gray-200 mt-2">
          <p className="text-xs text-gray-500">Estimated Cost Range</p>
          <p className="text-xl font-semibold">{getEstimatedPriceRange()}</p>
          <p className="text-xs text-gray-500 mt-1">
            Final price depends on delivery location and exact material specifications.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default ShopCalculationDisplay;
