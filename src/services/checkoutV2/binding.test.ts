import { describe, expect, it } from 'vitest';
import { checkAmountBinding, checkOrderIdBinding, classifySessionOrigin, evaluateBinding } from './binding';

describe('checkOrderIdBinding', () => {
  it('accepts an exact match', () => {
    expect(checkOrderIdBinding('ORDER-1', 'ORDER-1').ok).toBe(true);
  });

  it('accepts QUOTE-/ORDER- equivalence in either direction', () => {
    expect(checkOrderIdBinding('QUOTE-1', 'ORDER-1').ok).toBe(true);
    expect(checkOrderIdBinding('ORDER-1', 'QUOTE-1').ok).toBe(true);
  });

  it('rejects a genuinely different order id — the F1 attack: a real cheap session replayed against someone else\'s order', () => {
    const result = checkOrderIdBinding('ORDER-cheap-1', 'ORDER-expensive-victim-order');
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/ORDER-cheap-1/);
  });

  it('rejects a missing requested orderId', () => {
    expect(checkOrderIdBinding('ORDER-1', undefined).ok).toBe(false);
    expect(checkOrderIdBinding('ORDER-1', null).ok).toBe(false);
  });
});

describe('checkAmountBinding', () => {
  it('accepts a matching amount and rejects a mismatched one', () => {
    expect(checkAmountBinding(5000, 5000).ok).toBe(true);
    expect(checkAmountBinding(100, 5000).ok).toBe(false);
  });
});

describe('evaluateBinding', () => {
  it('short-circuits on order id mismatch before checking amount', () => {
    const result = evaluateBinding('ORDER-a', 'ORDER-b', 100, 100);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/orderId/i);
  });

  it('passes when both order id and amount match', () => {
    expect(evaluateBinding('ORDER-a', 'ORDER-a', 100, 100).ok).toBe(true);
  });

  it('fails on amount mismatch even when order id matches', () => {
    const result = evaluateBinding('ORDER-a', 'ORDER-a', 50, 100);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/amount_total/);
  });
});

describe('classifySessionOrigin', () => {
  it('recognizes a checkout-v2 session', () => {
    const origin = classifySessionOrigin({ source: 'checkout-v2', orderId: 'ORDER-1', expectedTotalCents: '100' });
    expect(origin.kind).toBe('checkout-v2');
  });

  it('recognizes a quote-conversion session from the unmodified create-quote-checkout', () => {
    const origin = classifySessionOrigin({ type: 'quote_conversion', quote_id: 'QUOTE-1' });
    expect(origin).toEqual({ kind: 'quote-conversion', quoteId: 'QUOTE-1' });
  });

  it('falls back to unrecognized for anything else (e.g. the landing page\'s create-payment)', () => {
    expect(classifySessionOrigin({}).kind).toBe('unrecognized');
    expect(classifySessionOrigin(null).kind).toBe('unrecognized');
  });
});
