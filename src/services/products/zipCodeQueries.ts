import { supabase } from '@/integrations/supabase/client';
import { ZipCodeData } from './types';
import { 
  getZipCodePricingCache, 
  setZipCodePricingCache,
  getZipCodesCache,
  setZipCodesCache,
  getLastFetchTimestamp,
  updateLastFetchTimestamp,
  CACHE_TTL 
} from './cache';

/**
 * Fetch ZIP code pricing data from Supabase
 */
export async function getZipCodePricingMap(): Promise<Map<string, number>> {
  // Check cache first
  const zipCodePricingCache = getZipCodePricingCache();
  const lastFetchTimestamp = getLastFetchTimestamp();
  
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
      const adjustment = parseFloat(String(row.price_adjustment || "1"));
      
      if (zipCode && !isNaN(adjustment)) {
        zipPricingMap.set(zipCode, adjustment);
      }
    });
    
    console.log('Transformed ZIP code pricing data:', zipPricingMap);
    
    // Update cache
    setZipCodePricingCache(zipPricingMap);
    updateLastFetchTimestamp();
    
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
 * @returns The multiplier directly (e.g., 1.2 for +20%, 0.95 for -5%)
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
      return 1; // FIXED: Changed from 0 to 1 to ensure no price adjustment on error
    }
    
    console.log('Price adjustment data:', data);
    
    // Return the adjustment directly as a multiplier
    // If no data or null/undefined price_adjustment, return 1 (no adjustment)
    return data?.price_adjustment ?? 1;
  } catch (error) {
    console.error("Error fetching price adjustment:", error);
    return 1; // Default to no adjustment (multiplier of 1)
  }
}

/**
 * Fetch ZIP codes data from Supabase
 */
export async function getZipCodes(): Promise<ZipCodeData[]> {
  // Check cache first
  const zipCodesCache = getZipCodesCache();
  const lastFetchTimestamp = getLastFetchTimestamp();
  
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
    setZipCodesCache(zipCodes);
    updateLastFetchTimestamp();
    
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
      priceAdjustment = zipData?.price_adjustment || 1;
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
