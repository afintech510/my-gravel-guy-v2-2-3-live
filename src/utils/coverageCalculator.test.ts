import { describe, it, expect } from 'vitest';
import { calculateCoverage, formatCoverageText } from './coverageCalculator';

describe('calculateCoverage', () => {
  it('calculates coverage with default parameters (ratio=1.5, depth=3")', () => {
    // 1 ton / 1.5 = 0.667 cubic yards * 27 = 18 cubic feet / 0.25 = 72 sq ft
    expect(calculateCoverage(1)).toBe(72);
  });

  it('scales linearly with tons', () => {
    // 10 tons / 1.5 * 27 / 0.25 = 720
    expect(calculateCoverage(10)).toBe(720);
  });

  it('uses custom tonYardRatio', () => {
    // 1 ton / 1.4 * 27 / 0.25 = 77.14 -> rounds to 77
    expect(calculateCoverage(1, 1.4)).toBe(77);
  });

  it('uses custom depth', () => {
    // 1 ton / 1.5 * 27 / (6/12) = 0.667 * 27 / 0.5 = 36
    expect(calculateCoverage(1, 1.5, 6)).toBe(36);
  });

  it('returns 0 for 0 tons', () => {
    expect(calculateCoverage(0)).toBe(0);
  });

  it('handles large values', () => {
    // 100 tons / 1.5 * 27 / 0.25 = 7200
    expect(calculateCoverage(100)).toBe(7200);
  });

  it('handles fractional tons', () => {
    // 2.5 / 1.5 * 27 / 0.25 = 180
    expect(calculateCoverage(2.5)).toBe(180);
  });

  it('returns an integer (rounds)', () => {
    expect(Number.isInteger(calculateCoverage(1, 1.4))).toBe(true);
  });
});

describe('formatCoverageText', () => {
  it('formats coverage text with default depth', () => {
    expect(formatCoverageText(10)).toBe('Covers 720 sq ft at 3 inches deep');
  });

  it('formats coverage text with custom depth', () => {
    expect(formatCoverageText(10, 1.5, 6)).toBe('Covers 360 sq ft at 6 inches deep');
  });

  it('includes comma formatting for large numbers', () => {
    // 100 tons = 7,200 sq ft
    expect(formatCoverageText(100)).toContain('7,200');
  });
});
