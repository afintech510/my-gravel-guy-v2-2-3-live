
import { fetchSheetData } from "../utils/googleSheets";
import { calculateDistance } from "./utils/locationUtils";

// Cache configuration
let zipCodePricingCache: Map<string, number> | null = null;
let zipCodesCache: ZipCodeData[] | null = null;
let lastFetchTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

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
    const rawZipData = await fetchSheetData("1f-9eFHdoSETcV79k1lkEFTNSZ9ZXCDJqPbRWquiZByI", "ZipCodeLookup");
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
    
    // Update cache
    zipCodePricingCache = zipPricingMap;
    lastFetchTimestamp = Date.now();
    
    return zipPricingMap;
  } catch (error) {
    console.error("Failed to fetch ZIP code pricing:", error);
    return zipCodePricingCache || new Map();
  }
}

/**
 * Get price adjustment for a specific ZIP code
 */
export async function getPriceAdjustmentForZipCode(zipCode: string): Promise<number> {
  const pricingMap = await getZipCodePricingMap();
  return pricingMap.get(zipCode) || 0;
}

/**
 * Apply ZIP code pricing adjustment to a product price
 */
export function applyZipCodeAdjustment(basePrice: number, adjustment: number): number {
  const adjustedPrice = basePrice * (1 + adjustment / 100);
  return Math.round(adjustedPrice * 100) / 100; // Round to 2 decimal places
}

/**
 * Fetch ZIP codes data
 */
export async function getZipCodes(): Promise<ZipCodeData[]> {
  if (zipCodesCache && (Date.now() - lastFetchTimestamp < CACHE_TTL)) {
    return zipCodesCache;
  }

  try {
    const rawZipData = await fetchSheetData("1f-9eFHdoSETcV79k1lkEFTNSZ9ZXCDJqPbRWquiZByI", "Zipcodes");
    
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
    
    zipCodesCache = zipCodes;
    lastFetchTimestamp = Date.now();
    
    return zipCodes;
  } catch (error) {
    console.error("Failed to fetch ZIP codes:", error);
    return zipCodesCache || [];
  }
}

/**
 * Find nearest ZIP codes to a given location
 */
export async function findNearestZipCodes(
  lat: number, 
  lng: number, 
  limit: number = 5
): Promise<Array<ZipCodeData & { distance: number }>> {
  const zipCodes = await getZipCodes();
  
  const zipCodesWithDistance = zipCodes.map(zip => {
    const distance = calculateDistance(lat, lng, zip.lat, zip.lng);
    return { ...zip, distance };
  });
  
  return zipCodesWithDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/**
 * Get service areas grouped by state
 */
export async function getServiceAreasByState(): Promise<Record<string, ZipCodeData[]>> {
  const pricingMap = await getZipCodePricingMap();
  const zipCodes = await getZipCodes();
  
  const serviceAreas: Record<string, ZipCodeData[]> = {};
  
  zipCodes.forEach(zip => {
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

