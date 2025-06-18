
export interface DeliveryLocation {
  id?: string;
  city: string;
  state: string;
  product_name?: string;
  lat?: number; // Make optional since some data might not have coordinates
  lng?: number; // Make optional since some data might not have coordinates
  region?: string;
  slug?: string;
  title?: string;
  description?: string;
  created_at?: string;
  zip_code?: string; // Add to match actual database structure
  is_active?: boolean; // Add to match actual database structure
}

/**
 * Helper function to generate a consistent slug from city and state
 */
export function generateLocationSlug(city: string, state: string): string {
  return `${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase().substring(0, 2)}`;
}

/**
 * Helper function to convert service_zip_codes data to DeliveryLocation
 */
export function convertToDeliveryLocation(data: any): DeliveryLocation {
  return {
    id: data.id,
    city: data.city,
    state: data.state_id || data.state,
    zip_code: data.zip || data.zip_code,
    is_active: data.is_active ?? true,
    created_at: data.created_at,
    // Set default coordinates if not available
    lat: data.lat || 0,
    lng: data.lng || 0,
  };
}
