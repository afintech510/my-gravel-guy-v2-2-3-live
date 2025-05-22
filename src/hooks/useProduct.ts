
import { useState, useEffect, useCallback } from 'react';
import { Product } from '@/services/productTypes';
import { 
  getProductBySlug, 
  getPriceAdjustmentForZipCode, 
  getPriceMultiplierForQuantity,
  getPriceTiersForProduct 
} from '@/services/productService';

interface PriceTier {
  min_tons: number;
  max_tons?: number | null;
  multiplier: number;
}

export const useProduct = (slug: string | undefined, zipCode?: string, tons: number = 10) => {
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [priceTiers, setPriceTiers] = useState<PriceTier[]>([]);
  const [zipAdjustment, setZipAdjustment] = useState<number>(1); // This is now a direct multiplier (e.g., 1.2)
  const [adjustedPrice, setAdjustedPrice] = useState<number | undefined>(undefined);
  const [priceDetails, setPriceDetails] = useState<{
    basePrice: number;
    multiplier: number;
    zipAdjustment: number;
    pricePerTon: number;
  } | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Function to calculate price based on stored tiers and ZIP adjustment
  const calculatePrice = useCallback((product: Product | undefined, tons: number) => {
    if (!product) return;
    
    // Get base price from product
    const basePrice = product.price;
    
    // Find appropriate tier for the quantity
    let multiplier = 1;
    const tier = priceTiers.find(t => {
      // If tier has max_tons, check if tons is in range
      if (t.max_tons !== null && t.max_tons !== undefined) {
        return tons >= t.min_tons && tons <= t.max_tons;
      }
      // If no max_tons, this is for "tons >= min_tons"
      return tons >= t.min_tons;
    });
    
    // Use the multiplier from the matching tier, or 1 if no tier found
    if (tier) {
      multiplier = tier.multiplier;
    }
    
    // Apply volume multiplier to get adjusted base price
    let volumeAdjustedPrice = basePrice * multiplier;
    
    // Apply ZIP code adjustment as a direct multiplier
    volumeAdjustedPrice = volumeAdjustedPrice * zipAdjustment;
    
    // Set the final adjusted price
    setAdjustedPrice(volumeAdjustedPrice);
    
    // Save price calculation details for UI display
    setPriceDetails({
      basePrice,
      multiplier,
      zipAdjustment,
      pricePerTon: volumeAdjustedPrice
    });
  }, [priceTiers, zipAdjustment]);

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
          
          // If we have a ZIP code, fetch the adjustment
          if (zipCode) {
            // Get the adjustment directly as a multiplier (e.g., 1.2 for +20%)
            const adjustment = await getPriceAdjustmentForZipCode(zipCode);
            setZipAdjustment(adjustment);
          } else {
            setZipAdjustment(1); // Default to no adjustment (factor of 1)
          }
          
          // Initial price calculation
          calculatePrice(fetchedProduct, tons);
        }
      } catch (error) {
        console.error('Error loading product:', error);
        setError(error instanceof Error ? error : new Error('Failed to load product'));
      } finally {
        setLoading(false);
      }
    }
    
    loadProduct();
  }, [slug, zipCode]);

  // Recalculate price when tons change (without network calls)
  useEffect(() => {
    if (product) {
      calculatePrice(product, tons);
    }
  }, [tons, product, calculatePrice]);

  return { product, adjustedPrice, priceDetails, loading, error };
};
