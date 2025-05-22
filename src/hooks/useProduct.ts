
import { useState, useEffect } from 'react';
import { Product } from '@/services/productTypes';
import { getProductBySlug, getPriceAdjustmentForZipCode, applyZipCodeAdjustment, getPriceMultiplierForQuantity } from '@/services/productService';

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
          // Get base price from product
          const basePrice = fetchedProduct.price;
          
          // Get volume-based price multiplier
          const multiplier = await getPriceMultiplierForQuantity(fetchedProduct.id, tons);
          
          // Apply volume multiplier to get adjusted base price
          let volumeAdjustedPrice = basePrice * multiplier;
          
          // If we have a ZIP code, apply ZIP-based adjustment
          let zipAdjustment = 0;
          if (zipCode) {
            zipAdjustment = await getPriceAdjustmentForZipCode(zipCode);
            // Apply ZIP code adjustment on top of volume-adjusted price
            volumeAdjustedPrice = applyZipCodeAdjustment(volumeAdjustedPrice, zipAdjustment);
          }
          
          // Set the final adjusted price
          setAdjustedPrice(volumeAdjustedPrice);
          
          // Save price calculation details for UI display
          setPriceDetails({
            basePrice,
            multiplier,
            zipAdjustment,
            pricePerTon: volumeAdjustedPrice
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
