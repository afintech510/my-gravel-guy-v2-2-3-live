import { Product } from './productTypes';
import { fetchSheetData } from "../utils/googleSheets";

// The Google Sheet ID from your URL
const SHEET_ID = "1f-9eFHdoSETcV79k1lkEFTNSZ9ZXCDJqPbRWquiZByI";

export interface ZipCodeData {
  zip: string;
  lat: number;
  lng: number;
  city: string;
  state_id: string;
  state_name: string;
  population: number;
  density: number;
  county_fips: string;
  county_name: string;
  county_names_all: string;
  county_fips_all: string;
  timezone: string;
}

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

export { ZipCodeData };

/**
 * Fetch ZIP code pricing data
 */
export async function getZipCodePricingMap(): Promise<Map<string, number>> {
  // Check cache first
  if (zipCodePricingCache && (Date.now() - lastFetchTimestamp < CACHE_TTL)) {
    return zipCodePricingCache;
  }

  try {
    console.log('Fetching ZIP code pricing data from Google Sheets...');
    const rawZipData = await fetchSheetData(SHEET_ID, "ZipCodeLookup");
    console.log('Raw ZIP code pricing data:', rawZipData);
    
    // Transform raw data into a Map
    const zipPricingMap = new Map<string, number>();
    
    rawZipData.forEach(row => {
      const zipCode = row.zipCode?.trim();
      const adjustment = parseFloat(row.priceAdjustment || "0");
      
      if (zipCode && !isNaN(adjustment)) {
        zipPricingMap.set(zipCode, adjustment);
      }
    });
    
    console.log('Transformed ZIP code pricing data:', zipPricingMap);
    
    // Update cache
    zipCodePricingCache = zipPricingMap;
    
    return zipPricingMap;
  } catch (error) {
    console.error("Failed to fetch ZIP code pricing:", error);
    console.error("Error details:", {
      sheetId: SHEET_ID,
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
  const pricingMap = await getZipCodePricingMap();
  return pricingMap.get(zipCode) || 0; // Default to 0% adjustment if ZIP not found
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
 * Fetch ZIP codes data from Google Sheets
 */
export async function getZipCodes(): Promise<ZipCodeData[]> {
  // Check cache first
  if (zipCodesCache && (Date.now() - lastFetchTimestamp < CACHE_TTL)) {
    return zipCodesCache;
  }

  try {
    console.log('Fetching ZIP codes data from Google Sheets...');
    const rawZipData = await fetchSheetData(SHEET_ID, "Zipcodes");
    console.log('Raw ZIP codes data:', rawZipData.slice(0, 3)); // Log just first few for brevity
    
    // Transform raw data into ZipCodeData objects
    const zipCodes: ZipCodeData[] = rawZipData.map(row => ({
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
      sheetId: SHEET_ID,
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
    // Check if ZIP code is in our service area pricing
    const priceAdjustment = await getPriceAdjustmentForZipCode(zipCode);
    const inPricingTable = priceAdjustment !== 0 || zipCode === "00000"; // Special case for demo
    
    // Get ZIP code data for additional info
    const allZipCodes = await getZipCodes();
    const zipData = allZipCodes.find(z => z.zip === zipCode);
    
    // ZIP is valid if it exists in our database
    const valid = !!zipData;
    
    // For now, we consider a ZIP to be in our service area if it has pricing info
    // This can be expanded based on other criteria
    const inServiceArea = inPricingTable;
    
    return {
      valid,
      inServiceArea,
      zipData,
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
  const pricingMap = await getZipCodePricingMap();
  const zipCodes = await getZipCodes();
  
  // Filter and group by state
  const serviceAreas: Record<string, ZipCodeData[]> = {};
  
  zipCodes.forEach(zip => {
    // Only include ZIP codes that are in our pricing table
    if (pricingMap.has(zip.zip)) {
      const state = zip.state_name || 'Other';
      
      if (!serviceAreas[state]) {
        serviceAreas[state] = [];
      }
      
      serviceAreas[state].push(zip);
    }
  });
  
  return serviceAreas;
}

export {
  getPriceAdjustmentForZipCode,
  applyZipCodeAdjustment,
  getServiceAreasByState
};
