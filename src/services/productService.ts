
import { Product, ZipCodeData } from './productTypes';
import { supabase } from '@/integrations/supabase/client';

// In-memory cache with expiry
let productsCache: Product[] | null = null;
let zipCodePricingCache: Map<string, number> | null = null;
let zipCodesCache: ZipCodeData[] | null = null;
let lastFetchTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// Default product image
const DEFAULT_PRODUCT_IMAGE = '/lovable-uploads/85eef0fe-9a59-406e-ba6b-54e1aaf6f56b.png';

// Sample products to use when database is empty or when there's an error
const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'sample-1',
    name: 'River Rock Gravel',
    description: 'Smooth rounded stones perfect for landscaping and garden paths.',
    price: 45.99,
    image: '/assets/river-rocks.png',
    images: ['/assets/river-rocks.png', DEFAULT_PRODUCT_IMAGE, DEFAULT_PRODUCT_IMAGE],
    category: 'gravel',
    categories: ['gravel', 'landscaping', 'garden'],
    slug: 'river-rock-gravel',
    tonYardRatio: 1.5,
    specifications: {
      density: '90-110 lb/ft³',
      size: '3/4" - 1 1/2"',
      color: 'Natural mix',
      coverage: 'Approximately 90 sq ft at 2" depth per ton'
    },
    uses: ['Driveways', 'Walkways', 'Landscape beds', 'Drainage']
  },
  {
    id: 'sample-2',
    name: 'Washed Sand',
    description: 'Fine grain washed sand suitable for concrete mixing and play areas.',
    price: 38.50,
    image: DEFAULT_PRODUCT_IMAGE,
    images: [DEFAULT_PRODUCT_IMAGE, DEFAULT_PRODUCT_IMAGE, DEFAULT_PRODUCT_IMAGE],
    category: 'sand',
    categories: ['sand', 'construction', 'playground'],
    slug: 'washed-sand',
    tonYardRatio: 1.4,
    specifications: {
      density: '100-120 lb/ft³',
      size: 'Fine grain',
      color: 'Tan',
      coverage: 'Approximately 80 sq ft at 2" depth per ton'
    },
    uses: ['Concrete mixing', 'Sandbox filling', 'Paver base', 'Golf bunkers']
  },
  {
    id: 'sample-3',
    name: 'Premium Topsoil',
    description: 'Rich organic topsoil perfect for gardening and lawn preparation.',
    price: 32.99,
    image: DEFAULT_PRODUCT_IMAGE,
    category: 'dirt',
    categories: ['dirt', 'soil', 'gardening'],
    slug: 'premium-topsoil',
    tonYardRatio: 1.3,
    specifications: {
      density: '75-100 lb/ft³',
      size: 'Fine to medium texture',
      color: 'Dark brown',
      coverage: 'Approximately 100 sq ft at 2" depth per ton'
    },
    uses: ['Garden beds', 'Lawn preparation', 'Potting mix', 'Raised beds']
  },
  {
    id: 'sample-4',
    name: 'Decorative Mulch',
    description: 'Premium wood mulch for garden beds and landscaping projects.',
    price: 28.75,
    image: DEFAULT_PRODUCT_IMAGE,
    category: 'mulch',
    categories: ['mulch', 'landscaping', 'garden'],
    slug: 'decorative-mulch',
    tonYardRatio: 1.0,
    specifications: {
      density: '400-500 lb/yd³',
      size: 'Medium shred',
      color: 'Chocolate brown',
      coverage: 'Approximately 100 sq ft at 3" depth per yard'
    },
    uses: ['Flower beds', 'Tree rings', 'Playground areas', 'Erosion control']
  },
  {
    id: 'sample-5',
    name: 'Crushed Limestone',
    description: 'Durable crushed limestone for driveways and base material.',
    price: 42.50,
    image: '/assets/crushed-stone.png',
    category: 'gravel',
    categories: ['gravel', 'limestone', 'driveway'],
    slug: 'crushed-limestone',
    tonYardRatio: 1.6,
    specifications: {
      density: '100-120 lb/ft³',
      size: '3/4"',
      color: 'Light gray',
      coverage: 'Approximately 80 sq ft at 2" depth per ton'
    },
    uses: ['Driveways', 'Road base', 'Drainage', 'Walking paths']
  }
];

/**
 * Process image paths - simplified to focus on the images array format
 */
function processProductImages(product: any): string[] {
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

/**
 * Fetch products from Supabase
 */
export async function getProducts(forceRefresh = false): Promise<Product[]> {
  // Check cache first, unless force refresh is requested
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
      productsCache = SAMPLE_PRODUCTS;
      lastFetchTimestamp = Date.now();
      return SAMPLE_PRODUCTS;
    }

    console.log('Raw products data from Supabase:', productsData);
    
    // Transform raw data into Product objects
    const products: Product[] = productsData.map((row, index) => {
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
      
      // Map to valid main category type
      const mainCategoryMap: Record<string, 'gravel' | 'sand' | 'dirt' | 'mulch' | 'base'> = {
        'gravel': 'gravel',
        'sand': 'sand',
        'dirt': 'dirt',
        'soil': 'dirt',
        'mulch': 'mulch',
        'base': 'base',
        'stone': 'gravel',
        'rock': 'gravel'
      };
      
      // Find the first category that maps to a valid main category
      let mainCategory: 'gravel' | 'sand' | 'dirt' | 'mulch' | 'base' = 'gravel';
      for (const cat of categories) {
        if (mainCategoryMap[cat]) {
          mainCategory = mainCategoryMap[cat];
          break;
        }
      }
      
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
      // FIX: Handle case where row doesn't have slug property
      const slug = row.slug || (row.name ? row.name.toLowerCase().replace(/\s+/g, '-') : `product-${index + 1}`);
      
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
                []
      };
    });
    
    console.log('Transformed products:', products);
    
    // Update cache
    productsCache = products;
    lastFetchTimestamp = Date.now();
    
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
export async function getProductById(id: number): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find(p => p.id === id);
}

/**
 * Get product by slug
 */
export async function getProductBySlug(slug: string): Promise<Product> {
  // This is a mock implementation. Replace with actual API call when ready
  const products = await getProducts();
  const product = products.find(p => p.slug === slug);
  
  if (!product) {
    throw new Error('Product not found');
  }
  
  return product;
}

/**
 * Fetch ZIP code pricing data from Supabase
 */
export async function getZipCodePricingMap(): Promise<Map<string, number>> {
  // Check cache first
  if (zipCodePricingCache && (Date.now() - lastFetchTimestamp < CACHE_TTL)) {
    return zipCodePricingCache;
  }

  try {
    console.log('Fetching ZIP code pricing data from Supabase...');
    
    const { data: zipData, error } = await supabase
      .from('service_zip_codes')
      .select('zip, price_adjustment');
      
    if (error) {
      throw error;
    }
    
    console.log('Raw ZIP code pricing data from Supabase:', zipData);
    
    // Transform raw data into a Map
    const zipPricingMap = new Map<string, number>();
    
    zipData.forEach(row => {
      const zipCode = row.zip?.trim();
      const adjustment = parseFloat(String(row.price_adjustment || "0"));
      
      if (zipCode && !isNaN(adjustment)) {
        zipPricingMap.set(zipCode, adjustment);
      }
    });
    
    console.log('Transformed ZIP code pricing data:', zipPricingMap);
    
    // Update cache
    zipCodePricingCache = zipPricingMap;
    lastFetchTimestamp = Date.now();
    
    return zipPricingMap;
  } catch (error) {
    console.error("Failed to fetch ZIP code pricing:", error);
    console.error("Error details:", {
      timestamp: new Date().toISOString(),
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    
    // Return cache even if expired or fallback to empty map
    return zipCodePricingCache || new Map();
  }
}

/**
 * Get price adjustment for a specific ZIP code
 * @returns Percentage adjustment (e.g., 10 for +10%, -5 for -5%)
 */
export async function getPriceAdjustmentForZipCode(zipCode: string): Promise<number> {
  try {
    console.log('Fetching price adjustment for ZIP:', zipCode);
    
    const { data, error } = await supabase
      .from('service_zip_codes')
      .select('price_adjustment')
      .eq('zip', zipCode)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching price adjustment:", error);
      return 0;
    }
    
    console.log('Price adjustment data:', data);
    return data?.price_adjustment || 0; // Default to 0% adjustment if ZIP not found
  } catch (error) {
    console.error("Error fetching price adjustment:", error);
    return 0;
  }
}

/**
 * Apply ZIP code pricing adjustment to a product price
 */
export function applyZipCodeAdjustment(basePrice: number, adjustment: number): number {
  // Adjustment is a percentage (e.g., 10 for +10%, -5 for -5%)
  const adjustedPrice = basePrice * (1 + adjustment / 100);
  return Math.round(adjustedPrice * 100) / 100; // Round to 2 decimal places
}

/**
 * Fetch ZIP codes data from Supabase
 */
export async function getZipCodes(): Promise<ZipCodeData[]> {
  // Check cache first
  if (zipCodesCache && (Date.now() - lastFetchTimestamp < CACHE_TTL)) {
    return zipCodesCache;
  }

  try {
    console.log('Fetching ZIP codes data from Supabase...');
    
    const { data: zipData, error } = await supabase
      .from('service_zip_codes')
      .select('*');
      
    if (error) {
      throw error;
    }
    
    console.log('Raw ZIP codes data from Supabase:', zipData.slice(0, 3)); // Log just first few for brevity
    
    // Transform raw data into ZipCodeData objects
    const zipCodes: ZipCodeData[] = zipData.map(row => ({
      zip: row.zip || "",
      lat: row.lat ? Number(row.lat) : 0,
      lng: row.lng ? Number(row.lng) : 0,
      city: row.city || "",
      state_id: row.state_id || "",
      state_name: row.state_name || "",
      population: row.population ? Number(row.population) : 0,
      density: row.density ? Number(row.density) : 0,
      county_fips: row.county_fips || "",
      county_name: row.county_name || "",
      county_names_all: row.county_names_all || "",
      county_fips_all: row.county_fips_all || "",
      timezone: row.timezone || ""
    }));
    
    console.log('Transformed ZIP codes data:', zipCodes.slice(0, 3)); // Log just first few for brevity
    
    // Update cache
    zipCodesCache = zipCodes;
    lastFetchTimestamp = Date.now();
    
    return zipCodes;
  } catch (error) {
    console.error("Failed to fetch ZIP codes:", error);
    console.error("Error details:", {
      timestamp: new Date().toISOString(),
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    
    // Return cache even if expired or fallback to empty array
    return zipCodesCache || [];
  }
}

/**
 * Check if a ZIP code is valid and in our service area
 * @returns Object containing validity and location info
 */
export async function validateZipCode(zipCode: string): Promise<{
  valid: boolean;
  inServiceArea: boolean;
  zipData?: ZipCodeData;
  priceAdjustment?: number;
}> {
  try {
    // Get the ZIP code data directly from Supabase
    const { data: zipData, error } = await supabase
      .from('service_zip_codes')
      .select('*')
      .eq('zip', zipCode)
      .maybeSingle();
      
    if (error) {
      throw error;
    }
    
    // ZIP is valid if it exists in our database
    const valid = !!zipData;
    
    // For now, we consider a ZIP to be in our service area if it has data in the service_zip_codes table
    const inServiceArea = valid;
    
    // Get price adjustment if the ZIP is in our service area
    let priceAdjustment: number | undefined = undefined;
    if (inServiceArea) {
      priceAdjustment = zipData?.price_adjustment || 0;
    }
    
    return {
      valid,
      inServiceArea,
      zipData: zipData ? {
        zip: zipData.zip,
        lat: Number(zipData.lat) || 0,
        lng: Number(zipData.lng) || 0,
        city: zipData.city,
        state_id: zipData.state_id,
        state_name: zipData.state_name,
        population: Number(zipData.population) || 0,
        density: Number(zipData.density) || 0,
        county_fips: zipData.county_fips,
        county_name: zipData.county_name,
        county_names_all: zipData.county_names_all,
        county_fips_all: zipData.county_fips_all,
        timezone: zipData.timezone
      } : undefined,
      priceAdjustment: inServiceArea ? priceAdjustment : undefined
    };
  } catch (error) {
    console.error("Error validating ZIP code:", error);
    return {
      valid: false,
      inServiceArea: false
    };
  }
}

/**
 * Find nearest ZIP codes to a given location
 * @param lat Latitude
 * @param lng Longitude
 * @param limit Maximum number of results
 * @returns Nearest ZIP codes with distances
 */
export async function findNearestZipCodes(
  lat: number, 
  lng: number, 
  limit: number = 5
): Promise<Array<ZipCodeData & { distance: number }>> {
  const zipCodes = await getZipCodes();
  
  // Calculate distance for each ZIP code
  const zipCodesWithDistance = zipCodes.map(zip => {
    const distance = calculateDistance(lat, lng, zip.lat, zip.lng);
    return { ...zip, distance };
  });
  
  // Sort by distance and take the top results
  return zipCodesWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in miles
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Get service areas grouped by state
 */
export async function getServiceAreasByState(): Promise<Record<string, ZipCodeData[]>> {
  try {
    // Fetch all service ZIP codes from Supabase
    const { data: zipData, error } = await supabase
      .from('service_zip_codes')
      .select('*');
      
    if (error) {
      throw error;
    }
    
    // Transform and group by state
    const serviceAreas: Record<string, ZipCodeData[]> = {};
    
    zipData.forEach(row => {
      const zipCodeData: ZipCodeData = {
        zip: row.zip || "",
        lat: Number(row.lat) || 0,
        lng: Number(row.lng) || 0,
        city: row.city || "",
        state_id: row.state_id || "",
        state_name: row.state_name || "",
        population: Number(row.population) || 0,
        density: Number(row.density) || 0,
        county_fips: row.county_fips || "",
        county_name: row.county_name || "",
        county_names_all: row.county_names_all || "",
        county_fips_all: row.county_fips_all || "",
        timezone: row.timezone || ""
      };
      
      const state = zipCodeData.state_name || 'Other';
      
      if (!serviceAreas[state]) {
        serviceAreas[state] = [];
      }
      
      serviceAreas[state].push(zipCodeData);
    });
    
    return serviceAreas;
  } catch (error) {
    console.error("Error fetching service areas by state:", error);
    return {};
  }
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

// Re-export types from productTypes for convenience
export { type Product, type ZipCodeData };
