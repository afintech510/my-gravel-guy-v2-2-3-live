
import { useState, useEffect } from 'react';
import { Product } from '@/services/productTypes';
import { getProductBySlug, getPriceAdjustmentForZipCode, applyZipCodeAdjustment } from '@/services/productService';

export const useProduct = (slug: string | undefined, zipCode?: string) => {
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [adjustedPrice, setAdjustedPrice] = useState<number | undefined>(undefined);
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
        
        console.log(`Loading product for slug: ${decodedSlug}`);
        
        const fetchedProduct = await getProductBySlug(decodedSlug);
        
        // Process any special case products
        if (fetchedProduct.name.toLowerCase().includes('crushed stone') && 
            (!fetchedProduct.images || !Array.isArray(fetchedProduct.images) || fetchedProduct.images.length === 0)) {
          fetchedProduct.images = ['/lovable-uploads/85eef0fe-9a59-406e-ba6b-54e1aaf6f56b.png'];
        }
        
        console.log(`Product loaded:`, {
          name: fetchedProduct.name,
          images: fetchedProduct.images,
          image: fetchedProduct.image
        });
        
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
};
