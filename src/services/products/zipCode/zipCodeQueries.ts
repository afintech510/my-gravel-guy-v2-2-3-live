
import { supabase } from '@/integrations/supabase/client';
import { ZipCodeData } from '../types';
import { 
  getZipCodePricingCache, 
  setZipCodePricingCache,
  getZipCodesCache,
  setZipCodesCache,
  getLastFetchTimestamp,
  updateLastFetchTimestamp,
  CACHE_TTL 
} from '../cache';

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
      const adjustment = parseFloat(String(row.price_adjustment || "0"));
      
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
      return 0;
    }
    
    console.log('Price adjustment data:', data);
    
    // Important fix: Return the adjustment directly as a multiplier
    // Instead of treating it as a percentage, we assume it's stored as a direct multiplier
    return data?.price_adjustment || 1; // Default to no adjustment (multiplier of 1) if ZIP not found
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
