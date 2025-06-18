
export interface DeliveryLocation {
  id?: string;
  city: string;
  state: string;
  product_name?: string;
  lat: number;
  lng: number;
  region?: string;
  slug?: string;
  title?: string;
  description?: string;
  created_at?: string;
}

/**
 * Helper function to generate a consistent slug from city and state
 */
export function generateLocationSlug(city: string, state: string): string {
  return `${city.toLowerCase().replace(/\s+/g, '-')}-${state.toLowerCase().substring(0, 2)}`;
}
