
/**
 * Converts relative image paths to absolute URLs
 * @param imagePath - The image path (can be relative or absolute)
 * @param baseUrl - The base URL to use for relative paths (optional, defaults to current origin)
 * @returns Absolute URL string
 */
export const convertToAbsoluteUrl = (imagePath: string, baseUrl?: string): string => {
  // If the path is already absolute (starts with http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If no baseUrl is provided, use current window origin or fallback
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://6cc236ee-8c17-42f6-b0da-a561155753fa.lovableproject.com');
  
  // Handle relative paths that start with /
  if (imagePath.startsWith('/')) {
    return `${origin}${imagePath}`;
  }
  
  // Handle relative paths without leading /
  return `${origin}/${imagePath}`;
};

/**
 * Converts multiple image paths to absolute URLs
 * @param imagePaths - Array of image paths
 * @param baseUrl - The base URL to use for relative paths (optional)
 * @returns Array of absolute URL strings
 */
export const convertMultipleToAbsoluteUrls = (imagePaths: string[], baseUrl?: string): string[] => {
  return imagePaths.map(path => convertToAbsoluteUrl(path, baseUrl));
};
