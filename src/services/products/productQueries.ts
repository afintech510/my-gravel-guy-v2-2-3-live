import { supabase } from '@/integrations/supabase/client';
import { Product, PriceTier, ZipCodeData } from './types';
import { SAMPLE_PRODUCTS } from './sampleData';
import { 
  getProductsCache, 
  setProductsCache, 
  getLastFetchTimestamp,
  updateLastFetchTimestamp,
  CACHE_TTL 
} from './cache';
import { processProductImages } from './imageUtils';

/**
 * Fetch products from Supabase
 */
export async function getProducts(forceRefresh = false): Promise<Product[]> {
  // Check cache first, unless force refresh is requested
  const productsCache = getProductsCache();
  const lastFetchTimestamp = getLastFetchTimestamp();
  
  if (!forceRefresh && productsCache && (Date.now() - lastFetchTimestamp < CACHE_TTL)) {
    console.log('Using cached products data:', productsCache.length, 'products found');
    return productsCache;
  }

  try {
    console.log('Fetching products from Supabase...');
    
    const { data: productsData, error } = await supabase
      .from('products')
      .select('*');

    if (error) {
      console.error('Supabase error when fetching products:', error);
      throw error;
    }

    if (!productsData || productsData.length === 0) {
      console.warn('No products found in Supabase! Using sample products instead.');
      setProductsCache(SAMPLE_PRODUCTS);
      updateLastFetchTimestamp();
      return SAMPLE_PRODUCTS;
    }

    console.log('Raw products data from Supabase:', productsData);
    
    // Transform raw data into Product objects
    const products: Product[] = productsData.map((row, index) => {
      // Use type assertion to access potentially new fields that may not be in the current Supabase types
      const extendedRow = row as any;
      
      // Extract categories - if category is a string, parse it
      let categories: string[] = [];
      const categoryStr = row.category || 'gravel';
      
      // Handle different category separators (comma, newline, or single value)
      if (typeof categoryStr === 'string') {
        // Fix: Ensure we're explicitly handling the string type
        if (categoryStr.includes('\n')) {
          categories = categoryStr.split('\n').map(cat => cat.trim().toLowerCase()).filter(Boolean);
        } else if (categoryStr.includes(',')) {
          categories = categoryStr.split(',').map(cat => cat.trim().toLowerCase()).filter(Boolean);
        } else {
          categories = [categoryStr.trim().toLowerCase()];
        }
      } else if (Array.isArray(categoryStr)) {
        // Fix: Properly cast as string array to avoid the 'never' type issue
        const categoryArray = categoryStr as any[];
        categories = categoryArray.map(cat => String(cat).trim().toLowerCase());
      }
      
      // Ensure we have at least one category
      if (categories.length === 0) {
        categories = ['gravel']; // Default category
      }
      
      // Map directly to the category without forcing it into a predefined type
      // Each category maps to itself - no more hardcoding to 'gravel'
      const mainCategory = categories[0] as Product['category'];
      
      // Parse metadata if it's a JSON string
      let metadata: any = {};
      if (row.metadata) {
        try {
          // Try to parse if it's a JSON string
          if (typeof row.metadata === 'string') {
            metadata = JSON.parse(row.metadata);
          } else {
            // If it's already an object, use it directly
            metadata = row.metadata;
          }
        } catch (e) {
          console.error('Failed to parse metadata for product:', row.name, e);
        }
      }

      // Generate a slug if one doesn't exist
      // Handle case where row doesn't have slug property
      // Check if row has a slug property first
      const hasSlugProperty = Object.prototype.hasOwnProperty.call(row, 'slug');
      // If not, create a slug from the name or use an index-based fallback
      const slug = hasSlugProperty ? 
                   (row as any).slug || "" : // Use type assertion to avoid TypeScript error
                   (row.name ? 
                    row.name.toLowerCase().replace(/\s+/g, '-') : 
                    `product-${index + 1}`);
      
      // Process images using the new focused function
      const productImages = processProductImages(row);

      // Create the product object with appropriate fallbacks for all fields
      return {
        id: row.id || `temp-${index + 1}`,
        name: row.name || `Product ${index + 1}`,
        description: row.description || "",
        price: parseFloat(String(row.price)) || 0,
        image: productImages[0], // For backward compatibility, use first image
        images: productImages,
        category: mainCategory,
        categories: categories,
        slug: slug,
        tonYardRatio: parseFloat(String(row.ton_yard_ratio)) || 1.5,
        specifications: {
          density: metadata?.density || "",
          size: row.size || metadata?.size || "",
          color: row.color || metadata?.color || "",
          coverage: metadata?.coverage || ""
        },
        uses: Array.isArray(metadata?.uses) ? 
              metadata.uses : 
              typeof metadata?.uses === 'string' ? 
                String(metadata.uses).split(',').map((use: string) => use.trim()) :
                [],
        // Add exponential pricing parameters from database using type assertion
        pricing_a: extendedRow.pricing_a ? parseFloat(String(extendedRow.pricing_a)) : undefined,
        pricing_b: extendedRow.pricing_b ? parseFloat(String(extendedRow.pricing_b)) : undefined,
        pricing_c: extendedRow.pricing_c ? parseFloat(String(extendedRow.pricing_c)) : undefined
      };
    });
    
    console.log('Transformed products:', products);
    
    // Update cache
    setProductsCache(products);
    updateLastFetchTimestamp();
    
    return products;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    console.error("Error details:", {
      timestamp: new Date().toISOString(),
      errorMessage: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // Return sample products in case of error
    console.log('Returning sample products due to fetch error');
    return SAMPLE_PRODUCTS;
  }
}

/**
 * Get product by ID
 */
export async function getProductById(id: number | string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find(p => p.id === id);
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product> {
  const products = await getProducts();
  const product = products.find(p => p.slug === slug);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  return product;
}

/**
 * Get all unique categories from products
 * @returns Array of unique categories
 */
export async function getUniqueCategories(): Promise<string[]> {
  const products = await getProducts();
  
  const categoriesSet = new Set<string>();
  
  // Extract all categories from all products
  products.forEach(product => {
    if (product.categories && Array.isArray(product.categories)) {
      product.categories.forEach(cat => categoriesSet.add(cat));
    } else if (product.category) {
      categoriesSet.add(product.category);
    }
  });
  
  return Array.from(categoriesSet).sort();
}
