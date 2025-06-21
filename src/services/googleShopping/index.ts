
// Main barrel file for Google Shopping integration
export * from './feedGenerator';
export * from './merchantCenter';

// Re-export the main classes for easy importing
export { GoogleShoppingFeedGenerator } from './feedGenerator';
export { GoogleMerchantCenterAPI } from './merchantCenter';

// Type exports
export type { GoogleShoppingProduct } from './feedGenerator';
export type { MerchantCenterConfig, ProductStatus } from './merchantCenter';
