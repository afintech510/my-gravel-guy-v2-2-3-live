
import { supabase } from '@/integrations/supabase/client';
import { Product } from './types';
import { SAMPLE_PRODUCTS } from './sampleData';
import { 
  getProductsCache, 
  setProductsCache, 
  getLastFetchTimestamp,
  updateLastFetchTimestamp,
  CACHE_TTL 
} from './cache';
import { transformProductRow } from './productTransform';

/**
 * Fetch products from Supabase with caching
 */
export async function fetchProductsFromSupabase(forceRefresh = false): Promise<Product[]> {
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
    const products: Product[] = productsData.map((row, index) => transformProductRow(row, index));
    
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
