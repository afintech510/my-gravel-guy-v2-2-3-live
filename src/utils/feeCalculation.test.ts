import { describe, it, expect } from 'vitest';
import { calculateTotalWithFees, formatCurrency, formatPercentage } from './feeCalculation';

describe('calculateTotalWithFees', () => {
  const baseInput = {
    baseTons: 10,
    pricePerTon: 100,
    expediteEnabled: false,
    saturdayEnabled: false,
  };

  describe('no fees enabled', () => {
    it('returns base total with multiplier of 1', () => {
      const result = calculateTotalWithFees(baseInput);
      expect(result.baseTotal).toBe(1000);
      expect(result.multiplier).toBe(1);
      expect(result.totalWithFees).toBe(1000);
      expect(result.expediteFeeAmount).toBe(0);
      expect(result.saturdayFeeAmount).toBe(0);
    });

    it('breakdown matches top-level values', () => {
      const result = calculateTotalWithFees(baseInput);
      expect(result.breakdown.base).toBe(result.baseTotal);
      expect(result.breakdown.expedite).toBe(result.expediteFeeAmount);
      expect(result.breakdown.saturday).toBe(result.saturdayFeeAmount);
      expect(result.breakdown.total).toBe(result.totalWithFees);
    });
  });

  describe('expedite fee only', () => {
    it('applies default 15% expedite fee', () => {
      const result = calculateTotalWithFees({ ...baseInput, expediteEnabled: true });
      expect(result.multiplier).toBe(1.15);
      expect(result.expediteFeeAmount).toBe(150);
      expect(result.saturdayFeeAmount).toBe(0);
      expect(result.totalWithFees).toBe(1150);
    });

    it('applies custom expedite percentage', () => {
      const result = calculateTotalWithFees({
        ...baseInput,
        expediteEnabled: true,
        expediteFeePct: 0.20,
      });
      expect(result.multiplier).toBe(1.20);
      expect(result.expediteFeeAmount).toBe(200);
      expect(result.totalWithFees).toBe(1200);
    });
  });

  describe('saturday fee only', () => {
    it('applies default 15% saturday fee', () => {
      const result = calculateTotalWithFees({ ...baseInput, saturdayEnabled: true });
      expect(result.multiplier).toBe(1.15);
      expect(result.saturdayFeeAmount).toBe(150);
      expect(result.expediteFeeAmount).toBe(0);
      expect(result.totalWithFees).toBe(1150);
    });
  });

  describe('both fees enabled (ADDITIVE model)', () => {
    it('adds fees additively, not compounded', () => {
      const result = calculateTotalWithFees({
        ...baseInput,
        expediteEnabled: true,
        saturdayEnabled: true,
      });
      // ADDITIVE: 1 + 0.15 + 0.15 = 1.30 (NOT 1.15 * 1.15 = 1.3225)
      expect(result.multiplier).toBeCloseTo(1.30, 5);
      expect(result.totalWithFees).toBeCloseTo(1300, 0);
      expect(result.expediteFeeAmount).toBeCloseTo(150, 0);
      expect(result.saturdayFeeAmount).toBeCloseTo(150, 0);
    });

    it('adds custom fees additively', () => {
      const result = calculateTotalWithFees({
        ...baseInput,
        expediteEnabled: true,
        saturdayEnabled: true,
        expediteFeePct: 0.10,
        saturdayFeePct: 0.20,
      });
      expect(result.multiplier).toBeCloseTo(1.30, 10);
      expect(result.totalWithFees).toBe(1300);
      expect(result.expediteFeeAmount).toBe(100);
      expect(result.saturdayFeeAmount).toBe(200);
    });
  });

  describe('edge cases', () => {
    it('handles 0 tons', () => {
      const result = calculateTotalWithFees({ ...baseInput, baseTons: 0 });
      expect(result.baseTotal).toBe(0);
      expect(result.totalWithFees).toBe(0);
    });

    it('handles fractional tons', () => {
      const result = calculateTotalWithFees({ ...baseInput, baseTons: 3.5 });
      expect(result.baseTotal).toBe(350);
    });
  });
});

describe('formatCurrency', () => {
  it('formats as USD with no decimals', () => {
    expect(formatCurrency(1000)).toBe('$1,000');
  });

  it('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0');
  });
});

describe('formatPercentage', () => {
  it('formats decimal as percentage', () => {
    expect(formatPercentage(0.15)).toBe('15%');
  });

  it('formats 100%', () => {
    expect(formatPercentage(1)).toBe('100%');
  });
});
