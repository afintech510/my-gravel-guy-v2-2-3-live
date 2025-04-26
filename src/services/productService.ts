import { fetchSheetData } from "../utils/googleSheets";

// The Google Sheet ID from your URL
const SHEET_ID = "1f-9eFHdoSETcV79k1lkEFTNSZ9ZXCDJqPbRWquiZByI";

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number; // price per ton
  image: string;
  category: 'gravel' | 'sand' | 'dirt';
  tonYardRatio: number; // conversion factor from cubic yards to tons
}

// In-memory cache with expiry
let productsCache: Product[] | null = null;
let zipCodePricingCache: Map<string, number> | null = null;
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
      tonYardRatio: parseFloat(row.tonYardRatio) || 1.5 // default ratio if not specified
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
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find(p => p.name.toLowerCase().replace(/\s+/g, '-') === slug);
}

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
