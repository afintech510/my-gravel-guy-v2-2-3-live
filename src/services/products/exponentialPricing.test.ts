import { describe, it, expect } from 'vitest';
import {
  calculateExponentialPrice,
  getExponentialPricingParams,
  calculateProductExponentialPrice,
} from './exponentialPricing';
import { Product } from './types';

// Minimal Product mock factory
function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'test-product',
    name: 'Test Gravel',
    description: 'Test description',
    price: 100,
    image: '/test.jpg',
    category: 'gravel',
    slug: 'test-gravel',
    tonYardRatio: 1.5,
    ...overrides,
  } as Product;
}

describe('calculateExponentialPrice', () => {
  it('calculates price using default parameters (a=400, b=-0.32, c=95)', () => {
    // For quantity=5: 400 * e^(-0.32 * 5) + 95 = 400 * 0.2019 + 95 ≈ 175.75
    // Rounded to nearest 10 = 180
    const price = calculateExponentialPrice(100, 5);
    expect(price).toBe(180);
  });

  it('clamps quantity to minimum of 1', () => {
    const priceAt0 = calculateExponentialPrice(100, 0);
    const priceAt1 = calculateExponentialPrice(100, 1);
    expect(priceAt0).toBe(priceAt1);
  });

  it('price decreases as quantity increases (volume discount)', () => {
    const priceAt3 = calculateExponentialPrice(100, 3);
    const priceAt10 = calculateExponentialPrice(100, 10);
    const priceAt20 = calculateExponentialPrice(100, 20);
    expect(priceAt3).toBeGreaterThan(priceAt10);
    expect(priceAt10).toBeGreaterThanOrEqual(priceAt20);
  });

  it('never goes below minimum price ($50 floor)', () => {
    const price = calculateExponentialPrice(100, 1000);
    expect(price).toBeGreaterThanOrEqual(50);
  });

  it('respects custom a, b, c parameters', () => {
    const price = calculateExponentialPrice(100, 5, 500, -0.5, 80);
    // 500 * e^(-0.5 * 5) + 80 = 500 * 0.0821 + 80 ≈ 121.04 → round to nearest 10 = 120
    expect(price).toBe(120);
  });

  it('rounds result to nearest 10', () => {
    const price = calculateExponentialPrice(100, 5);
    expect(price % 10).toBe(0);
  });

  it('uses basePrice * 0.5 as minimum when basePrice is high', () => {
    // basePrice = 200, minimum = max(200*0.5, 50) = 100
    const price = calculateExponentialPrice(200, 1000);
    expect(price).toBeGreaterThanOrEqual(100);
  });
});

describe('getExponentialPricingParams', () => {
  it('returns product-specific parameters when set', () => {
    const product = makeProduct({ pricing_a: 500, pricing_b: -0.5, pricing_c: 80 });
    const params = getExponentialPricingParams(product);
    expect(params).toEqual({ a: 500, b: -0.5, c: 80 });
  });

  it('returns defaults when product has no pricing params', () => {
    const product = makeProduct();
    const params = getExponentialPricingParams(product);
    expect(params).toEqual({ a: 400, b: -0.32, c: 95 });
  });

  it('fills in defaults for partially-set params', () => {
    const product = makeProduct({ pricing_a: 300 });
    const params = getExponentialPricingParams(product);
    expect(params.a).toBe(300);
    expect(params.b).toBe(-0.32);
    expect(params.c).toBe(95);
  });
});

describe('calculateProductExponentialPrice', () => {
  it('returns basePrice, multiplier, pricePerTon, and totalPrice', () => {
    const product = makeProduct({ price: 100 });
    const result = calculateProductExponentialPrice(product, 5);

    expect(result.basePrice).toBe(100);
    expect(result.pricePerTon).toBeGreaterThan(0);
    expect(result.totalPrice).toBeCloseTo(result.pricePerTon * 5, 0);
    expect(result.multiplier).toBeCloseTo(result.pricePerTon / 100, 1);
  });

  it('uses product-specific pricing params', () => {
    const defaultProduct = makeProduct({ price: 100 });
    const customProduct = makeProduct({ price: 100, pricing_a: 500, pricing_b: -0.5, pricing_c: 80 });

    const defaultResult = calculateProductExponentialPrice(defaultProduct, 5);
    const customResult = calculateProductExponentialPrice(customProduct, 5);

    expect(defaultResult.pricePerTon).not.toBe(customResult.pricePerTon);
  });
});
