
import { supabase } from '@/integrations/supabase/client';
import { ZipCodeData } from './productTypes';
import { formatZipCodeData, saveLocationSearch } from '../utils/zipCodeUtils';

/**
 * Function to detect user's location using IP address
 */
export const detectUserLocation = async (): Promise<{zipCode: string | null, zipCodeData: ZipCodeData | null}> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    if (data.postal && data.city && data.region) {
      console.log("Auto-detected location:", data);
      
      // Check if the detected zip code is in our service area
      const { data: zipData, error } = await supabase
        .from('service_zip_codes')
        .select('*')
        .eq('zip', data.postal)
        .maybeSingle();
        
      if (zipData) {
        // Found exact match for ZIP code
        const formattedZipData = formatZipCodeData(zipData);
        return { zipCode: data.postal, zipCodeData: formattedZipData };
      } else {
        // Try to find by city name if exact match not found
        const result = await findAlternativeLocation(data.city);
        return result;
      }
    }
  } catch (error) {
    console.error("Error detecting location:", error);
  }
  
  // If all else fails, find fallback location
  return findFallbackLocation();
};

/**
 * Find location by city name
 */
export const findAlternativeLocation = async (cityName: string): Promise<{zipCode: string | null, zipCodeData: ZipCodeData | null}> => {
  // Try to find by city name
  const { data: cityData, error: cityError } = await supabase
    .from('service_zip_codes')
    .select('*')
    .ilike('city', `${cityName}%`)
    .limit(1);
    
  if (cityData && cityData.length > 0) {
    // Found city match
    const formattedCityData = formatZipCodeData(cityData[0]);
    return { zipCode: cityData[0].zip, zipCodeData: formattedCityData };
  } else {
    return findFallbackLocation();
  }
};

/**
 * Find any service location as fallback
 */
export const findFallbackLocation = async (): Promise<{zipCode: string | null, zipCodeData: ZipCodeData | null}> => {
  // If no matches, just get any service location as fallback
  const { data: anyZipData, error: anyError } = await supabase
    .from('service_zip_codes')
    .select('*')
    .limit(1);
    
  if (anyZipData && anyZipData.length > 0) {
    const formattedAnyData = formatZipCodeData(anyZipData[0]);
    return { zipCode: anyZipData[0].zip, zipCodeData: formattedAnyData };
  }
  
  return { zipCode: null, zipCodeData: null };
};
