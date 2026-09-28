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

  it('applies the premium rate and rounds the base price up to roundTo', () => {
    const result = quote({
      metro: dallasFortWorth,
      categorySlug: 'gravel',
      variantSlug: 'pea-gravel',
      quantity: 10,
      zoneSlug: 'dfw-core',
    });
    expect(result).not.toBeNull();
    const peaGravelPrice = getVariant(dfwGravel, 'pea-gravel')!.nodePricePerUnit;
    const materialCost = 10 * peaGravelPrice;
    const deliveryCost = 85 * 1.8; // single load in the large truck (10t fits, but finisher picks smallest that fits)
    // recompute using the same truck-selection rule as planLoads to avoid hardcoding truck choice
    const loads = result!.loads;
    const expectedDelivery = loads.reduce(
      (sum, l, i) => sum + (i === 0 ? 85 * l.truck.deliveryCostFactor : 85 * l.truck.deliveryCostFactor * 0.75),
      0,
    );
    const { premiumRate } = dallasFortWorth.pricing;
    const expectedBase = Math.ceil((materialCost + expectedDelivery + (materialCost + expectedDelivery) * premiumRate) / 5) * 5;
    expect(result!.basePrice).toBe(expectedBase);
    expect(result!.basePrice % 5).toBe(0);
    void deliveryCost;
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
