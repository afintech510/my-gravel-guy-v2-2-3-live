
// Main barrel file to re-export everything from the individual modules
export * from './types';
export * from './productQueries';
export * from './zipCode';  // Export all from the zipCode directory

// Export pricingService functions with explicit naming to avoid conflicts
import { 
  getPriceTiersForProduct as getPriceTiersForProductService,
  getPriceMultiplierForQuantity,
  getPriceAdjustmentForZipCode as getPriceAdjustmentForZipCodeService,
  calculateFinalPrice as calculateFinalPriceService
} from './pricingService';

export {
  getPriceTiersForProductService,
  getPriceMultiplierForQuantity,
  getPriceAdjustmentForZipCodeService,
  calculateFinalPriceService
};

// Export pricingUtils functions
export * from './pricingUtils';
export * from './sampleData';
export * from './imageUtils';
export * from './priceUtils';
