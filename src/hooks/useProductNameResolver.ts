
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/services/productService';

interface ProductNameMap {
  [productId: string]: string;
}

export const useProductNameResolver = (productIds: string[]) => {
  const {
    data: products,
    isLoading,
    error
  } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Create a map of product ID to product name
  const productNameMap: ProductNameMap = {};
  
  if (products) {
    products.forEach(product => {
      productNameMap[product.id] = product.name;
    });
  }

  // Helper function to resolve a single product ID to name
  const resolveProductName = (productId: string): string => {
    return productNameMap[productId] || productId; // Fallback to ID if name not found
  };

  return {
    resolveProductName,
    productNameMap,
    isLoading,
    error
  };
};
