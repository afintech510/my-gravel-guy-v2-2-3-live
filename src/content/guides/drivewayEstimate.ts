// Live driveway quantity/price estimates for the guides — deliberately re-uses the
// METRO-CORE pricing engine (src/metro/lib/pricing.ts) and price-helper aggregation
// (src/metro/components/shared/priceHelpers.ts) by import only. Nothing here hardcodes
// a dollar amount: every number is computed at render time from the current metro
// config, so DFW price-book updates land automatically without touching guide copy.
import { getCategory, quantityForArea, convertQuantity } from '@/metro/lib/pricing';
import { cheapestZoneForVariant } from '@/metro/components/shared/priceHelpers';
import type { CategorySlug, MaterialCategory, Metro, SellUnit } from '@/metro/types';

/** A common single-car driveway used as the worked example across guide pages: 12 x 50 ft. */
export const REFERENCE_DRIVEWAY_SQFT = 12 * 50;
/** Typical surface-stone depth for the worked example (see the depth-and-layers guide for the full layered build). */
export const REFERENCE_DRIVEWAY_DEPTH_IN = 4;

export interface DrivewayEstimate {
  metroName: string;
  metroSlug: string;
  variantName: string;
  quantity: number;
  unit: SellUnit;
  zoneName: string;
  pricePerUnit: number;
  total: number;
  /** false = this metro's price book is still a placeholder; label the number "estimated" in the UI. */
  priceBookConfirmed: boolean;
}

/**
 * Delivered-price estimate for a given metro/material/quantity, using the cheapest
 * zone for that variant (matches the "from $X" convention used on metro pages).
 * Returns null if the metro/category/variant combination or pricing can't be resolved.
 */
export function estimateDrivewayCost(
  metro: Metro,
  categorySlug: CategorySlug,
  variantSlug: string,
  sqft: number = REFERENCE_DRIVEWAY_SQFT,
  depthIn: number = REFERENCE_DRIVEWAY_DEPTH_IN,
): DrivewayEstimate | null {
  const category = getCategory(metro, categorySlug);
  if (!category) return null;
  const variant = category.variants.find(v => v.slug === variantSlug);
  if (!variant) return null;

  const quantity = quantityForArea(sqft, depthIn, category);
  const best = cheapestZoneForVariant(metro, category, variant, quantity);
  if (!best) return null;

  return {
    metroName: metro.name,
    metroSlug: metro.slug,
    variantName: variant.name,
    quantity,
    unit: category.unit,
    zoneName: best.zone.name,
    pricePerUnit: best.pricePerUnit,
    total: best.total,
    priceBookConfirmed: metro.priceBookConfirmed,
  };
}

export interface GravelQuantityResult {
  primaryQuantity: number;
  primaryUnit: SellUnit;
  convertedQuantity: number;
  convertedUnit: SellUnit;
}

/** Coverage math for the interactive calculator: length x width x depth -> tons and yards. */
export function calculateGravelQuantity(
  lengthFt: number,
  widthFt: number,
  depthIn: number,
  category: MaterialCategory,
): GravelQuantityResult {
  const sqft = Math.max(lengthFt, 0) * Math.max(widthFt, 0);
  const primaryQuantity = quantityForArea(sqft, Math.max(depthIn, 0), category);
  const converted = convertQuantity(primaryQuantity, category);
  return {
    primaryQuantity,
    primaryUnit: category.unit,
    convertedQuantity: converted.value,
    convertedUnit: converted.unit,
  };
}
