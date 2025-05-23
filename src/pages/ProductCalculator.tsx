
import React, { useState } from 'react';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Product } from '@/services/productTypes';
import { calculateFinalPrice } from '@/services/products/pricingUtils';
import ProductFilterSelector from '@/components/product-calculator/ProductFilterSelector';
import AreaCalculator from '@/components/product-calculator/AreaCalculator';
import AddToCartOptions from '@/components/product-calculator/AddToCartOptions';
import ZipCodeChecker from '@/components/product-calculator/ZipCodeChecker';
import TrustBanner from '@/components/product-calculator/TrustBanner';
import ProductDetails from '@/components/product-calculator/ProductDetails';
import { useCalculator } from '@/hooks/useCalculator';

export default function ProductCalculator() {
  const { zipCode, zipCodeData } = useZipCode();
  const { toast } = useToast();
  
  // State management
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [areas, setAreas] = useState([{ length: 10, width: 10 }]);
  const [depth, setDepth] = useState(2);
  const [extraPercentage, setExtraPercentage] = useState(10);
  const [priceDetails, setPriceDetails] = useState<{
    basePrice: number;
    multiplier: number;
    zipAdjustment: number;
    finalPrice: number;
    pricePerTon: number;
  } | null>(null);

  // Calculate material needs using the hook
  const calculationResult = useCalculator(
    areas,
    depth,
    extraPercentage,
    selectedProduct?.price || 0,
    selectedProduct?.tonYardRatio || 1.5
  );

  // Calculate pricing when product or ZIP code changes
  React.useEffect(() => {
    if (selectedProduct && zipCode && calculationResult.totalTons > 0) {
      calculateFinalPrice(selectedProduct, calculationResult.totalTons, zipCode)
        .then(pricing => {
          setPriceDetails(pricing);
        })
        .catch(error => {
          console.error('Error calculating price:', error);
          setPriceDetails(null);
        });
    }
  }, [selectedProduct, zipCode, calculationResult.totalTons]);

  const handleProductSelected = (product: Product | null) => {
    setSelectedProduct(product);
    setPriceDetails(null); // Reset pricing when product changes
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Material Calculator
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Calculate exactly how much material you need for your project and get instant pricing.
            </p>
          </div>

          {/* Trust Banner */}
          <TrustBanner />

          <div className="grid lg:grid-cols-2 gap-8 mt-8">
            {/* Left Column - Product Selection & Area Calculator */}
            <div className="space-y-6">
              {/* ZIP Code Checker */}
              <ZipCodeChecker />

              {/* Product Selection */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <ProductFilterSelector
                  onProductSelected={handleProductSelected}
                  selectedProduct={selectedProduct}
                />
              </div>

              {/* Area Calculator */}
              {selectedProduct && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-xl font-semibold mb-4">Calculate Your Needs</h2>
                  <AreaCalculator
                    areas={areas}
                    setAreas={setAreas}
                    depth={depth}
                    setDepth={setDepth}
                    extraPercentage={extraPercentage}
                    setExtraPercentage={setExtraPercentage}
                    calculationResult={calculationResult}
                  />
                </div>
              )}
            </div>

            {/* Right Column - Product Details & Add to Cart */}
            <div className="space-y-6">
              {selectedProduct && (
                <>
                  {/* Product Details */}
                  <ProductDetails product={selectedProduct} />

                  {/* Add to Cart Options */}
                  {zipCodeData && calculationResult.totalTons > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                      <AddToCartOptions
                        product={selectedProduct}
                        calculatedTons={calculationResult.totalTons}
                        priceDetails={priceDetails}
                      />
                    </div>
                  )}
                </>
              )}

              {!selectedProduct && (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Material
                  </h3>
                  <p className="text-gray-600">
                    Choose a material from the left to see details and calculate your needs.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
