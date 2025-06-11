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
import { calculateFinalPrice, getPriceAdjustmentForZipCode } from '@/services/products/pricingUtils';
import { useToast } from '@/components/ui/use-toast';
import { getProducts } from '@/services/productService';

// Helper function to enforce minimum quantity for pricing
const getEffectivePricingQuantity = (calculatedTons: number): number => {
  return Math.max(3, calculatedTons);
};
export default function ProductCalculator() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [areas, setAreas] = useState<Array<{
    length: number;
    width: number;
  }>>([{
    length: 10,
    width: 10
  }]);
  const [depth, setDepth] = useState<number>(2);
  const [extraPercentage, setExtraPercentage] = useState<number>(10);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const {
    zipCode
  } = useZipCode();
  const {
    toast
  } = useToast();
  const [priceDetails, setPriceDetails] = useState<{
    basePrice: number;
    multiplier: number;
    zipAdjustment: number;
    finalPrice: number;
    pricePerTon: number;
  } | null>(null);

  // Calculate material needs based on inputs
  const calculationResult = useCalculator(areas, depth, extraPercentage, priceDetails?.pricePerTon || selectedProduct?.price || 0, selectedProduct?.tonYardRatio || 1.5);

  // Load all products on mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        console.log('ProductCalculator: Loading products...');
        const products = await getProducts();
        setAllProducts(products);
        console.log('ProductCalculator: Products loaded successfully');
      } catch (error) {
        console.error('ProductCalculator: Error loading products:', error);
      }
    };
    loadProducts();
  }, []);

  // Update product price based on product, ZIP code, and calculated tons
  useEffect(() => {
    const updatePriceDetails = async () => {
      if (selectedProduct && calculationResult.totalTons > 0) {
        try {
          // Enforce minimum 3-ton quantity for pricing calculations
          const effectiveTons = getEffectivePricingQuantity(calculationResult.totalTons);
          console.log(`ProductCalculator: Calculating exponential price for product ${selectedProduct.name} (ID: ${selectedProduct.id})`);
          console.log(`ProductCalculator: Calculated tons: ${calculationResult.totalTons}, Effective pricing tons: ${effectiveTons}`);

          // Calculate price using exponential pricing
          const pricing = await calculateFinalPrice(selectedProduct, effectiveTons,
          // Use effective tons for pricing
          zipCode || undefined);
          setPriceDetails(pricing);
          console.log('ProductCalculator: Exponential price calculation:', pricing);

          /*
          // Show volume pricing notification
          if (pricing.multiplier !== 1) {
            const changePercent = Math.abs((pricing.multiplier - 1) * 100).toFixed(0);
            const direction = pricing.multiplier > 1 ? 'increase' : 'decrease';
            toast({
              title: `Volume pricing applied`,
              description: `${effectiveTons.toFixed(1)} tons qualifies for a ${changePercent}% price ${direction}.`,
              duration: 3000
            });  
          }
          */
        } catch (error) {
          console.error('ProductCalculator: Error calculating price details:', error);
          // Fallback to base price if calculation fails
          setPriceDetails({
            basePrice: selectedProduct.price,
            multiplier: 1,
            zipAdjustment: 1,
            finalPrice: selectedProduct.price * calculationResult.totalTons,
            pricePerTon: selectedProduct.price
          });
        }
      } else {
        setPriceDetails(null);
      }
    };
    updatePriceDetails();
  }, [selectedProduct, zipCode, calculationResult.totalTons, toast]);
  return <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>Material Calculator | Find the Right Amount for Your Project</title>
        <meta name="description" content="Calculate exactly how much material you need for your project with our easy-to-use calculator." />
      </Helmet>
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Material Calculator</h1>
        <p className="text-slate-600 mt-2">Find the perfect amount of material for your project and add it to your cart.</p>
        
        {/* Step-by-step guidance */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">1</span>
            <span className="text-slate-600 font-bold">Select Your Material - Choose a product</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">2</span>
            <span className="text-slate-600 font-bold">Calculate Your Needs</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">3</span>
            <span className="text-slate-600 font-bold">Add to cart</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Left column - Product selection */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">Step 1: Select Your Material</h2>
            <ProductFilterSelector onProductSelected={setSelectedProduct} selectedProduct={selectedProduct} />
          </div>
          
          {selectedProduct && <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <ProductDetails product={selectedProduct} />
            </div>}
        </div>
        
        {/* Right column - Calculator and actions */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Step 2: Calculate Your Needs</h2>
            <AreaCalculator areas={areas} setAreas={setAreas} depth={depth} setDepth={setDepth} extraPercentage={extraPercentage} setExtraPercentage={setExtraPercentage} calculationResult={calculationResult} />
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <ZipCodeChecker />
            </div>
            
            {selectedProduct && calculationResult.totalTons > 0 && <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Step 3: Add to Cart</h3>
                <AddToCartOptions product={selectedProduct} calculatedTons={calculationResult.totalTons} priceDetails={priceDetails} />
              </div>}
          </div>
        </div>
      </div>
      
      {/* Trust banner - now full width and below calculator */}
      <div className="bg-white rounded-lg shadow-sm p-6 w-full">
        <TrustBanner />
      </div>
    </div>;
}