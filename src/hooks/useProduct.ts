
import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/services/productTypes';
import { getProductBySlug } from '@/services/productService';
import { 
  getPriceTiersForProduct, 
  getPriceAdjustmentForZipCode, 
  calculateFinalPrice 
} from '@/services/products/pricingUtils';

interface PriceTier {
  min_tons: number;
  max_tons?: number | null;
  multiplier: number;
}

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
          
          // Calculate initial price using the unified function
          const priceInfo = await calculateFinalPrice(fetchedProduct, tons, zipCode);
          
          setAdjustedPrice(priceInfo.pricePerTon);
          setPriceDetails({
            basePrice: priceInfo.basePrice,
            multiplier: priceInfo.multiplier,
            zipAdjustment: priceInfo.zipAdjustment,
            pricePerTon: priceInfo.pricePerTon
          });
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setError(error instanceof Error ? error : new Error('Failed to load product'));
      } finally {
        setLoading(false);
      }
    }
    
    loadProduct();
  }, [slug, zipCode, tons]);

  return { product, adjustedPrice, priceDetails, loading, error };
};
