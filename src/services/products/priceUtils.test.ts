import { describe, it, expect } from 'vitest';
import { applyZipCodeAdjustment } from './priceUtils';

describe('applyZipCodeAdjustment', () => {
  it('applies adjustment multiplier to base price', () => {
    expect(applyZipCodeAdjustment(100, 1.2)).toBe(120);
  });

  it('rounds to 2 decimal places', () => {
    expect(applyZipCodeAdjustment(100, 1.123)).toBe(112.3);
    expect(applyZipCodeAdjustment(99.99, 1.1)).toBe(109.99);
  });

  it('returns original price when adjustment is 0', () => {
    expect(applyZipCodeAdjustment(100, 0)).toBe(100);
  });

  it('returns original price when adjustment is NaN', () => {
    expect(applyZipCodeAdjustment(100, NaN)).toBe(100);
  });

  it('returns original price when adjustment is undefined', () => {
    expect(applyZipCodeAdjustment(100, undefined as any)).toBe(100);
  });

  it('handles adjustment of exactly 1 (no change)', () => {
    expect(applyZipCodeAdjustment(100, 1)).toBe(100);
  });

  it('handles adjustment less than 1 (discount)', () => {
    expect(applyZipCodeAdjustment(100, 0.8)).toBe(80);
  });

  it('handles zero base price', () => {
    expect(applyZipCodeAdjustment(0, 1.2)).toBe(0);
  });
});
