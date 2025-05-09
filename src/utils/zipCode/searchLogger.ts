
import { supabase } from '@/integrations/supabase/client';

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
