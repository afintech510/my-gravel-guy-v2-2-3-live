
import { supabase } from '@/integrations/supabase/client';

/**
 * Save location search to database for analytics
 */
export async function saveLocationSearch(searchData: {
  search_text: string;
  zipcode: string | null;
  city: string | null;
  state: string | null;
}) {
  try {
    const { data, error } = await supabase
      .from('location_search')
      .insert([
        {
          search_text: searchData.search_text,
          zipcode: searchData.zipcode,
          city: searchData.city,
          state: searchData.state
        }
      ]);
      
    if (error) {
      console.error('Error saving location search:', error);
    }
    
    return !error;
  } catch (err) {
    console.error('Error saving location search:', err);
    return false;
  }
}
