
import React from 'react';
import ProductFilterSelector from '@/components/product-calculator/ProductFilterSelector';
import ProductDetails from '@/components/product-calculator/ProductDetails';
import AreaCalculator from '@/components/product-calculator/AreaCalculator';
import ZipCodeChecker from '@/components/product-calculator/ZipCodeChecker';
import AddToCartOptions from '@/components/product-calculator/AddToCartOptions';
import TrustBanner from '@/components/product-calculator/TrustBanner';
import { useState, useEffect } from 'react';
import { Product, PriceTier } from '@/services/productTypes';
import { useCalculator } from '@/hooks/useCalculator';
import { Helmet } from 'react-helmet-async';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { 
  calculateFinalPrice,
  getPriceTiersForProduct,
  getPriceAdjustmentForZipCode 
} from '@/services/products/pricingUtils';
import { useToast } from '@/components/ui/use-toast';
import { getProducts } from '@/services/productService';

interface ProductPricing {
  productId: string;
  priceTiers: PriceTier[];
  zipAdjustment: number;
}

export default function ProductCalculator() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [areas, setAreas] = useState<Array<{length: number, width: number}>>([{length: 10, width: 10}]);
  const [depth, setDepth] = useState<number>(2);
  const [extraPercentage, setExtraPercentage] = useState<number>(10);
  const [productPricing, setProductPricing] = useState<Record<string, ProductPricing>>({});
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const { zipCode } = useZipCode();
  const { toast } = useToast();
  const [priceDetails, setPriceDetails] = useState<{
    basePrice: number;
    multiplier: number;
    zipAdjustment: number;
    finalPrice: number;
    pricePerTon: number;
  } | null>(null);
  
  // Calculate material needs based on inputs
  const calculationResult = useCalculator(
    areas, 
    depth, 
    extraPercentage, 
    priceDetails?.pricePerTon || (selectedProduct?.price || 0),
    selectedProduct?.tonYardRatio || 1.5
  );

  // Load all products and preload pricing data on mount
  useEffect(() => {
    const loadProductsAndPricing = async () => {
      try {
        console.log('ProductCalculator: Loading products and pricing data...');
        const products = await getProducts();
        setAllProducts(products);
        
        // Preload pricing data for all products
        await preloadPricingData(products);
        
        console.log('ProductCalculator: Products and pricing data loaded successfully');
      } catch (error) {
        console.error('ProductCalculator: Error loading products:', error);
      }
    };

    loadProductsAndPricing();
  }, []);

  // Preload pricing tiers and ZIP adjustments for all products
  const preloadPricingData = async (products: Product[]) => {
    try {
      console.log('ProductCalculator: Preloading pricing data for', products.length, 'products');
      
      // Get ZIP code adjustment once
      const zipAdjustment = zipCode ? await getPriceAdjustmentForZipCode(zipCode) : 1;
      
      // Load price tiers for all products in parallel
      const pricingPromises = products.map(async (product) => {
        try {
          const priceTiers = await getPriceTiersForProduct(product.id);
          return {
            productId: product.id.toString(),
            priceTiers,
            zipAdjustment
          };
        } catch (error) {
          console.error(`ProductCalculator: Error loading pricing for product ${product.id}:`, error);
          return {
            productId: product.id.toString(),
            priceTiers: [],
            zipAdjustment
          };
        }
      });

      const allPricingData = await Promise.all(pricingPromises);
      
      // Convert to lookup object
      const pricingLookup: Record<string, ProductPricing> = {};
      allPricingData.forEach(data => {
        pricingLookup[data.productId] = data;
      });
      
      setProductPricing(pricingLookup);
      console.log('ProductCalculator: Pricing data preloaded for', Object.keys(pricingLookup).length, 'products');
    } catch (error) {
      console.error('ProductCalculator: Error preloading pricing data:', error);
    }
  };

  // Update ZIP adjustment when ZIP code changes
  useEffect(() => {
    if (zipCode && Object.keys(productPricing).length > 0) {
      const updateZipAdjustment = async () => {
        try {
          console.log('ProductCalculator: Updating ZIP adjustment for', zipCode);
          const newZipAdjustment = await getPriceAdjustmentForZipCode(zipCode);
          
          // Update all product pricing with new ZIP adjustment
          const updatedPricing = { ...productPricing };
          Object.keys(updatedPricing).forEach(productId => {
            updatedPricing[productId] = {
              ...updatedPricing[productId],
              zipAdjustment: newZipAdjustment
            };
          });
          
          setProductPricing(updatedPricing);
          console.log('ProductCalculator: ZIP adjustment updated to', newZipAdjustment);
        } catch (error) {
          console.error('ProductCalculator: Error updating ZIP adjustment:', error);
        }
      };
      
      updateZipAdjustment();
    }
  }, [zipCode]);

  // Update product price based on product, ZIP code, and calculated tons
  useEffect(() => {
    const updatePriceDetails = async () => {
      if (selectedProduct && calculationResult.totalTons > 0) {
        try {
          console.log(`ProductCalculator: Calculating price for product ${selectedProduct.name} (ID: ${selectedProduct.id}), tons: ${calculationResult.totalTons}`);
          
          // Use preloaded pricing data if available, otherwise calculate fresh
          const productId = selectedProduct.id.toString();
          if (productPricing[productId]) {
            // Use preloaded data for instant calculation
            const pricing = productPricing[productId];
            const pricing_calc = await calculateFinalPrice(
              selectedProduct,
              calculationResult.totalTons,
              zipCode || undefined
            );
            setPriceDetails(pricing_calc);
            console.log('ProductCalculator: Used preloaded pricing data:', pricing_calc);
          } else {
            // Fallback to fresh calculation
            const pricing = await calculateFinalPrice(
              selectedProduct,
              calculationResult.totalTons,
              zipCode || undefined
            );
            console.log('ProductCalculator: Fresh price calculation:', pricing);
            setPriceDetails(pricing);
          }
          
          // Show volume pricing notification
          if (priceDetails && priceDetails.multiplier !== 1) {
            const changePercent = Math.abs((priceDetails.multiplier - 1) * 100).toFixed(0);
            const direction = priceDetails.multiplier > 1 ? 'increase' : 'decrease';
            toast({
              title: `Volume pricing applied`,
              description: `${calculationResult.totalTons.toFixed(1)} tons qualifies for a ${changePercent}% price ${direction}.`,
              duration: 3000
            });
          }
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
  }, [selectedProduct, zipCode, calculationResult.totalTons, productPricing, toast]);

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
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
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
                  product={selectedProduct}
                  calculatedTons={calculationResult.totalTons}
                  priceDetails={priceDetails}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Trust banner - now full width and below calculator */}
      <div className="bg-white rounded-lg shadow-sm p-6 w-full">
        <TrustBanner />
      </div>
    </div>
  );
}
