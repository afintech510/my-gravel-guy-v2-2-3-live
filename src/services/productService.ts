import { Product } from './productTypes';

// Add the missing getPriceForProduct function
export const getPriceForProduct = (product: Product): number => {
  // Implement basic pricing logic (replace with actual logic)
  if (!product || !product.price) {
    return 0;
  }
  
  return product.price;
};

// This is now just a barrel file that re-exports everything from the products directory
// for backward compatibility
export * from './products';
