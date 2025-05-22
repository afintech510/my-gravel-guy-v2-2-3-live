
import { useState, useEffect } from 'react';
import { Product } from '@/services/productTypes';
import { getProductBySlug, getPriceAdjustmentForZipCode, applyZipCodeAdjustment, calculateFinalPrice } from '@/services/productService';

export const useProduct = (slug: string | undefined, zipCode?: string, tons: number = 10) => {
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [priceData, setPriceData] = useState<{
    basePrice: number;
    multiplier: number;
    zipAdjustment: number;
    finalPrice: number;
    pricePerTon: number;
  } | undefined>(undefined);


  
  /*
export const useProduct = (slug: string | undefined, zipCode?: string) => {
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [adjustedPrice, setAdjustedPrice] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  */

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
        
        if (fetchedProduct && zipCode) {
          const adjustment = await getPriceAdjustmentForZipCode(zipCode);
          setAdjustedPrice(applyZipCodeAdjustment(fetchedProduct.price, adjustment));
        } else if (fetchedProduct) {
          setAdjustedPrice(fetchedProduct.price);
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

  return { product, adjustedPrice, loading, error };

     useEffect(() => {
      async function updatePrice() {
        if (!product) return;
  
        try {
          const pricing = await calculateFinalPrice(product, tons, zipCode);
          setPriceData(pricing);
        } catch (error) {
          console.error('Error calculating price:', error);
        }
      }
  
      updatePrice();
    }, [product, zipCode, tons]);
  
    return { product, priceData, loading, error }; 
  
};
