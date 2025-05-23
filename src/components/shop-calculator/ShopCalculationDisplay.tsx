
import React from 'react';
import { Card } from '@/components/ui/card';
import { Product } from '@/services/productTypes';
import { getPriceForProduct } from '@/services/productService';
import { cn } from '@/lib/utils';

interface ShopCalculationDisplayProps {
  cubicYards: number;
  tons: number;
  materialInfo: {
    category: string;
    subcategory: string;
    size: string;
  };
  selectedProduct: Product | null;
  filteredProducts: Product[];
  onProductSelected: (product: Product | null) => void;
}

const ShopCalculationDisplay: React.FC<ShopCalculationDisplayProps> = ({ 
  cubicYards, 
  tons, 
  materialInfo,
  selectedProduct,
  filteredProducts,
  onProductSelected
}) => {
  // Calculate the estimated price range
  const getEstimatedPriceRange = () => {
    if (!selectedProduct) return "Contact for pricing";
    
    try {
      const price = getPriceForProduct(selectedProduct);
      const minPrice = Math.round(price * tons * 0.9);
      const maxPrice = Math.round(price * tons * 1.1);
      return `$${minPrice} - $${maxPrice}`;
    } catch (error) {
      console.error("Error calculating price range:", error);
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
        
        <div className="pt-4 border-t border-gray-200 mt-2">
          <p className="text-xs text-gray-500 mb-2">Available Products</p>
          
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {filteredProducts.map(product => (
                <button
                  key={product.id}
                  onClick={() => onProductSelected(product)}
                  className={cn(
                    "w-full p-3 text-left rounded-lg border transition-colors flex justify-between items-center",
                    selectedProduct?.id === product.id
                      ? "border-primary bg-primary/5"
                      : "hover:bg-gray-50 border-gray-200"
                  )}
                >
                  <span className="font-medium">{product.name}</span>
                  {product.price > 0 && (
                    <span className="text-sm font-medium text-gray-600">
                      ${product.price}/ton
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center p-4 border border-dashed rounded-lg text-gray-500">
              No products match the selected criteria
            </div>
          )}
        </div>
        
        {selectedProduct && (
          <div className="pt-4 border-t border-gray-200 mt-2">
            <p className="text-xs text-gray-500">Estimated Cost Range</p>
            <p className="text-xl font-semibold">{getEstimatedPriceRange()}</p>
            <p className="text-xs text-gray-500 mt-1">
              Final price depends on delivery location and exact material specifications.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ShopCalculationDisplay;
