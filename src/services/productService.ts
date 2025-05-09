
import { Product, ZipCodeData } from './productTypes';
import { fetchSheetData } from "../utils/googleSheets";
import { supabase } from '@/integrations/supabase/client';

// The Google Sheet ID from your URL - will only be used for product data now
const SHEET_ID = "1f-9eFHdoSETcV79k1lkEFTNSZ9ZXCDJqPbRWquiZByI";

// In-memory cache with expiry
let productsCache: Product[] | null = null;
let zipCodePricingCache: Map<string, number> | null = null;
let zipCodesCache: ZipCodeData[] | null = null;
let lastFetchTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

/**
 * Fetch products from Google Sheets
 */
export async function getProducts(): Promise<Product[]> {
  // Check cache first
  if (productsCache && (Date.now() - lastFetchTimestamp < CACHE_TTL)) {
    return productsCache;
  }

  try {
    console.log('Fetching products from Google Sheets...');
    const rawProducts = await fetchSheetData(SHEET_ID, "Products");
    console.log('Raw products data:', rawProducts);
    
    // Transform raw data into Product objects
    const products: Product[] = rawProducts.map((row, index) => ({
      id: index + 1,
      name: row.name || `Product ${index + 1}`,
      description: row.description || "",
      price: parseFloat(row.price) || 0,
      image: row.image || "/placeholder.svg",
      category: (row.category as 'gravel' | 'sand' | 'dirt') || 'gravel',
      tonYardRatio: parseFloat(row.tonYardRatio) || 1.5, // default ratio if not specified
      slug: row.slug || row.name?.toLowerCase().replace(/\s+/g, '-') || `product-${index + 1}`,
      specifications: {
        density: row.density || "",
        size: row.size || "",
        color: row.color || "",
        coverage: row.coverage || ""
      },
      uses: row.uses ? row.uses.split(',').map((use: string) => use.trim()) : [],
      faqs: []
    }));
    
    console.log('Transformed products:', products);
    
    // Update cache
    productsCache = products;
    lastFetchTimestamp = Date.now();
    
    return products;
  } catch (error) {
    console.error("Failed to fetch products:", error);
    console.error("Error details:", {
      sheetId: SHEET_ID,
      timestamp: new Date().toISOString(),
      errorMessage: error instanceof Error ? error.message : String(error)
    });
    
    // Return cache even if expired or fallback to empty array
    return productsCache || [];
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
      const adjustment = parseFloat(row.price_adjustment || "0");
      
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
    const { data, error } = await supabase
      .from('service_zip_codes')
      .select('price_adjustment')
      .eq('zip', zipCode)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching price adjustment:", error);
      return 0;
    }
    
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
      lat: parseFloat(row.lat) || 0,
      lng: parseFloat(row.lng) || 0,
      city: row.city || "",
      state_id: row.state_id || "",
      state_name: row.state_name || "",
      population: parseInt(row.population) || 0,
      density: parseFloat(row.density) || 0,
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
        lat: zipData.lat,
        lng: zipData.lng,
        city: zipData.city,
        state_id: zipData.state_id,
        state_name: zipData.state_name,
        population: zipData.population,
        density: zipData.density,
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
        lat: parseFloat(row.lat) || 0,
        lng: parseFloat(row.lng) || 0,
        city: row.city || "",
        state_id: row.state_id || "",
        state_name: row.state_name || "",
        population: parseInt(row.population) || 0,
        density: parseFloat(row.density) || 0,
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

// Re-export types from productTypes for convenience
export { type Product, type ZipCodeData };
