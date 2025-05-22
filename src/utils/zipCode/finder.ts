
import { supabase } from '@/integrations/supabase/client';
import { ZipCodeData } from '../../services/productTypes';
import { formatZipCodeData } from './formatter';
import { getDemoZipCodes, getDemoZipCode } from './demoData';

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
 * Checks if any ZIP code data exists in the database
 */
export const checkZipCodeTableExists = async (): Promise<number> => {
  const { count, error: countError } = await supabase
    .from('service_zip_codes')
    .select('*', { count: 'exact', head: true });
    
  console.log('ZIP codes count in DB:', { count, countError });
  return count || 0;
};
