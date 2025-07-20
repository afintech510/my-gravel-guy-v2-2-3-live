
export const extractZipCode = (address: string): string => {
  // Try to extract zip code from the end of the address string
  // Pattern 1: 5-digit or 5+4 digit zip code at the end
  const endZipMatch = address.match(/\b(\d{5}(-\d{4})?)\s*$/);
  if (endZipMatch) {
    return endZipMatch[1].split('-')[0]; // Return just the 5-digit part
  }
  
  // Pattern 2: Zip code after state abbreviation (common format)
  const stateZipMatch = address.match(/,\s*[A-Z]{2}\s+(\d{5}(-\d{4})?)/);
  if (stateZipMatch) {
    return stateZipMatch[1].split('-')[0]; // Return just the 5-digit part
  }
  
  // Pattern 3: Look for 5-digit numbers that are likely zip codes (not at beginning)
  const allFiveDigitMatches = address.match(/\b\d{5}\b/g);
  if (allFiveDigitMatches && allFiveDigitMatches.length > 0) {
    // Return the last 5-digit number found (most likely to be zip code)
    return allFiveDigitMatches[allFiveDigitMatches.length - 1];
  }
  
  return '';
};

export const createGoogleMapsSearchUrl = (address: string): string => {
  const zipCode = extractZipCode(address);
  
  if (zipCode) {
    // Search for "dirt and gravel" near the zip code
    return `https://www.google.com/maps/search/dirt+and+gravel+near+${zipCode}`;
  } else {
    // Fallback to searching the full address with dirt and gravel
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/search/dirt+and+gravel+${encodedAddress}`;
  }
};
