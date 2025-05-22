
import { Product, ZipCodeData } from './types';

// In-memory cache with private variables
let _productsCache: Product[] | null = null;
let _zipCodePricingCache: Map<string, number> | null = null;
let _zipCodesCache: ZipCodeData[] | null = null;
let _lastFetchTimestamp = 0;
export const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

// Getter functions to access the cache
export function getProductsCache(): Product[] | null {
  return _productsCache;
}

export function getZipCodePricingCache(): Map<string, number> | null {
  return _zipCodePricingCache;
}

export function getZipCodesCache(): ZipCodeData[] | null {
  return _zipCodesCache;
}

export function getLastFetchTimestamp(): number {
  return _lastFetchTimestamp;
}

// Setter functions to update the cache
export function setProductsCache(products: Product[] | null): void {
  _productsCache = products;
}

export function setZipCodePricingCache(cache: Map<string, number> | null): void {
  _zipCodePricingCache = cache;
}

export function setZipCodesCache(cache: ZipCodeData[] | null): void {
  _zipCodesCache = cache;
}

export function updateLastFetchTimestamp(): void {
  _lastFetchTimestamp = Date.now();
}

// Reset cache (useful for testing)
export function resetCache(): void {
  _productsCache = null;
  _zipCodePricingCache = null;
  _zipCodesCache = null;
  _lastFetchTimestamp = 0;
}
