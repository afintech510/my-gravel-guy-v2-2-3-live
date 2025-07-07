/**
 * Utility functions for generating cart links and handling URL parameters
 */

export interface CartLinkParams {
  product: string | number;
  tons?: number;
  zipCode?: string;
  redirect?: string;
}

/**
 * Generate a cart link URL with the specified parameters
 * @param params - The parameters for the cart link
 * @param baseUrl - The base URL of the application (optional)
 * @returns The complete cart link URL
 */
export function generateCartLink(params: CartLinkParams, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  const url = new URL('/add-to-cart', base);
  
  // Add required product parameter
  url.searchParams.set('product', params.product.toString());
  
  // Add optional parameters
  if (params.tons && params.tons > 0) {
    url.searchParams.set('tons', Math.max(3, params.tons).toString());
  }
  
  if (params.zipCode) {
    url.searchParams.set('zipCode', params.zipCode);
  }
  
  if (params.redirect) {
    url.searchParams.set('redirect', params.redirect);
  }
  
  return url.toString();
}

/**
 * Validate cart link parameters
 * @param params - The parameters to validate
 * @returns Validation result with any errors
 */
export function validateCartLinkParams(params: CartLinkParams): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  // Validate product parameter
  if (!params.product) {
    errors.push('Product parameter is required');
  }
  
  // Validate tons parameter
  if (params.tons !== undefined) {
    if (isNaN(params.tons) || params.tons < 0) {
      errors.push('Tons must be a positive number');
    }
  }
  
  // Validate zip code parameter
  if (params.zipCode) {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    if (!zipRegex.test(params.zipCode)) {
      errors.push('Invalid zip code format');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Parse cart link parameters from URL search params
 * @param searchParams - URLSearchParams object
 * @returns Parsed and validated parameters
 */
export function parseCartLinkParams(searchParams: URLSearchParams): {
  params: CartLinkParams | null;
  errors: string[];
} {
  const params: CartLinkParams = {
    product: searchParams.get('product') || '',
    tons: parseInt(searchParams.get('tons') || '3'),
    zipCode: searchParams.get('zipCode') || undefined,
    redirect: searchParams.get('redirect') || undefined
  };
  
  const validation = validateCartLinkParams(params);
  
  return {
    params: validation.isValid ? params : null,
    errors: validation.errors
  };
}

/**
 * Example usage for Chatbase or other integrations
 */
export const EXAMPLE_CART_LINKS = {
  // Basic product link
  basicGravel: () => generateCartLink({
    product: 'crushed-gravel-57',
    tons: 5
  }),
  
  // Link with zip code for pricing
  gravelWithZip: (zipCode: string) => generateCartLink({
    product: 'crushed-gravel-57',
    tons: 5,
    zipCode
  }),
  
  // Link that redirects to checkout
  directToCheckout: (productId: string, tons: number, zipCode: string) => 
    generateCartLink({
      product: productId,
      tons,
      zipCode,
      redirect: '/checkout'
    }),
  
  // Link with minimum tons
  minimumOrder: (productId: string) => generateCartLink({
    product: productId,
    tons: 3  // Will be enforced as minimum
  })
};