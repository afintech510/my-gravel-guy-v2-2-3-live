import { describe, expect, it } from 'vitest';
import {
  DEPOSIT_AMOUNT_CENTS,
  amountsMatch,
  computeBaseAmountCents,
  computeExpectedTotalCents,
  computeItemFinalPricing,
  evaluateItemPrices,
  lineItemAmountCents,
} from './pricing';

describe('lineItemAmountCents / computeBaseAmountCents', () => {
  it('matches create-auth-hold/index.ts\'s per-item rounding (Math.round(price*100) * quantity)', () => {
    expect(lineItemAmountCents({ price: 49.99, quantity: 3 })).toBe(4999 * 3);
    expect(computeBaseAmountCents([{ price: 49.99, quantity: 3 }, { price: 10, quantity: 2 }])).toBe(
      4999 * 3 + 1000 * 2,
    );
  });

  it('computeExpectedTotalCents uses the flat $199 deposit regardless of item prices', () => {
    const items = [{ price: 999, quantity: 40 }];
    expect(computeExpectedTotalCents(items, true)).toBe(DEPOSIT_AMOUNT_CENTS);
    expect(computeExpectedTotalCents(items, false)).toBe(lineItemAmountCents(items[0]));
  });
});

describe('amountsMatch', () => {
  it('accepts exact matches and a 1-cent tolerance, rejects everything else', () => {
    expect(amountsMatch(1000, 1000)).toBe(true);
    expect(amountsMatch(1001, 1000)).toBe(true);
    expect(amountsMatch(999, 1000)).toBe(true);
    expect(amountsMatch(1002, 1000)).toBe(false);
    expect(amountsMatch(null, 1000)).toBe(false);
    expect(amountsMatch(undefined, 1000)).toBe(false);
  });
});

describe('evaluateItemPrices', () => {
  it('is always ok for deposit checkouts, regardless of per-item price', () => {
    const result = evaluateItemPrices(
      [{ id: 'p1', name: 'Gravel', price: 0.01, quantity: 40 }],
      [{ id: 'p1', price: 999 }],
      true,
    );
    expect(result.verdict).toBe('ok');
  });

  it('flags the named threat: a near-zero submitted price against a real DB price', () => {
    const result = evaluateItemPrices(
      [{ id: 'p1', name: 'Gravel', price: 1, quantity: 40 }],
      [{ id: 'p1', price: 25 }],
      false,
    );
    expect(result.verdict).toBe('mismatch');
    expect(result.items[0].verdict).toBe('mismatch');
  });

  it('accepts a price at or above the floor as unverifiable (never falsely claims ok)', () => {
    const result = evaluateItemPrices(
      [{ id: 'p1', name: 'Gravel', price: 20, quantity: 40 }], // 80% of DB price, above the 50% floor
      [{ id: 'p1', price: 25 }],
      false,
    );
    expect(result.verdict).toBe('unverifiable');
    expect(result.items[0].verdict).toBe('unverifiable');
  });

  it('is unverifiable (not mismatch) when the product id is not found in the DB', () => {
    const result = evaluateItemPrices(
      [{ id: 'unknown-id', name: 'Mystery', price: 5, quantity: 1 }],
      [],
      false,
    );
    expect(result.verdict).toBe('unverifiable');
  });

  it('rejects a non-positive submitted price outright', () => {
    const result = evaluateItemPrices(
      [{ id: 'p1', name: 'Gravel', price: 0, quantity: 40 }],
      [{ id: 'p1', price: 25 }],
      false,
    );
    expect(result.verdict).toBe('mismatch');
  });
});

describe('computeItemFinalPricing', () => {
  it('matches verify-payment/index.ts\'s fresh-insert math with no coupon/deposit', () => {
    const result = computeItemFinalPricing({
      items: [{ total_price: 100 }, { total_price: 300 }],
      couponDiscount: 0,
      depositOption: false,
    });
    expect(result[0].finalItemPrice).toBe(100);
    expect(result[1].finalItemPrice).toBe(300);
    expect(result[0].depositAmount).toBeNull();
    expect(result[0].balanceDue).toBeNull();
  });

  it('distributes a coupon discount proportionally across items', () => {
    const result = computeItemFinalPricing({
      items: [{ total_price: 100 }, { total_price: 300 }],
      couponDiscount: 40,
      depositOption: false,
    });
    // item 1 is 25% of the 400 total -> 25% of the $40 discount = $10 off -> $90
    expect(result[0].finalItemPrice).toBeCloseTo(90);
    // item 2 is 75% of the total -> $30 off -> $270
    expect(result[1].finalItemPrice).toBeCloseTo(270);
  });

  it('splits the flat $199 deposit evenly across items and computes balance_due', () => {
    const result = computeItemFinalPricing({
      items: [{ total_price: 100 }, { total_price: 300 }],
      couponDiscount: 0,
      depositOption: true,
    });
    expect(result[0].finalItemPrice).toBeCloseTo(99.5);
    expect(result[1].finalItemPrice).toBeCloseTo(99.5);
    expect(result[0].depositAmount).toBe(199);
    // originalTotal(400) - couponDiscount(0) - 199 = 201
    expect(result[0].balanceDue).toBe(201);
  });
});
