
import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/services/productTypes';
import { getProductBySlug } from '@/services/productService';
import { 
  getPriceAdjustmentForZipCode, 
  calculateFinalPrice
} from '@/services/products/pricingUtils';
import { calculateProductExponentialPrice } from '@/services/products/exponentialPricing';

// Type alias to ensure compatibility
// type PriceTier = ProductPriceTier;

export const useProduct = (slug: string | undefined, zipCode?: string, tons: number = 10) => {
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [adjustedPrice, setAdjustedPrice] = useState<number | undefined>(undefined);
  const [priceDetails, setPriceDetails] = useState<{
    basePrice: number;
    multiplier: number;
    zipAdjustment: number;
    pricePerTon: number;
  } | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [zipAdjustment, setZipAdjustment] = useState<number>(1); // Store ZIP adjustment for instant updates

  // Pre-load ZIP code adjustment separately to enable instant price updates
  useEffect(() => {
    if (zipCode) {
      getPriceAdjustmentForZipCode(zipCode)
        .then(adjustment => {
          console.log(`[useProduct] Pre-loaded ZIP adjustment for ${zipCode}:`, adjustment);
          setZipAdjustment(adjustment);
        })
        .catch(err => {
          console.error("[useProduct] Error loading ZIP adjustment:", err);
          setZipAdjustment(1);
        });
    }
  }, [zipCode]);

  // Load product data
  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Decode the URL-encoded slug before fetching
        const decodedSlug = decodeURIComponent(slug);
        const fetchedProduct = await getProductBySlug(decodedSlug);
        setProduct(fetchedProduct);
      } catch (error) {
        console.error('Error loading product:', error);
        setError(error instanceof Error ? error : new Error('Failed to load product'));
      } finally {
        setLoading(false);
      }
    }
    
    loadProduct();
  }, [slug]);

  // Calculate pricing whenever product, tons, or ZIP adjustment changes
  // This enables instant updates without DB calls when tons change
  useEffect(() => {
    if (!product) return;
    
    const calculatePrice = async () => {
      try {
        // Use exponential pricing calculation
        const exponentialResult = calculateProductExponentialPrice(product, tons);
        
        // Apply the ZIP adjustment we've already pre-loaded
        const pricePerTon = Math.round(exponentialResult.pricePerTon * zipAdjustment * 100) / 100;
        
        setAdjustedPrice(pricePerTon);
        setPriceDetails({
          basePrice: product.price,
          multiplier: exponentialResult.multiplier,
          zipAdjustment: zipAdjustment,
          pricePerTon: pricePerTon
        });
      } catch (err) {
        console.error("Error calculating price:", err);
        // Use fallback values
        setAdjustedPrice(product.price);
        setPriceDetails({
          basePrice: product.price,
          multiplier: 1,
          zipAdjustment: 1,
          pricePerTon: product.price
        });
      }
    };
    
    calculatePrice();
  }, [product, tons, zipAdjustment]);

  return { product, adjustedPrice, priceDetails, loading, error };
};
