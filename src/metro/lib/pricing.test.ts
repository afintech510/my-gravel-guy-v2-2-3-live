import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { dallasFortWorth } from '../config/dallasFortWorth';
import { longIsland } from '../config/longIsland';
import {
  convertQuantity,
  findZoneByZip,
  fromPricePerUnit,
  getCategory,
  getVariant,
  planLoads,
  quantityForArea,
  quote,
} from './pricing';

const dfwGravel = getCategory(dallasFortWorth, 'gravel')!;
const dfwMulch = getCategory(dallasFortWorth, 'mulch')!;

describe('planLoads', () => {
  it('splits 30 tons of DFW gravel into a full 24t load plus a 6t finisher', () => {
    const loads = planLoads(30, dallasFortWorth.trucks, dfwGravel);
    expect(loads).toHaveLength(2);
    expect(loads[0].truck.id).toBe('large');
    expect(loads[0].quantity).toBe(24);
    expect(loads[1].quantity).toBe(6);
  });

  it('splits 25 yards of DFW mulch into a full 20yd load plus a 5yd finisher', () => {
    const loads = planLoads(25, dallasFortWorth.trucks, dfwMulch);
    expect(loads).toHaveLength(2);
    expect(loads[0].truck.id).toBe('large');
    expect(loads[0].quantity).toBe(20);
    expect(loads[1].quantity).toBe(5);
  });

  it('uses a single load when the quantity fits in one truck', () => {
    const loads = planLoads(5, dallasFortWorth.trucks, dfwGravel);
    expect(loads).toHaveLength(1);
    expect(loads[0].quantity).toBe(5);
  });

  it('returns no loads for zero or negative quantity', () => {
    expect(planLoads(0, dallasFortWorth.trucks, dfwGravel)).toEqual([]);
    expect(planLoads(-5, dallasFortWorth.trucks, dfwGravel)).toEqual([]);
  });
});

describe('quote — DFW', () => {
  it('applies the 2nd-load delivery discount', () => {
    const result = quote({
      metro: dallasFortWorth,
      categorySlug: 'gravel',
      variantSlug: 'pea-gravel',
      quantity: 30,
      zoneSlug: 'dfw-core',
    });
    expect(result).not.toBeNull();
    const loads = result!.loads;
    expect(loads).toHaveLength(2);
    const firstLoadCost = dallasFortWorth.zones[0].loadCost * loads[0].truck.deliveryCostFactor;
    const secondLoadCost = dallasFortWorth.zones[0].loadCost * loads[1].truck.deliveryCostFactor * 0.75;
    expect(result!.deliveryCost).toBeCloseTo(firstLoadCost + secondLoadCost, 5);
  });

  it('applies the variant premium rate (tiered override) and rounds the base price up to roundTo', () => {
    const result = quote({
      metro: dallasFortWorth,
      categorySlug: 'gravel',
      variantSlug: 'pea-gravel',
      quantity: 10,
      zoneSlug: 'dfw-core',
    });
    expect(result).not.toBeNull();
    const peaGravelVariant = getVariant(dfwGravel, 'pea-gravel')!;
    const materialCost = 10 * peaGravelVariant.nodePricePerUnit;
    // recompute delivery using the same truck-selection rule as planLoads to avoid hardcoding truck choice
    const loads = result!.loads;
    const expectedDelivery = loads.reduce(
      (sum, l, i) => sum + (i === 0 ? 85 * l.truck.deliveryCostFactor : 85 * l.truck.deliveryCostFactor * 0.75),
      0,
    );
    // pea-gravel carries its own tiered premiumRate override (0.35) — confirm the engine
    // actually uses it, not the metro-wide default.
    expect(peaGravelVariant.premiumRate).toBeDefined();
    const cost = materialCost + expectedDelivery;
    const premiumPrice = cost * (1 + peaGravelVariant.premiumRate!);
    const { paymentFeeRate, paymentFeeFixed, minMarginPerOrder } = dallasFortWorth.pricing;
    const floorPrice = (cost + minMarginPerOrder! + paymentFeeFixed!) / (1 - paymentFeeRate!);
    const expectedBase = Math.ceil(Math.max(premiumPrice, floorPrice) / 5) * 5;
    expect(result!.basePrice).toBe(expectedBase);
    expect(result!.basePrice % 5).toBe(0);
  });

  it('adds Saturday and rush fees on top of the base price', () => {
    const base = quote({
      metro: dallasFortWorth,
      categorySlug: 'gravel',
      variantSlug: 'pea-gravel',
      quantity: 10,
      zoneSlug: 'dfw-core',
    })!;
    const withFees = quote({
      metro: dallasFortWorth,
      categorySlug: 'gravel',
      variantSlug: 'pea-gravel',
      quantity: 10,
      zoneSlug: 'dfw-core',
      saturday: true,
      speed: 'rush',
    })!;
    expect(withFees.saturdayFee).toBeGreaterThan(0);
    expect(withFees.rushFee).toBeGreaterThan(0);
    expect(withFees.total).toBe(withFees.basePrice + withFees.saturdayFee + withFees.rushFee);
    expect(base.saturdayFee).toBe(0);
    expect(base.rushFee).toBe(0);
  });

  it('flags orders below the zone minimum', () => {
    const result = quote({
      metro: dallasFortWorth,
      categorySlug: 'gravel',
      variantSlug: 'pea-gravel',
      quantity: 1,
      zoneSlug: 'dfw-core',
    });
    expect(result!.belowMinimum).toBe(true);
    expect(result!.minUnits).toBe(3);
  });

  it('returns null for an unknown zone, category or variant', () => {
    expect(
      quote({ metro: dallasFortWorth, categorySlug: 'gravel', variantSlug: 'pea-gravel', quantity: 5, zoneSlug: 'nope' }),
    ).toBeNull();
    expect(
      quote({ metro: dallasFortWorth, categorySlug: 'gravel', variantSlug: 'nope', quantity: 5, zoneSlug: 'dfw-core' }),
    ).toBeNull();
  });
});

describe('findZoneByZip', () => {
  it('finds the DFW core zone by zip', () => {
    expect(findZoneByZip(dallasFortWorth, '75201')?.slug).toBe('dfw-core');
  });

  it('finds the Long Island core zone by zip, tolerating a zip+4 suffix', () => {
    expect(findZoneByZip(longIsland, '11934-1234')?.slug).toBe('li-core');
  });

  it('returns undefined for a zip outside the metro', () => {
    expect(findZoneByZip(dallasFortWorth, '90210')).toBeUndefined();
  });
});

describe('fromPricePerUnit', () => {
  it('returns the lowest per-unit price across zones', () => {
    const price = fromPricePerUnit(dallasFortWorth, 'gravel', 'pea-gravel', 10);
    expect(price).not.toBeNull();
    const allPrices = dallasFortWorth.zones.map(
      z => quote({ metro: dallasFortWorth, categorySlug: 'gravel', variantSlug: 'pea-gravel', quantity: 10, zoneSlug: z.slug })!.pricePerUnit,
    );
    expect(price).toBe(Math.min(...allPrices));
  });

  it('returns null for an unknown category', () => {
    expect(fromPricePerUnit(dallasFortWorth, 'unknown' as never, 'pea-gravel')).toBeNull();
  });
});

describe('quantityForArea', () => {
  it('converts area + depth into a rounded-up quantity in the category unit', () => {
    // 100 sqft at 3in depth = 100*(3/12)/27 = 0.9259 cubic yards; gravel tonsPerYard 1.4 -> 1.296 tons -> rounds up to 1.5
    const qty = quantityForArea(100, 3, dfwGravel);
    expect(qty).toBe(1.5);
  });

  it('rounds up to the nearest half unit for yard-based categories', () => {
    const qty = quantityForArea(100, 3, dfwMulch);
    expect(qty).toBeGreaterThanOrEqual(0.9259);
    expect((qty * 2) % 1).toBe(0);
  });
});

describe('convertQuantity', () => {
  it('converts tons to yards for a ton-unit category', () => {
    const { value, unit } = convertQuantity(14, dfwGravel); // 14 tons / 1.4 = 10 yd
    expect(unit).toBe('yd');
    expect(value).toBe(10);
  });

  it('converts yards to tons for a yard-unit category', () => {
    const { value, unit } = convertQuantity(10, dfwMulch); // 10 yd * 0.3 = 3 tons
    expect(unit).toBe('ton');
    expect(value).toBe(3);
  });
});

describe('sample quotes referenced in the handoff log', () => {
  it('DFW 10 tons pea gravel, dfw-core', () => {
    const result = quote({
      metro: dallasFortWorth,
      categorySlug: 'gravel',
      variantSlug: 'pea-gravel',
      quantity: 10,
      zoneSlug: 'dfw-core',
    })!;
    expect(result.unit).toBe('ton');
    expect(result.total).toBeGreaterThan(0);
  });

  it('DFW 10 yd native hardwood mulch, dfw-core', () => {
    const result = quote({
      metro: dallasFortWorth,
      categorySlug: 'mulch',
      variantSlug: 'native-hardwood',
      quantity: 10,
      zoneSlug: 'dfw-core',
    })!;
    expect(result.unit).toBe('yd');
    expect(result.total).toBeGreaterThan(0);
  });

  it('LI 5 yd black mulch, li-core', () => {
    const result = quote({
      metro: longIsland,
      categorySlug: 'mulch',
      variantSlug: 'black-mulch',
      quantity: 5,
      zoneSlug: 'li-core',
    })!;
    expect(result.unit).toBe('yd');
    expect(result.belowMinimum).toBe(false);
  });

  it('LI 10 yd screened topsoil, li-east-end', () => {
    const result = quote({
      metro: longIsland,
      categorySlug: 'soil',
      variantSlug: 'screened-topsoil',
      quantity: 10,
      zoneSlug: 'li-east-end',
    })!;
    expect(result.unit).toBe('yd');
    expect(result.belowMinimum).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------
// DFW $250/order gross-profit floor (owner decision, 2026-09-28) —
// docs/metro/research/dfw-pricing-v3-floor.md.
// gross profit = basePrice - materialCost - deliveryCost - stripeFee(basePrice), where
// stripeFee(p) = p * paymentFeeRate + paymentFeeFixed.
// ---------------------------------------------------------------------------------------
describe('quote — DFW $250 margin floor', () => {
  const { paymentFeeRate, paymentFeeFixed, minMarginPerOrder } = dallasFortWorth.pricing;

  it('is configured only on DFW, not on Long Island', () => {
    expect(dallasFortWorth.pricing.minMarginPerOrder).toBe(250);
    expect(dallasFortWorth.pricing.paymentFeeRate).toBe(0.029);
    expect(dallasFortWorth.pricing.paymentFeeFixed).toBe(0.3);
    expect(longIsland.pricing.minMarginPerOrder).toBeUndefined();
    expect(longIsland.pricing.paymentFeeRate).toBeUndefined();
    expect(longIsland.pricing.paymentFeeFixed).toBeUndefined();
  });

  it('applies the floor for a small/cheap order (select-fill, min-qty, dfw-core) and clears >= $250 gross profit', () => {
    const soilCategory = getCategory(dallasFortWorth, 'soil')!;
    const zone = dallasFortWorth.zones.find(z => z.slug === 'dfw-core')!;
    const result = quote({
      metro: dallasFortWorth,
      categorySlug: 'soil',
      variantSlug: 'select-fill',
      quantity: zone.minUnits,
      zoneSlug: 'dfw-core',
    })!;
    expect(result).not.toBeNull();
    const variant = getVariant(soilCategory, 'select-fill')!;
    const cost = result.materialCost + result.deliveryCost;
    const premiumPrice = cost * (1 + variant.premiumRate!);
    const floorPrice = (cost + minMarginPerOrder! + paymentFeeFixed!) / (1 - paymentFeeRate!);
    expect(floorPrice).toBeGreaterThan(premiumPrice); // the floor, not the tiered premium, should bind here
    expect(result.marginFloorApplied).toBe(true);
    expect(result.estimatedGrossProfit).toBeGreaterThanOrEqual(minMarginPerOrder! - 1e-6);
  });

  it('does not apply the floor for a large, high-value order where the tiered premium already clears $250 (river-rock, 30 units, dfw-outer)', () => {
    const gravelCategory = getCategory(dallasFortWorth, 'gravel')!;
    const result = quote({
      metro: dallasFortWorth,
      categorySlug: 'gravel',
      variantSlug: 'river-rock',
      quantity: 30,
      zoneSlug: 'dfw-outer',
    })!;
    expect(result).not.toBeNull();
    const variant = getVariant(gravelCategory, 'river-rock')!;
    const cost = result.materialCost + result.deliveryCost;
    const premiumPrice = cost * (1 + variant.premiumRate!);
    const floorPrice = (cost + minMarginPerOrder! + paymentFeeFixed!) / (1 - paymentFeeRate!);
    expect(premiumPrice).toBeGreaterThan(floorPrice); // the tiered premium alone already clears the floor
    expect(result.marginFloorApplied).toBe(false);
    expect(result.estimatedGrossProfit).toBeGreaterThanOrEqual(minMarginPerOrder! - 1e-6);
  });

  it('premium always equals basePrice - materialCost - deliveryCost, even when the floor is what set basePrice', () => {
    const result = quote({
      metro: dallasFortWorth,
      categorySlug: 'soil',
      variantSlug: 'select-fill',
      quantity: 3,
      zoneSlug: 'dfw-core',
    })!;
    expect(result.marginFloorApplied).toBe(true);
    expect(result.premium).toBeCloseTo(result.basePrice - result.materialCost - result.deliveryCost, 6);
  });

  it('clears >= $250 estimated gross profit for every DFW SKU x zone x quantity combination', () => {
    const quantities = [3, 5, 10, 15, 20, 30]; // 3 == every DFW zone's minUnits today
    let checked = 0;
    for (const category of dallasFortWorth.categories) {
      for (const variant of category.variants) {
        for (const zone of dallasFortWorth.zones) {
          const zoneQuantities = new Set([zone.minUnits, ...quantities]);
          for (const quantity of zoneQuantities) {
            const result = quote({
              metro: dallasFortWorth,
              categorySlug: category.slug,
              variantSlug: variant.slug,
              quantity,
              zoneSlug: zone.slug,
            });
            expect(result).not.toBeNull();
            expect(result!.estimatedGrossProfit).toBeDefined();
            expect(
              result!.estimatedGrossProfit!,
              `${variant.slug} x ${zone.slug} x qty=${quantity}: gross profit ${result!.estimatedGrossProfit} < $250`,
            ).toBeGreaterThanOrEqual(minMarginPerOrder! - 1e-6);
            checked++;
          }
        }
      }
    }
    // 22 SKUs x 3 zones x 6 quantities (every DFW zone's minUnits today is 3, already in
    // the fixed quantities list, so the per-zone Set dedupes to 6, not 7)
    expect(checked).toBe(22 * 3 * 6);
  });
});

// ---------------------------------------------------------------------------------------
// Long Island must price EXACTLY as before the DFW $250 floor change — LI has no
// minMarginPerOrder/paymentFeeRate/paymentFeeFixed configured, so quote() should take the
// same premium-only code path it always did. Compared against a snapshot of every LI
// (category, variant, zone, quantity) quote taken immediately before this change.
// ---------------------------------------------------------------------------------------
describe('quote — Long Island unaffected by the DFW margin floor', () => {
  interface SnapshotEntry {
    unit: string;
    quantity: number;
    materialCost: number;
    deliveryCost: number;
    premium: number;
    basePrice: number;
    saturdayFee: number;
    rushFee: number;
    total: number;
    pricePerUnit: number;
    belowMinimum: boolean;
    minUnits: number;
    loadsCount: number;
  }

  const snapshotPath = join(dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'liQuotesSnapshot.json');
  const snapshot: Record<string, SnapshotEntry | null> = JSON.parse(readFileSync(snapshotPath, 'utf8'));
  const QUANTITIES = [1, 3, 5, 10, 15, 20, 30];

  it('snapshot fixture covers every LI (category, variant, zone, quantity) combination', () => {
    const expectedKeys = longIsland.categories.length
      ? longIsland.categories.reduce(
          (n, c) => n + c.variants.length * longIsland.zones.length * QUANTITIES.length,
          0,
        )
      : 0;
    expect(Object.keys(snapshot)).toHaveLength(expectedKeys);
  });

  it('every LI quote is byte-identical to its pre-change snapshot', () => {
    let checked = 0;
    for (const category of longIsland.categories) {
      for (const variant of category.variants) {
        for (const zone of longIsland.zones) {
          for (const quantity of QUANTITIES) {
            const key = `${category.slug}|${variant.slug}|${zone.slug}|${quantity}`;
            const before = snapshot[key];
            expect(before, `missing snapshot entry for ${key}`).not.toBeUndefined();
            const result = quote({
              metro: longIsland,
              categorySlug: category.slug,
              variantSlug: variant.slug,
              zoneSlug: zone.slug,
              quantity,
            });
            if (before === null) {
              expect(result).toBeNull();
            } else {
              expect(result).not.toBeNull();
              expect(result!.unit).toBe(before.unit);
              expect(result!.quantity).toBe(before.quantity);
              expect(result!.materialCost).toBe(before.materialCost);
              expect(result!.deliveryCost).toBe(before.deliveryCost);
              // `premium` is now always derived as basePrice - materialCost - deliveryCost
              // (a formula change that applies engine-wide, not just to DFW, so the floor's
              // uplift shows up as premium too) — recompute the pre-change equivalent from
              // the snapshot's own (unchanged) fields rather than comparing the old
              // pre-rounding `premium` value directly.
              expect(result!.premium).toBe(before.basePrice - before.materialCost - before.deliveryCost);
              expect(result!.basePrice).toBe(before.basePrice);
              expect(result!.saturdayFee).toBe(before.saturdayFee);
              expect(result!.rushFee).toBe(before.rushFee);
              expect(result!.total).toBe(before.total);
              expect(result!.pricePerUnit).toBe(before.pricePerUnit);
              expect(result!.belowMinimum).toBe(before.belowMinimum);
              expect(result!.minUnits).toBe(before.minUnits);
              expect(result!.loads).toHaveLength(before.loadsCount);
              // No margin floor exists on Long Island, so quote() must not add these fields.
              expect(result!.marginFloorApplied).toBeUndefined();
              expect(result!.estimatedGrossProfit).toBeUndefined();
            }
            checked++;
          }
        }
      }
    }
    expect(checked).toBe(Object.keys(snapshot).length);
  });
});
