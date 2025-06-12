
import { useState, useEffect } from 'react';
import { getProducts } from '@/services/productService';
import { Product } from '@/services/productTypes';

export const useProductNames = (productIds: string[]) => {
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchProductNames = async () => {
      if (productIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const products = await getProducts();
        const nameMap: Record<string, string> = {};
        
        productIds.forEach(id => {
          const product = products.find(p => p.id.toString() === id || p.slug === id);
          if (product) {
            nameMap[id] = product.name;
          } else {
            // Fallback to product ID if product not found
            nameMap[id] = id;
          }
        });
        
        setProductNames(nameMap);
      } catch (err) {
        console.error('Error fetching product names:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch product names'));
        
        // Fallback: use product IDs as names if fetch fails
        const fallbackMap: Record<string, string> = {};
        productIds.forEach(id => {
          fallbackMap[id] = id;
        });
        setProductNames(fallbackMap);
      } finally {
        setLoading(false);
      }
    };

    fetchProductNames();
  }, [productIds]);

  return { productNames, loading, error };
};
