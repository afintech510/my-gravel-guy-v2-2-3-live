
// Main barrel file for Google Shopping integration
//
// Current, recommended path (metro/zone-aware, no browser-side Google credential):
//   priceBookExport.ts  — builds the zone-priced product list from src/metro/**
//   merchantApiClient.ts — calls the google-merchant-sync edge function (dry-run or live)
//
// `feedGenerator.ts` / `merchantCenter.ts` are DEPRECATED, not deleted:
//  - `merchantCenter.ts` calls the sunsetting Content API for Shopping v2.1 directly from
//    the browser with an OAuth token held in React state — see
//    docs/metro/research/ai-ads-and-google-shopping.md (B4) for why this is both a security
//    issue (exposed token) and, independently, heading to HTTP 410. Do not wire it to any
//    new UI; `merchantApiClient.ts` is the replacement.
//  - `feedGenerator.ts` still computes one flat national price (no metro/zone concept) and
//    is kept only for its still-useful XML export shape/formatting; it is not part of the
//    Merchant API sync path.
export * from './feedGenerator';
export * from './merchantCenter';
export * from './priceBookExport';
export * from './merchantApiClient';

// Re-export the main classes for easy importing
export { GoogleShoppingFeedGenerator } from './feedGenerator';
/** @deprecated calls the sunsetting Content API v2.1 directly; see file header above. */
export { GoogleMerchantCenterAPI } from './merchantCenter';

// Type exports
export type { GoogleShoppingProduct } from './feedGenerator';
export type { MerchantCenterConfig, ProductStatus } from './merchantCenter';
export type { PriceBook, PriceBookMetro, PriceBookProduct, PriceBookZone, PriceBookZonePrice } from './priceBookExport';
export type { MerchantSyncRequest, MerchantSyncResponse } from './merchantApiClient';
