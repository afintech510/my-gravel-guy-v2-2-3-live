import type {
  CategorySlug,
  DeliveryZone,
  LoadPlanEntry,
  MaterialCategory,
  MaterialVariant,
  Metro,
  QuoteInput,
  QuoteResult,
  Truck,
} from '../types';

// Delivered-price engine for metro pages.
// price = (material + delivery loads) × (1 + premium), rounded up; Saturday / rush add on top.
// Delivery cost follows the ELM model: first load full zone cost, extra loads discounted.

export const getCategory = (metro: Metro, slug: CategorySlug): MaterialCategory | undefined =>
  metro.categories.find(c => c.slug === slug);

export const getVariant = (category: MaterialCategory, slug: string): MaterialVariant | undefined =>
  category.variants.find(v => v.slug === slug);

export const getZone = (metro: Metro, slug: string): DeliveryZone | undefined =>
  metro.zones.find(z => z.slug === slug);

export const findZoneByZip = (metro: Metro, zip: string): DeliveryZone | undefined => {
  const clean = zip.trim().slice(0, 5);
  return metro.zones.find(z => z.zips.includes(clean));
};

/** Capacity of a truck expressed in the category's sell unit */
export const truckCapacity = (truck: Truck, category: MaterialCategory): number => {
  if (category.unit === 'ton') {
    return Math.min(truck.capacityTons, truck.capacityYards * category.tonsPerYard);
  }
  return Math.min(truck.capacityYards, truck.capacityTons / category.tonsPerYard);
};

/**
 * Split a quantity into truck loads: fill the largest truck while the remainder
 * exceeds it, then finish with the smallest truck that fits the remainder.
 */
export const planLoads = (quantity: number, trucks: Truck[], category: MaterialCategory): LoadPlanEntry[] => {
  if (quantity <= 0 || trucks.length === 0) return [];
  const bySize = [...trucks].sort((a, b) => truckCapacity(a, category) - truckCapacity(b, category));
  const largest = bySize[bySize.length - 1];
  const largestCap = truckCapacity(largest, category);

  const loads: LoadPlanEntry[] = [];
  let remaining = quantity;
  while (remaining > largestCap + 1e-9) {
    loads.push({ truck: largest, quantity: largestCap });
    remaining -= largestCap;
  }
  const finisher = bySize.find(t => truckCapacity(t, category) >= remaining - 1e-9) ?? largest;
  loads.push({ truck: finisher, quantity: Math.round(remaining * 100) / 100 });
  return loads;
};

const roundUpTo = (value: number, step: number): number =>
  step > 0 ? Math.ceil(value / step) * step : Math.round(value);

export const quote = (input: QuoteInput): QuoteResult | null => {
  const { metro, quantity } = input;
  const category = getCategory(metro, input.categorySlug);
  const variant = category && getVariant(category, input.variantSlug);
  const zone = getZone(metro, input.zoneSlug);
  if (!category || !variant || !zone || quantity <= 0) return null;

  const { premiumRate, additionalLoadDiscount, saturdayFeeRate, rushFeeRate, roundTo } = metro.pricing;

  const loads = planLoads(quantity, metro.trucks, category);
  const deliveryCost = loads.reduce((sum, load, i) => {
    const loadCost = zone.loadCost * load.truck.deliveryCostFactor;
    return sum + (i === 0 ? loadCost : loadCost * (1 - additionalLoadDiscount));
  }, 0);

  const materialCost = quantity * variant.nodePricePerUnit;
  const premium = (materialCost + deliveryCost) * premiumRate;
  const basePrice = roundUpTo(materialCost + deliveryCost + premium, roundTo);
  const saturdayFee = input.saturday ? roundUpTo(basePrice * saturdayFeeRate, roundTo) : 0;
  const rushFee = input.speed === 'rush' ? roundUpTo(basePrice * rushFeeRate, roundTo) : 0;

  return {
    unit: category.unit,
    quantity,
    loads,
    materialCost,
    deliveryCost,
    premium,
    basePrice,
    saturdayFee,
    rushFee,
    total: basePrice + saturdayFee + rushFee,
    pricePerUnit: basePrice / quantity,
    belowMinimum: quantity < zone.minUnits,
    minUnits: zone.minUnits,
  };
};

/** Lowest delivered price per unit across zones at a reference quantity — for "from $X" copy */
export const fromPricePerUnit = (
  metro: Metro,
  categorySlug: CategorySlug,
  variantSlug: string,
  referenceQuantity = 10,
): number | null => {
  const prices = metro.zones
    .map(zone => quote({ metro, categorySlug, variantSlug, quantity: referenceQuantity, zoneSlug: zone.slug }))
    .filter((q): q is QuoteResult => q !== null)
    .map(q => q.pricePerUnit);
  return prices.length ? Math.min(...prices) : null;
};

export const formatUnit = (unit: 'ton' | 'yd', quantity: number): string =>
  unit === 'ton' ? (quantity === 1 ? 'ton' : 'tons') : quantity === 1 ? 'yard' : 'yards';

/** Convert between tons and yards for the "≈" helper text */
export const convertQuantity = (quantity: number, category: MaterialCategory): { value: number; unit: 'ton' | 'yd' } =>
  category.unit === 'ton'
    ? { value: Math.round((quantity / category.tonsPerYard) * 10) / 10, unit: 'yd' }
    : { value: Math.round(quantity * category.tonsPerYard * 10) / 10, unit: 'ton' };

/** Coverage helper: area (sq ft) × depth (in) → quantity in the category's unit */
export const quantityForArea = (sqft: number, depthIn: number, category: MaterialCategory): number => {
  const cubicYards = (sqft * (depthIn / 12)) / 27;
  const qty = category.unit === 'ton' ? cubicYards * category.tonsPerYard : cubicYards;
  return Math.ceil(qty * 2) / 2; // round up to the nearest half unit
};
