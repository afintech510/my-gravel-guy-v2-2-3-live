
/**
 * US Geographic targeting utilities for Google Shopping
 */

// Continental US states (48 states - excludes Alaska, Hawaii, and territories)
export const CONTINENTAL_US_STATES = [
  'AL', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'ID', 'IL', 'IN', 'IA', 'KS',
  'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT',
  'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

// ZIP code ranges for continental US validation
export const CONTINENTAL_US_ZIP_RANGES = [
  { min: '01001', max: '05544' }, // New England
  { min: '06001', max: '06999' }, // Connecticut
  { min: '07001', max: '08999' }, // New Jersey
  { min: '10001', max: '14999' }, // New York
  { min: '15001', max: '19999' }, // Pennsylvania
  { min: '20001', max: '20799' }, // Washington DC
  { min: '20801', max: '21999' }, // Maryland
  { min: '22001', max: '24699' }, // Virginia
  { min: '25001', max: '26999' }, // West Virginia
  { min: '27001', max: '28999' }, // North Carolina
  { min: '29001', max: '29999' }, // South Carolina
  { min: '30001', max: '31999' }, // Georgia
  { min: '32001', max: '34999' }, // Florida
  { min: '35001', max: '36999' }, // Alabama
  { min: '37001', max: '38599' }, // Tennessee
  { min: '38601', max: '39999' }, // Mississippi
  { min: '40001', max: '42799' }, // Kentucky
  { min: '43001', max: '45999' }, // Ohio
  { min: '46001', max: '47999' }, // Indiana
  { min: '48001', max: '49999' }, // Michigan
  { min: '50001', max: '52999' }, // Iowa
  { min: '53001', max: '54999' }, // Wisconsin
  { min: '55001', max: '56799' }, // Minnesota
  { min: '57001', max: '57999' }, // South Dakota
  { min: '58001', max: '58999' }, // North Dakota
  { min: '59001', max: '59999' }, // Montana
  { min: '60001', max: '62999' }, // Illinois
  { min: '63001', max: '65999' }, // Missouri
  { min: '66001', max: '67999' }, // Kansas
  { min: '68001', max: '69999' }, // Nebraska
  { min: '70001', max: '71499' }, // Louisiana
  { min: '71601', max: '72999' }, // Arkansas
  { min: '73001', max: '74999' }, // Oklahoma
  { min: '75001', max: '79999' }, // Texas
  { min: '80001', max: '81999' }, // Colorado
  { min: '82001', max: '83199' }, // Wyoming
  { min: '83201', max: '83999' }, // Idaho
  { min: '84001', max: '84999' }, // Utah
  { min: '85001', max: '86999' }, // Arizona
  { min: '87001', max: '88999' }, // New Mexico
  { min: '89001', max: '89999' }, // Nevada
  { min: '90001', max: '96199' }, // California
  { min: '97001', max: '97999' }, // Oregon
  { min: '98001', max: '99499' }  // Washington
];

/**
 * Check if a state is in the continental US
 */
export function isContinentalUSState(stateCode: string): boolean {
  return CONTINENTAL_US_STATES.includes(stateCode.toUpperCase());
}

/**
 * Check if a ZIP code is in the continental US
 */
export function isContinentalUSZipCode(zipCode: string): boolean {
  const cleanZip = zipCode.replace(/\D/g, '').padStart(5, '0');
  
  return CONTINENTAL_US_ZIP_RANGES.some(range => 
    cleanZip >= range.min && cleanZip <= range.max
  );
}

/**
 * Get regional label for continental US ZIP codes
 */
export function getContinentalUSRegion(zipCode: string): string {
  const firstDigit = zipCode.charAt(0);
  const regionMap: Record<string, string> = {
    '0': 'Northeast',
    '1': 'Northeast',
    '2': 'Southeast', 
    '3': 'Southeast',
    '4': 'Southeast',
    '5': 'Midwest',
    '6': 'South-Central',
    '7': 'South-Central',
    '8': 'Mountain-West',
    '9': 'West-Coast'
  };
  
  return regionMap[firstDigit] || 'Continental-US';
}

/**
 * Generate shipping configuration for continental US only
 */
export function generateUSShippingConfig() {
  return {
    country: 'US',
    regions: CONTINENTAL_US_STATES.map(state => ({
      state,
      shippingCost: 'Free', // Can be customized per region
      deliveryTime: '1-3 business days'
    })),
    excludedRegions: ['AK', 'HI', 'PR', 'VI', 'GU', 'AS', 'MP'], // Alaska, Hawaii, territories
    restrictions: [
      'Delivery limited to continental United States only',
      'No international shipping available',
      'Bulk materials require truck delivery access'
    ]
  };
}
