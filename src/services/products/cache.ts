
import { Product, ZipCodeData } from './types';

// In-memory cache with expiry
export let productsCache: Product[] | null = null;
export let zipCodePricingCache: Map<string, number> | null = null;
export let zipCodesCache: ZipCodeData[] | null = null;
export let lastFetchTimestamp = 0;
export const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// Reset cache (useful for testing)
export function resetCache() {
  productsCache = null;
  zipCodePricingCache = null;
  zipCodesCache = null;
  lastFetchTimestamp = 0;
}
