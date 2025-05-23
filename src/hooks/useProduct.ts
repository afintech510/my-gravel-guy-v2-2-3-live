
import { useState, useEffect, useCallback } from 'react';
import { Product, PriceTier } from '@/services/productTypes';
import { getProductBySlug } from '@/services/productService';
import { 
  getPriceTiersForProduct, 
  getPriceAdjustmentForZipCode, 
  calculateFinalPrice,
  findPriceMultiplierForQuantity 
} from '@/services/products/pricingUtils';

export const useProduct = (slug: string | undefined, zipCode?: string, tons: number = 10) => {
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
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

  // Load product data and pricing tiers
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
        
        if (fetchedProduct) {
          // Fetch all price tiers for this product
          const tiers = await getPriceTiersForProduct(fetchedProduct.id);
          setPriceTiers(tiers);
        }
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
        // Use cached price tiers if available
        const multiplier = findPriceMultiplierForQuantity(priceTiers, tons);
        
        // Calculate using the ZIP adjustment we've already pre-loaded
        const baseWithMultiplier = product.price * multiplier;
        const pricePerTon = Math.round(baseWithMultiplier * zipAdjustment * 100) / 100;
        
        setAdjustedPrice(pricePerTon);
        setPriceDetails({
          basePrice: product.price,
          multiplier: multiplier,
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
  }, [product, tons, zipAdjustment, priceTiers]);

  return { product, adjustedPrice, priceDetails, loading, error };
};
