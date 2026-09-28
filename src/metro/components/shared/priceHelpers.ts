// Small presentation-layer helpers built on top of the pricing engine (owned by METRO-CORE).
// Kept here (component-owned) so UI-only aggregation logic doesn't creep into lib/pricing.ts.
import { fromPricePerUnit, quote } from '../../lib/pricing';
import type { MaterialCategory, MaterialVariant, DeliveryZone, Metro } from '../../types';

/** Cheapest "from $X/unit delivered" across every variant and zone in a category. */
export const categoryFromPrice = (metro: Metro, category: MaterialCategory, referenceQuantity = 10): number | null => {
  let best: number | null = null;
  for (const variant of category.variants) {
    const price = fromPricePerUnit(metro, category.slug, variant.slug, referenceQuantity);
    if (price != null && (best == null || price < best)) best = price;
  }
  return best;
};

/** Delivered price per unit for one variant in a specific zone. */
export const variantZonePrice = (
  metro: Metro,
  category: MaterialCategory,
  variant: MaterialVariant,
  zone: DeliveryZone,
  quantity = 10,
): number | null => {
  const result = quote({
    metro,
    categorySlug: category.slug,
    variantSlug: variant.slug,
    quantity,
    zoneSlug: zone.slug,
  });
  return result?.pricePerUnit ?? null;
};

/** The zone where a variant is cheapest at a reference quantity, plus that price. */
export const cheapestZoneForVariant = (
  metro: Metro,
  category: MaterialCategory,
  variant: MaterialVariant,
  quantity = 10,
): { zone: DeliveryZone; pricePerUnit: number; total: number } | null => {
  let best: { zone: DeliveryZone; pricePerUnit: number; total: number } | null = null;
  for (const zone of metro.zones) {
    const result = quote({ metro, categorySlug: category.slug, variantSlug: variant.slug, quantity, zoneSlug: zone.slug });
    if (!result) continue;
    if (!best || result.pricePerUnit < best.pricePerUnit) {
      best = { zone, pricePerUnit: result.pricePerUnit, total: result.total };
    }
  }
  return best;
};

export const formatMoney = (value: number): string =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: value % 1 === 0 ? 0 : 2 });
