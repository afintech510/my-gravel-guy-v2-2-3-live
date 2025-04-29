
export interface DeliveryLocation {
  city: string;
  state: string;
  product_name?: string;
  lat: number;
  lng: number;
  region?: string;
  slug?: string;
  title?: string;
  description?: string;
}

/**
 * Helper function to generate a consistent slug from city and state
 * Works with both full state names and abbreviations
 */
export function generateLocationSlug(city: string, state: string): string {
  // Process the state to ensure we use standard 2-letter abbreviations
  let stateAbbr = state;
  
  // If the state is more than 2 characters, it's likely a full name, so use first 2 characters
  if (state.length > 2) {
    stateAbbr = state.substring(0, 2).toLowerCase();
  } else {
    // If already 2 characters, make sure it's lowercase
    stateAbbr = state.toLowerCase();
  }
  
  // Generate the slug with city name (lowercase, spaces replaced with dashes)
  // and the 2-letter state abbreviation
  console.log(`Generating slug for: ${city}, ${state} -> ${city.toLowerCase().replace(/\s+/g, '-')}-${stateAbbr}`);
  return `${city.toLowerCase().replace(/\s+/g, '-')}-${stateAbbr}`;
}
