
import React from 'react';
import ProductFilterSelector from '@/components/product-calculator/ProductFilterSelector';
import ProductDetails from '@/components/product-calculator/ProductDetails';
import AreaCalculator from '@/components/product-calculator/AreaCalculator';
import ZipCodeChecker from '@/components/product-calculator/ZipCodeChecker';
import AddToCartOptions from '@/components/product-calculator/AddToCartOptions';
import TrustBanner from '@/components/product-calculator/TrustBanner';
import { useState, useEffect } from 'react';
import { Product } from '@/services/productTypes';
import { useCalculator } from '@/hooks/useCalculator';
import { Helmet } from 'react-helmet-async';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { getPriceAdjustmentForZipCode } from '@/services/products/zipCode';

export default function ProductCalculator() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [areas, setAreas] = useState<Array<{length: number, width: number}>>([{length: 10, width: 10}]);
  const [depth, setDepth] = useState<number>(2);
  const [extraPercentage, setExtraPercentage] = useState<number>(10);
  const { zipCode } = useZipCode();
  const [adjustedPrice, setAdjustedPrice] = useState<number | null>(null);
  
  // Calculate material needs based on inputs
  const calculationResult = useCalculator(
    areas, 
    depth, 
    extraPercentage, 
    adjustedPrice || selectedProduct?.price || 0,
    selectedProduct?.tonYardRatio || 1.5
  );

  // Update product price based on ZIP code when product or ZIP changes
  useEffect(() => {
    const updatePriceAdjustment = async () => {
      if (selectedProduct && zipCode) {
        try {
          // Get the adjustment factor for the ZIP code
          const adjustment = await getPriceAdjustmentForZipCode(zipCode);
          
          // Apply adjustment to base price
          const newAdjustedPrice = selectedProduct.price * adjustment;
          setAdjustedPrice(newAdjustedPrice);
        } catch (error) {
          console.error('Error calculating price adjustment:', error);
          setAdjustedPrice(selectedProduct.price); // Fallback to base price
        }
      } else if (selectedProduct) {
        setAdjustedPrice(selectedProduct.price); // No ZIP code, use base price
      } else {
        setAdjustedPrice(null); // No product selected
      }
    };

    updatePriceAdjustment();
  }, [selectedProduct, zipCode]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Material Calculator | Find the Right Amount for Your Project</title>
        <meta name="description" content="Calculate exactly how much material you need for your project with our easy-to-use calculator." />
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Material Calculator</h1>
        <p className="text-slate-600 mt-2">Find the perfect amount of material for your project and add it to your cart.</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left column - Product selection */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Select Your Material</h2>
            <ProductFilterSelector 
              onProductSelected={setSelectedProduct}
              selectedProduct={selectedProduct}
            />
          </div>
          
          {selectedProduct && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <ProductDetails product={selectedProduct} />
            </div>
          )}
          
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <TrustBanner />
          </div>
        </div>
        
        {/* Right column - Calculator and actions */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 sticky top-24">
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
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <ZipCodeChecker />
            </div>
            
            {selectedProduct && calculationResult.totalTons > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <AddToCartOptions 
                  product={{
                    ...selectedProduct,
                    price: adjustedPrice || selectedProduct.price
                  }}
                  calculatedTons={calculationResult.totalTons}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
