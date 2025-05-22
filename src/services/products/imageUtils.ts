
import { DEFAULT_PRODUCT_IMAGE } from './sampleData';

/**
 * Process image paths - simplified to focus on the images array format
 */
export function processProductImages(product: any): string[] {
  console.log('Processing images for product:', product.name, 'Images data:', product.images);
  
  // If product.images exists and is an array, use it directly
  if (product.images && Array.isArray(product.images) && product.images.length > 0) {
    console.log('Using images array directly:', product.images);
    return product.images.map(img => img || DEFAULT_PRODUCT_IMAGE);
  }
  
  // Special cases for specific product types - these are fallbacks
  if (product.name && product.name.toLowerCase().includes('river rock')) {
    console.log('Using river rock special case images');
    return ['/assets/river-rocks.png', DEFAULT_PRODUCT_IMAGE];
  }
  
  if (product.name && product.name.toLowerCase().includes('crushed stone')) {
    console.log('Using crushed stone special case images');
    return ['/assets/crushed-stone.png', DEFAULT_PRODUCT_IMAGE];
  }
  
  // Final fallback - return default image
  console.log('Using default image fallback');
  return [DEFAULT_PRODUCT_IMAGE];
}
