import { describe, it, expect } from 'vitest';
import { generateCartLink, validateCartLinkParams, parseCartLinkParams } from './cartLinkUtils';

describe('generateCartLink', () => {
  it('generates URL with product parameter', () => {
    const url = generateCartLink({ product: 'crushed-gravel-57' }, 'https://example.com');
    expect(url).toBe('https://example.com/add-to-cart?product=crushed-gravel-57');
  });

  it('includes tons parameter when provided', () => {
    const url = generateCartLink({ product: 'gravel', tons: 5 }, 'https://example.com');
    expect(url).toContain('tons=5');
  });

  it('enforces minimum 3 tons', () => {
    const url = generateCartLink({ product: 'gravel', tons: 1 }, 'https://example.com');
    expect(url).toContain('tons=3');
  });

  it('includes zipCode parameter when provided', () => {
    const url = generateCartLink({ product: 'gravel', zipCode: '30301' }, 'https://example.com');
    expect(url).toContain('zipCode=30301');
  });

  it('includes redirect parameter when provided', () => {
    const url = generateCartLink({ product: 'gravel', redirect: '/checkout' }, 'https://example.com');
    expect(url).toContain('redirect=%2Fcheckout');
  });

  it('accepts numeric product IDs', () => {
    const url = generateCartLink({ product: 42 }, 'https://example.com');
    expect(url).toContain('product=42');
  });
});

describe('validateCartLinkParams', () => {
  it('returns valid for params with product', () => {
    const result = validateCartLinkParams({ product: 'gravel' });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('returns invalid when product is empty', () => {
    const result = validateCartLinkParams({ product: '' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Product parameter is required');
  });

  it('accepts valid 5-digit ZIP code', () => {
    const result = validateCartLinkParams({ product: 'gravel', zipCode: '30301' });
    expect(result.isValid).toBe(true);
  });

  it('accepts valid ZIP+4 format', () => {
    const result = validateCartLinkParams({ product: 'gravel', zipCode: '30301-1234' });
    expect(result.isValid).toBe(true);
  });

  it('rejects invalid ZIP code', () => {
    const result = validateCartLinkParams({ product: 'gravel', zipCode: 'ABCDE' });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid zip code format');
  });

  it('rejects negative tons', () => {
    const result = validateCartLinkParams({ product: 'gravel', tons: -1 });
    expect(result.isValid).toBe(false);
  });

  it('allows undefined tons (optional)', () => {
    const result = validateCartLinkParams({ product: 'gravel' });
    expect(result.isValid).toBe(true);
  });
});

describe('parseCartLinkParams', () => {
  it('parses product and tons from search params', () => {
    const params = new URLSearchParams('product=gravel&tons=5');
    const result = parseCartLinkParams(params);
    expect(result.params).not.toBeNull();
    expect(result.params!.product).toBe('gravel');
    expect(result.params!.tons).toBe(5);
  });

  it('defaults tons to 3 when not provided', () => {
    const params = new URLSearchParams('product=gravel');
    const result = parseCartLinkParams(params);
    expect(result.params!.tons).toBe(3);
  });

  it('returns null params with errors when product is missing', () => {
    const params = new URLSearchParams('tons=5');
    const result = parseCartLinkParams(params);
    expect(result.params).toBeNull();
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('parses optional zipCode', () => {
    const params = new URLSearchParams('product=gravel&zipCode=30301');
    const result = parseCartLinkParams(params);
    expect(result.params!.zipCode).toBe('30301');
  });

  it('parses redirect parameter', () => {
    const params = new URLSearchParams('product=gravel&redirect=/checkout');
    const result = parseCartLinkParams(params);
    expect(result.params!.redirect).toBe('/checkout');
  });
});
