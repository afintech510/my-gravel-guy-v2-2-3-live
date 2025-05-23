import { Product } from './productTypes';

// Add the missing function for calculating price for a product
export const getPriceForProduct = (product: Product): number => {
  // Return the base price from the product or a default
  return product.price || 0;
};

// This is now just a barrel file that re-exports everything from the products directory
// for backward compatibility
export * from './products';
