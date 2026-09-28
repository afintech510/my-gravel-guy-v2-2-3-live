import { describe, expect, it } from 'vitest';
import { dallasFortWorth } from '../../metro/config/dallasFortWorth';
import { longIsland } from '../../metro/config/longIsland';
import { buildPriceBook, GOOGLE_PRODUCT_CATEGORY } from './priceBookExport';

describe('buildPriceBook', () => {
  it('produces one entry per metro, in the order given', () => {
    const book = buildPriceBook({ metros: [dallasFortWorth, longIsland] });
    expect(book.metros.map(m => m.slug)).toEqual(['dallas-fort-worth', 'long-island']);
  });

  it('carries zone slug/name/zips through unchanged from the metro config', () => {
    const book = buildPriceBook({ metros: [dallasFortWorth] });
    const zones = book.metros[0].zones;
    expect(zones.map(z => z.slug)).toEqual(dallasFortWorth.zones.map(z => z.slug));
    for (const zone of zones) {
      const source = dallasFortWorth.zones.find(z => z.slug === zone.slug)!;
      expect(zone.zips).toEqual(source.zips);
      expect(zone.name).toBe(source.name);
    }
  });

  it('emits one product per (category, variant), with a stable mgg-{metro}-{category}-{variant} id', () => {
    const book = buildPriceBook({ metros: [dallasFortWorth] });
    const expectedCount = dallasFortWorth.categories.reduce((n, c) => n + c.variants.length, 0);
    expect(book.metros[0].products).toHaveLength(expectedCount);

    const peaGravel = book.metros[0].products.find(p => p.variantSlug === 'pea-gravel');
    expect(peaGravel?.id).toBe('mgg-dallas-fort-worth-gravel-pea-gravel');
  });

  it('gives every product a zonePrice row per metro zone', () => {
    const book = buildPriceBook({ metros: [dallasFortWorth] });
    for (const product of book.metros[0].products) {
      expect(product.zonePrices).toHaveLength(dallasFortWorth.zones.length);
      expect(product.zonePrices.map(zp => zp.zoneSlug).sort()).toEqual(
        dallasFortWorth.zones.map(z => z.slug).sort(),
      );
    }
  });

  it('sets basePrice to the lowest zone price (the metro-wide "starting at" reference)', () => {
    const book = buildPriceBook({ metros: [dallasFortWorth] });
    for (const product of book.metros[0].products) {
      const lowest = Math.min(...product.zonePrices.map(zp => zp.referenceQuantityPrice));
      expect(product.basePrice).toBe(lowest);
      // and basePrice must never exceed any individual zone price
      for (const zp of product.zonePrices) {
        expect(product.basePrice).toBeLessThanOrEqual(zp.referenceQuantityPrice);
      }
    }
  });

  it('marks products out_of_stock when the metro price book is not yet confirmed', () => {
    // Both current metros have priceBookConfirmed: false as of this writing
    const book = buildPriceBook({ metros: [dallasFortWorth, longIsland] });
    for (const metro of book.metros) {
      for (const product of metro.products) {
        expect(product.availability).toBe('out_of_stock');
      }
    }
  });

  it('marks products in_stock only once status is live AND priceBookConfirmed is true', () => {
    const liveConfirmed = { ...dallasFortWorth, status: 'live' as const, priceBookConfirmed: true };
    const book = buildPriceBook({ metros: [liveConfirmed] });
    for (const product of book.metros[0].products) {
      expect(product.availability).toBe('in_stock');
    }
  });

  it('uses the reference quantity (default 10) for the title bundle and price, and a possibly-smaller minOrderQuantity per zone', () => {
    const book = buildPriceBook({ metros: [dallasFortWorth] });
    expect(book.referenceQuantity).toBe(10);
    const product = book.metros[0].products[0];
    expect(product.referenceQuantity).toBe(10);
    expect(product.title).toContain('10 ton');
    for (const zp of product.zonePrices) {
      expect(zp.minOrderQuantity).toBeGreaterThan(0);
      expect(zp.minOrderPrice).toBeGreaterThan(0);
    }
  });

  it('honors a custom referenceQuantity option', () => {
    const book = buildPriceBook({ metros: [dallasFortWorth], referenceQuantity: 5 });
    expect(book.referenceQuantity).toBe(5);
    expect(book.metros[0].products[0].referenceQuantity).toBe(5);
  });

  it('builds a link that points at the metro category-delivery page with a variant query param', () => {
    const book = buildPriceBook({ metros: [dallasFortWorth], siteBaseUrl: 'https://example.test' });
    const product = book.metros[0].products.find(p => p.variantSlug === 'pea-gravel')!;
    expect(product.link).toBe('https://example.test/dallas-fort-worth/gravel-delivery?variant=pea-gravel');
  });

  it('assigns a known google_product_category path for every category slug in use', () => {
    const book = buildPriceBook({ metros: [dallasFortWorth, longIsland] });
    for (const metro of book.metros) {
      for (const product of metro.products) {
        expect(product.googleProductCategory).toBe(GOOGLE_PRODUCT_CATEGORY[product.categorySlug]);
        expect(product.googleProductCategory.length).toBeGreaterThan(0);
      }
    }
  });

  it('sets brand and condition consistently', () => {
    const book = buildPriceBook({ metros: [dallasFortWorth], brand: 'Custom Brand' });
    for (const product of book.metros[0].products) {
      expect(product.brand).toBe('Custom Brand');
      expect(product.condition).toBe('new');
    }
  });

  it('is deterministic given an injected `now`', () => {
    const now = new Date('2026-09-28T00:00:00.000Z');
    const book = buildPriceBook({ metros: [dallasFortWorth], now });
    expect(book.generatedAt).toBe('2026-09-28T00:00:00.000Z');
  });
});
