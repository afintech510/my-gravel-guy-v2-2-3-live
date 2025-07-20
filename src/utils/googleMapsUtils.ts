
export const extractZipCode = (address: string): string => {
  // Extract 5-digit zip code from address string
  const zipMatch = address.match(/\b\d{5}\b/);
  return zipMatch ? zipMatch[0] : '';
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
