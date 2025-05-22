
import { supabase } from '@/integrations/supabase/client';
import { ZipCodeData } from '../types';

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
