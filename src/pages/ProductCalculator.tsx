
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProductFilterSelector from '@/components/product-calculator/ProductFilterSelector';
import AreaCalculator from '@/components/product-calculator/AreaCalculator';
import ProductDetails from '@/components/product-calculator/ProductDetails';
import AddToCartOptions from '@/components/product-calculator/AddToCartOptions';
import ZipCodeChecker from '@/components/product-calculator/ZipCodeChecker';
import TrustBanner from '@/components/product-calculator/TrustBanner';
import { Product } from '@/services/productTypes';
import { useCalculator } from '@/hooks/useCalculator';

const ProductCalculator = () => {
  const { productId } = useParams();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [areas, setAreas] = useState([{ length: 10, width: 10 }]);
  const [depth, setDepth] = useState(4);
  const [extraPercentage, setExtraPercentage] = useState(10);
  
  // Ref for the product details section
  const productDetailsRef = useRef<HTMLDivElement>(null);

  // Calculate material needs using the calculator hook
  const calculations = useCalculator(areas, depth, extraPercentage, 62, 1.5);

  // Auto-scroll to product details when a product is selected
  useEffect(() => {
    if (selectedProduct && productDetailsRef.current) {
      productDetailsRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [selectedProduct]);

  const handleProductSelected = (product: Product | null) => {
    setSelectedProduct(product);
    console.log('ProductCalculator: Product selected:', product?.name || 'None');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Material Calculator & Quote
          </h1>
          <p className="text-lg text-gray-600">
            Select your material, calculate the amount needed, and get an instant quote
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Material Selection, Product Card, and Calculator */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>1. Select Your Material</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductFilterSelector
                  onProductSelected={handleProductSelected}
                  selectedProduct={selectedProduct}
                />
              </CardContent>
            </Card>

            {selectedProduct && (
              <div ref={productDetailsRef}>
                <ProductDetails product={selectedProduct} />
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>2. Calculate Amount Needed</CardTitle>
              </CardHeader>
              <CardContent>
                <AreaCalculator
                  areas={areas}
                  setAreas={setAreas}
                  depth={depth}
                  setDepth={setDepth}
                  extraPercentage={extraPercentage}
                  setExtraPercentage={setExtraPercentage}
                  calculationResult={calculations}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Quote Options */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-6">
              {selectedProduct && calculations.totalTons > 0 && (
                <>
                  <ZipCodeChecker />
                  
                  <AddToCartOptions
                    product={selectedProduct}
                    calculatedTons={calculations.totalTons}
                    priceDetails={null}
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Trust Banner */}
        <div className="mt-16">
          <TrustBanner />
        </div>
      </div>
    </div>
  );
};

export default ProductCalculator;
