
import { supabase } from '@/integrations/supabase/client';
import { ZipCodeData } from '../../services/productTypes';
import { formatZipCodeData } from './formatter';

/**
 * Find a full match for the input (exact ZIP code or a city/state match)
 */
export async function findZipCodeMatch(input: string): Promise<ZipCodeData | null> {
  try {
    // First try exact ZIP code match
    if (/^\d{5}$/.test(input)) {
      const { data, error } = await supabase
        .from('service_zip_codes')
        .select('*')
        .eq('zip', input)
        .maybeSingle();
        
      if (!error && data) {
        return formatZipCodeData(data);
      }
    }
    
    // Then try city name match
    const { data: cityData, error: cityError } = await supabase
      .from('service_zip_codes')
      .select('*')
      .ilike('city', `${input.trim()}%`)
      .limit(1);
      
    if (!cityError && cityData && cityData.length > 0) {
      return formatZipCodeData(cityData[0]);
    }
    
    // Then try state match
    const { data: stateData, error: stateError } = await supabase
      .from('service_zip_codes')
      .select('*')
      .or(`state_id.eq.${input},state_name.ilike.${input.trim()}%`)
      .limit(1);
      
    if (!stateError && stateData && stateData.length > 0) {
      return formatZipCodeData(stateData[0]);
    }
    
    // No matching data found
    return null;
  } catch (err) {
    console.error('Error finding ZIP code match:', err);
    return null;
  }
}

/**
 * Get suggestions based on input (ZIP code, city, or state)
 */
export async function findZipCodeSuggestions(input: string): Promise<ZipCodeData[]> {
  try {
    if (input.length < 2) return [];
    
    const searchTerm = input.trim();
    
    // Search by ZIP, city, or state
    const { data, error } = await supabase
      .from('service_zip_codes')
      .select('*')
      .or(`zip.ilike.${searchTerm}%,city.ilike.${searchTerm}%,state_id.eq.${searchTerm.toUpperCase()},state_name.ilike.${searchTerm}%`)
      .limit(5);
      
    if (error || !data) {
      console.error('Error finding ZIP code suggestions:', error);
      return [];
    }
    
    return data.map(zipData => formatZipCodeData(zipData));
  } catch (err) {
    console.error('Error finding ZIP code suggestions:', err);
    return [];
  }
}

/**
 * Check if the service_zip_codes table exists and has data
 */
export async function checkZipCodeTableExists(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('service_zip_codes')
      .select('*', { count: 'exact', head: true });
      
    if (error) {
      console.error('Error checking ZIP code table:', error);
      return 0;
    }
    
    return count || 0;
  } catch (err) {
    console.error('Error checking ZIP code table:', err);
    return 0;
  }
}
