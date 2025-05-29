
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

// Type extension for products with slug field
type ProductRow = {
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
  [key: string]: any; // Allow additional fields
};

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
      
      // Process images using the new focused function
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
