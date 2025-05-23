
// Main barrel file to re-export everything from the individual modules
export * from './types';
export * from './productQueries';

// Export zipCode functions selectively to avoid naming conflicts
import * as zipCodeModule from './zipCode';
// Re-export everything EXCEPT the conflicting function
export const {
  validateZipCode,
  findNearestZipCodes,
  getServiceAreasByState,
  getZipCodes,
  getZipCodePricingMap
  // Intentionally not re-exporting getPriceAdjustmentForZipCode to avoid conflict
} = zipCodeModule;

// Export named functions from zipCode module with unique names
import { getPriceAdjustmentForZipCode as getPriceAdjustmentForZipCodeZipModule } from './zipCode';
export { getPriceAdjustmentForZipCodeZipModule };

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
