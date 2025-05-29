
import { Product } from './types';
import { processProductImages } from './imageUtils';

// Type extension for products with slug field
export type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  size: string | null;
  color: string | null;
  metadata: any;
  ton_yard_ratio: string | null;
  slug?: string; // Optional slug field
  pricing_a?: number;
  pricing_b?: number;
  pricing_c?: number;
  [key: string]: any; // Allow additional fields
};

/**
 * Transform raw database row into Product object
 */
export function transformProductRow(row: any, index: number): Product {
  // Cast to our extended type to access slug and other potential new fields
  const productRow = row as ProductRow;
  
  // Extract categories - if category is a string, parse it
  let categories: string[] = [];
  const categoryStr = productRow.category || 'gravel';
  
  // Handle different category separators (comma, newline, or single value)
  if (typeof categoryStr === 'string') {
    if (categoryStr.includes('\n')) {
      categories = categoryStr.split('\n').map(cat => cat.trim().toLowerCase()).filter(Boolean);
    } else if (categoryStr.includes(',')) {
      categories = categoryStr.split(',').map(cat => cat.trim().toLowerCase()).filter(Boolean);
    } else {
      categories = [categoryStr.trim().toLowerCase()];
    }
  } else if (Array.isArray(categoryStr)) {
    const categoryArray = categoryStr as any[];
    categories = categoryArray.map(cat => String(cat).trim().toLowerCase());
  }
  
  // Ensure we have at least one category
  if (categories.length === 0) {
    categories = ['gravel']; // Default category
  }
  
  // Map directly to the category without forcing it into a predefined type
  const mainCategory = categories[0] as Product['category'];
  
  // Parse metadata if it's a JSON string
  let metadata: any = {};
  if (productRow.metadata) {
    try {
      if (typeof productRow.metadata === 'string') {
        metadata = JSON.parse(productRow.metadata);
      } else {
        metadata = productRow.metadata;
      }
    } catch (e) {
      console.error('Failed to parse metadata for product:', productRow.name, e);
    }
  }

  // Generate a slug if one doesn't exist
  const slug = productRow.slug || 
               (productRow.name ? 
                productRow.name.toLowerCase().replace(/\s+/g, '-') : 
                `product-${index + 1}`);
  
  // Process images using the focused function
  const productImages = processProductImages(productRow);

  // Create the product object with appropriate fallbacks for all fields
  return {
    id: productRow.id || `temp-${index + 1}`,
    name: productRow.name || `Product ${index + 1}`,
    description: productRow.description || "",
    price: parseFloat(String(productRow.price)) || 0,
    image: productImages[0], // For backward compatibility, use first image
    images: productImages,
    category: mainCategory,
    categories: categories,
    slug: slug,
    tonYardRatio: parseFloat(String(productRow.ton_yard_ratio)) || 1.5,
    specifications: {
      density: metadata?.density || "",
      size: productRow.size || metadata?.size || "",
      color: productRow.color || metadata?.color || "",
      coverage: metadata?.coverage || ""
    },
    uses: Array.isArray(metadata?.uses) ? 
          metadata.uses : 
          typeof metadata?.uses === 'string' ? 
            String(metadata.uses).split(',').map((use: string) => use.trim()) :
            [],
    // Add exponential pricing parameters from database
    pricing_a: productRow.pricing_a ? parseFloat(String(productRow.pricing_a)) : undefined,
    pricing_b: productRow.pricing_b ? parseFloat(String(productRow.pricing_b)) : undefined,
    pricing_c: productRow.pricing_c ? parseFloat(String(productRow.pricing_c)) : undefined
  };
}
