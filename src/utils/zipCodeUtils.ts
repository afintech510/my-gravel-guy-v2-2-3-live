
import { supabase } from '@/integrations/supabase/client';
import { ZipCodeData } from '../services/productTypes';
import { toast } from "@/components/ui/use-toast";

/**
 * Attempts to find a ZIP code match in the database
 */
export const findZipCodeMatch = async (searchValue: string): Promise<ZipCodeData | null> => {
  console.log('Searching for:', searchValue);
  
  // First try exact match on zip code
  let { data: zipData, error: zipError } = await supabase
    .from('service_zip_codes')
    .select('*')
    .eq('zip', searchValue)
    .maybeSingle();
  
  console.log('ZIP exact match result:', { zipData, zipError });
  
  // If no zip match, try city
  if (!zipData) {
    const { data: cityData, error: cityError } = await supabase
      .from('service_zip_codes')
      .select('*')
      .ilike('city', `${searchValue}%`)
      .limit(1);
      
    console.log('City search result:', { cityData, cityError });
    
    if (cityData && cityData.length > 0) {
      zipData = cityData[0];
    } else {
      // Try state as last resort
      const { data: stateData, error: stateError } = await supabase
        .from('service_zip_codes')
        .select('*')
        .or(`state_id.ilike.${searchValue}%,state_name.ilike.${searchValue}%`)
        .limit(1);
        
      console.log('State search result:', { stateData, stateError });
      
      if (stateData && stateData.length > 0) {
        zipData = stateData[0];
      }
    }
  }

  // If we've found a match, format and return it
  if (zipData) {
    return formatZipCodeData(zipData);
  }
  
  return null;
};

/**
 * Finds ZIP code suggestions based on input value
 */
export const findZipCodeSuggestions = async (value: string): Promise<ZipCodeData[]> => {
  if (value.length < 2) return [];
  
  try {
    console.log('Searching for suggestions:', value);
    // Search for suggestions in zip codes, cities, and states
    const { data, error } = await supabase
      .from('service_zip_codes')
      .select('*')
      .or(`zip.ilike.${value}%,city.ilike.${value}%,state_id.ilike.${value}%,state_name.ilike.${value}%`)
      .limit(5);
      
    console.log('Suggestions result:', { data, error });
    
    if (data && data.length > 0) {
      // Convert to ZipCodeData format with proper type conversion
      return data.map(item => formatZipCodeData(item));
    }
    
    // Check if the table has any data
    if (value.length >= 3) {
      const { count } = await supabase
        .from('service_zip_codes')
        .select('*', { count: 'exact', head: true });
      
      console.log('ZIP codes count for suggestions:', count);
      
      if (count === 0) {
        // If table is empty, use demo suggestions
        return getDemoZipCodes();
      }
    }
  } catch (err) {
    console.error("Error fetching suggestions:", err);
  }
  
  return [];
};

/**
 * Formats raw database data into ZipCodeData object
 */
export const formatZipCodeData = (rawData: any): ZipCodeData => {
  return {
    zip: rawData.zip,
    lat: Number(rawData.lat) || 0,
    lng: Number(rawData.lng) || 0,
    city: rawData.city,
    state_id: rawData.state_id,
    state_name: rawData.state_name,
    population: Number(rawData.population) || 0,
    density: Number(rawData.density) || 0,
    county_fips: rawData.county_fips,
    county_name: rawData.county_name,
    county_names_all: rawData.county_names_all,
    county_fips_all: rawData.county_fips_all,
    timezone: rawData.timezone
  };
};

/**
 * Checks if any ZIP code data exists in the database
 */
export const checkZipCodeTableExists = async (): Promise<number> => {
  const { count, error: countError } = await supabase
    .from('service_zip_codes')
    .select('*', { count: 'exact', head: true });
    
  console.log('ZIP codes count in DB:', { count, countError });
  return count || 0;
};

/**
 * Returns demo ZIP codes for testing when database is empty
 */
export const getDemoZipCodes = (): ZipCodeData[] => {
  return [
    {
      zip: '90210',
      city: 'Beverly Hills',
      state_id: 'CA',
      state_name: 'California',
      lat: 34.0901,
      lng: -118.4065,
      timezone: 'America/Los_Angeles',
      population: 20000,
      density: 1000,
      county_fips: '123',
      county_name: 'Los Angeles',
      county_names_all: 'Los Angeles',
      county_fips_all: '123',
    },
    {
      zip: '10001',
      city: 'New York',
      state_id: 'NY',
      state_name: 'New York',
      lat: 40.7128,
      lng: -74.006,
      timezone: 'America/New_York',
      population: 8000000,
      density: 10000,
      county_fips: '456',
      county_name: 'New York',
      county_names_all: 'New York',
      county_fips_all: '456',
    }
  ];
};

/**
 * Gets a single demo ZIP code for testing when database is empty
 */
export const getDemoZipCode = (): ZipCodeData => {
  return {
    zip: '90210',
    city: 'Beverly Hills',
    state_id: 'CA',
    state_name: 'California',
    lat: 34.0901,
    lng: -118.4065,
    timezone: 'America/Los_Angeles',
    population: 20000,
    density: 1000,
    county_fips: '123',
    county_name: 'Los Angeles',
    county_names_all: 'Los Angeles',
    county_fips_all: '123',
  };
};

/**
 * Save location search to database
 */
export const saveLocationSearch = async (searchData: {
  search_text: string;
  zipcode?: string | null;
  city?: string | null;
  state?: string | null;
}) => {
  try {
    // Get IP address using ipify API
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    const ip_address = ipData.ip;
    
    // Get user agent
    const user_agent = navigator.userAgent;
    
    // Insert into location_search table
    await supabase.from('location_search').insert([{
      search_text: searchData.search_text,
      ip_address,
      user_agent,
      zipcode: searchData.zipcode || null,
      city: searchData.city || null,
      state: searchData.state || null,
    }]);
    
  } catch (error) {
    console.error("Error saving location search:", error);
  }
};
