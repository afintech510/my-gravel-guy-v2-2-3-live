
import { supabase } from '@/integrations/supabase/client';
import { ZipCodeData } from '../types';

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
