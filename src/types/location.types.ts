
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
  meta_description?: string;
  local_info?: string;
  delivery_info?: string;
  service_area?: string;
}

/**
 * Helper function to generate a consistent slug from city and state
 * Works with both full state names and abbreviations
 */
export function generateLocationSlug(city: string, state: string): string {
  if (!city || !state) {
    console.error('Missing city or state when generating slug:', { city, state });
    return '';
  }
  
  // Process the state to ensure we use standard 2-letter abbreviations
  let stateAbbr = state.trim();
  
  // Handle full state names by converting to abbreviations
  // This is a simplified mapping - in production you'd want a complete mapping
  const stateMapping: Record<string, string> = {
    'Alabama': 'al', 'Alaska': 'ak', 'Arizona': 'az', 'Arkansas': 'ar', 'California': 'ca',
    'Colorado': 'co', 'Connecticut': 'ct', 'Delaware': 'de', 'Florida': 'fl', 'Georgia': 'ga',
    'Hawaii': 'hi', 'Idaho': 'id', 'Illinois': 'il', 'Indiana': 'in', 'Iowa': 'ia',
    'Kansas': 'ks', 'Kentucky': 'ky', 'Louisiana': 'la', 'Maine': 'me', 'Maryland': 'md',
    'Massachusetts': 'ma', 'Michigan': 'mi', 'Minnesota': 'mn', 'Mississippi': 'ms', 'Missouri': 'mo',
    'Montana': 'mt', 'Nebraska': 'ne', 'Nevada': 'nv', 'New Hampshire': 'nh', 'New Jersey': 'nj',
    'New Mexico': 'nm', 'New York': 'ny', 'North Carolina': 'nc', 'North Dakota': 'nd', 'Ohio': 'oh',
    'Oklahoma': 'ok', 'Oregon': 'or', 'Pennsylvania': 'pa', 'Rhode Island': 'ri', 'South Carolina': 'sc',
    'South Dakota': 'sd', 'Tennessee': 'tn', 'Texas': 'tx', 'Utah': 'ut', 'Vermont': 'vt',
    'Virginia': 'va', 'Washington': 'wa', 'West Virginia': 'wv', 'Wisconsin': 'wi', 'Wyoming': 'wy'
  };

  if (stateAbbr.length > 2) {
    // Check if it's a full state name in our mapping
    const lowercaseState = stateAbbr.toLowerCase();
    const mappedAbbr = stateMapping[lowercaseState] || stateMapping[stateAbbr] || stateMapping[stateAbbr.charAt(0).toUpperCase() + stateAbbr.slice(1).toLowerCase()];
    
    if (mappedAbbr) {
      stateAbbr = mappedAbbr;
    } else {
      // If not in our mapping, use first two letters lowercase as fallback
      stateAbbr = stateAbbr.substring(0, 2).toLowerCase();
    }
  } else {
    // If already 2 characters, make sure it's lowercase
    stateAbbr = stateAbbr.toLowerCase();
  }
  
  // Generate the slug with city name (lowercase, spaces replaced with dashes)
  // and the 2-letter state abbreviation
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  const slug = `${citySlug}-${stateAbbr}`;
  
  console.log(`Generated slug for: ${city}, ${state} -> ${slug}`);
  return slug;
}

/**
 * Helper function to get state abbreviation from full state name
 */
export function getStateAbbreviation(stateName: string): string {
  const stateMapping: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
  };

  const lowercaseState = stateName.toLowerCase();
  return stateMapping[lowercaseState] || stateName.length > 2 ? stateName.substring(0, 2).toUpperCase() : stateName.toUpperCase();
}
