import { describe, expect, it } from 'vitest';
import { CATEGORY_ROUTE_SUFFIX, METROS, categoryFromRouteSegment, getMetro } from './index';

describe('METROS', () => {
  it('contains DFW and Long Island, in that order', () => {
    expect(METROS.map(m => m.slug)).toEqual(['dallas-fort-worth', 'long-island']);
  });

  it.each(METROS)('$slug: every zone zip is a 5-digit string', metro => {
    for (const zone of metro.zones) {
      for (const zip of zone.zips) {
        expect(zip).toMatch(/^\d{5}$/);
      }
    }
  });

  it.each(METROS)('$slug: no zip appears in more than one zone', metro => {
    const seen = new Map<string, string>();
    for (const zone of metro.zones) {
      for (const zip of zone.zips) {
        const owner = seen.get(zip);
        expect(owner, `zip ${zip} is in both ${owner} and ${zone.slug}`).toBeUndefined();
        seen.set(zip, zone.slug);
      }
    }
  });

  it.each(METROS)('$slug: every category has at least one popular variant', metro => {
    for (const category of metro.categories) {
      expect(category.variants.some(v => v.popular)).toBe(true);
    }
  });

  it.each(METROS)('$slug: every town references a real zone', metro => {
    const zoneSlugs = new Set(metro.zones.map(z => z.slug));
    for (const town of metro.towns) {
      expect(zoneSlugs.has(town.zoneSlug)).toBe(true);
    }
  });

  it.each(METROS)('$slug: every town zip is a 5-digit string', metro => {
    for (const town of metro.towns) {
      expect(town.zip).toMatch(/^\d{5}$/);
    }
  });
});

describe('getMetro', () => {
  it('finds a metro by slug', () => {
    expect(getMetro('dallas-fort-worth')?.shortName).toBe('DFW');
    expect(getMetro('long-island')?.shortName).toBe('Long Island');
  });

  it('returns undefined for an unknown slug', () => {
    expect(getMetro('nope')).toBeUndefined();
  });
});

describe('categoryFromRouteSegment', () => {
  it('maps known category route segments back to slugs', () => {
    expect(categoryFromRouteSegment('mulch-delivery')).toBe('mulch');
    expect(categoryFromRouteSegment('gravel-delivery')).toBe('gravel');
    expect(categoryFromRouteSegment('sand-delivery')).toBe('sand');
    expect(categoryFromRouteSegment('soil-delivery')).toBe('soil');
  });

  it('uses CATEGORY_ROUTE_SUFFIX', () => {
    expect(`mulch${CATEGORY_ROUTE_SUFFIX}`).toBe('mulch-delivery');
  });

  it('returns undefined for unknown or malformed segments', () => {
    expect(categoryFromRouteSegment('mulch')).toBeUndefined();
    expect(categoryFromRouteSegment('concrete-delivery')).toBeUndefined();
    expect(categoryFromRouteSegment('')).toBeUndefined();
  });
});
