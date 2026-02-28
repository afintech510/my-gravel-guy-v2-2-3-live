import { describe, it, expect } from 'vitest';
import { extractBaseOrderId, hasOrderSuffix, getOrderPatternQuery, convertToOrderId } from './orderIdUtils';

describe('extractBaseOrderId', () => {
  describe('timestamp-based IDs (kept as-is)', () => {
    it('preserves CART-<timestamp> format', () => {
      expect(extractBaseOrderId('CART-1753829165052')).toBe('CART-1753829165052');
    });

    it('preserves QUOTE-<date>-<timestamp> format', () => {
      expect(extractBaseOrderId('QUOTE-20250730-1753905424')).toBe('QUOTE-20250730-1753905424');
    });

    it('preserves ORDER-<timestamp> format', () => {
      expect(extractBaseOrderId('ORDER-1753829165052')).toBe('ORDER-1753829165052');
    });
  });

  describe('traditional suffixed IDs (suffix removed)', () => {
    it('removes single-digit suffix from CART-123-1', () => {
      expect(extractBaseOrderId('CART-123-1')).toBe('CART-123');
    });

    it('removes single-digit suffix from CART-123-2', () => {
      expect(extractBaseOrderId('CART-123-2')).toBe('CART-123');
    });

    it('removes multi-digit suffix from CART-456-12', () => {
      expect(extractBaseOrderId('CART-456-12')).toBe('CART-456');
    });
  });

  describe('IDs without suffix', () => {
    it('returns CART-123 unchanged', () => {
      expect(extractBaseOrderId('CART-123')).toBe('CART-123');
    });
  });
});

describe('hasOrderSuffix', () => {
  it('returns false for 2-part IDs', () => {
    expect(hasOrderSuffix('CART-123')).toBe(false);
  });

  it('returns false for timestamp-based IDs', () => {
    expect(hasOrderSuffix('CART-1753829165052')).toBe(false);
  });

  it('returns true for traditional suffixed IDs', () => {
    expect(hasOrderSuffix('CART-123-1')).toBe(true);
    expect(hasOrderSuffix('CART-123-12')).toBe(true);
  });

  it('returns false when last segment is a long number (timestamp)', () => {
    expect(hasOrderSuffix('QUOTE-20250730-1753905424')).toBe(false);
  });
});

describe('getOrderPatternQuery', () => {
  it('generates SQL pattern for base order ID', () => {
    const pattern = getOrderPatternQuery('CART-123');
    expect(pattern).toBe('order_id.eq.CART-123,order_id.like.CART-123-%');
  });
});

describe('convertToOrderId', () => {
  it('converts CART- prefix to ORDER-', () => {
    expect(convertToOrderId('CART-1753829165052')).toBe('ORDER-1753829165052');
  });

  it('converts QUOTE- prefix to ORDER-', () => {
    expect(convertToOrderId('QUOTE-20250730-1753905424')).toBe('ORDER-20250730-1753905424');
  });

  it('returns ORDER- IDs unchanged', () => {
    expect(convertToOrderId('ORDER-123')).toBe('ORDER-123');
  });

  it('returns unknown prefixes unchanged', () => {
    expect(convertToOrderId('UNKNOWN-123')).toBe('UNKNOWN-123');
  });
});
