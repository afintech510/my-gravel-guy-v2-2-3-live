import { describe, expect, it } from 'vitest';
import { dallasFortWorth } from '@/metro/config/dallasFortWorth';
import { longIsland } from '@/metro/config/longIsland';
import { getCategory } from '@/metro/lib/pricing';
import { calculateGravelQuantity, estimateDrivewayCost, REFERENCE_DRIVEWAY_SQFT, REFERENCE_DRIVEWAY_DEPTH_IN } from './drivewayEstimate';

describe('calculateGravelQuantity', () => {
  it('computes tons (rounded up to the nearest half) for a ton-priced category', () => {
    const category = getCategory(dallasFortWorth, 'gravel')!;
    // 50 x 12 ft at 4 in deep = 600 sq ft -> 7.4074 cubic yards -> 10.37 tons -> rounds up to 10.5
    const result = calculateGravelQuantity(50, 12, 4, category);
    expect(result.primaryUnit).toBe('ton');
    expect(result.primaryQuantity).toBe(10.5);
    expect(result.convertedUnit).toBe('yd');
    expect(result.convertedQuantity).toBe(7.5);
  });

  it('computes yards (rounded up to the nearest half) for a yard-priced category', () => {
    const category = getCategory(longIsland, 'gravel')!;
    const result = calculateGravelQuantity(50, 12, 4, category);
    expect(result.primaryUnit).toBe('yd');
    expect(result.primaryQuantity).toBe(7.5);
    expect(result.convertedUnit).toBe('ton');
    expect(result.convertedQuantity).toBe(10.5);
  });

  it('treats negative dimensions as zero rather than throwing', () => {
    const category = getCategory(dallasFortWorth, 'gravel')!;
    const result = calculateGravelQuantity(-10, 12, 4, category);
    expect(result.primaryQuantity).toBe(0);
  });

  it('matches the REFERENCE_DRIVEWAY constants used by the cost table (12 x 50 ft)', () => {
    expect(REFERENCE_DRIVEWAY_SQFT).toBe(600);
    expect(REFERENCE_DRIVEWAY_DEPTH_IN).toBe(4);
  });
});

describe('estimateDrivewayCost', () => {
  it('returns a live, computed estimate for a known DFW gravel variant', () => {
    const estimate = estimateDrivewayCost(dallasFortWorth, 'gravel', '57-limestone');
    expect(estimate).not.toBeNull();
    expect(estimate!.metroSlug).toBe('dallas-fort-worth');
    expect(estimate!.unit).toBe('ton');
    expect(estimate!.quantity).toBe(10.5);
    expect(estimate!.pricePerUnit).toBeGreaterThan(0);
    expect(estimate!.total).toBeGreaterThan(0);
    expect(estimate!.priceBookConfirmed).toBe(false);
  });

  it('returns a live, computed estimate for a known Long Island gravel variant', () => {
    const estimate = estimateDrivewayCost(longIsland, 'gravel', 'bluestone-34');
    expect(estimate).not.toBeNull();
    expect(estimate!.metroSlug).toBe('long-island');
    expect(estimate!.unit).toBe('yd');
    expect(estimate!.quantity).toBe(7.5);
    expect(estimate!.pricePerUnit).toBeGreaterThan(0);
  });

  it('returns null for an unknown variant slug', () => {
    expect(estimateDrivewayCost(dallasFortWorth, 'gravel', 'not-a-real-variant')).toBeNull();
  });

  it('returns null for an unknown category slug', () => {
    // @ts-expect-error deliberately invalid category slug for the null-path test
    expect(estimateDrivewayCost(dallasFortWorth, 'not-a-category', '57-limestone')).toBeNull();
  });
});
