import { describe, expect, it } from 'vitest';
import { buildCheckoutV2Metadata, hashItems, parseCheckoutV2Metadata } from './metadata';

describe('hashItems', () => {
  it('is stable regardless of item order', () => {
    const a = [{ id: 1, price: 10, quantity: 2 }, { id: 2, price: 5, quantity: 1 }];
    const b = [{ id: 2, price: 5, quantity: 1 }, { id: 1, price: 10, quantity: 2 }];
    expect(hashItems(a)).toBe(hashItems(b));
  });

  it('changes when a price changes', () => {
    const a = hashItems([{ id: 1, price: 10, quantity: 2 }]);
    const b = hashItems([{ id: 1, price: 11, quantity: 2 }]);
    expect(a).not.toBe(b);
  });
});

describe('buildCheckoutV2Metadata / parseCheckoutV2Metadata round-trip', () => {
  it('parses back exactly what was built', () => {
    const metadata = buildCheckoutV2Metadata({
      orderId: 'ORDER-123-abc',
      expectedTotalCents: 12345,
      depositOption: false,
      priceCheck: 'unverifiable',
      items: [{ id: 1, price: 10, quantity: 2 }],
      userId: 'guest',
      userEmail: 'test@example.com',
      isGuest: true,
    });

    const parsed = parseCheckoutV2Metadata(metadata as unknown as Record<string, string>);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.orderId).toBe('ORDER-123-abc');
      expect(parsed.data.expectedTotalCents).toBe('12345');
      expect(parsed.data.priceCheck).toBe('unverifiable');
      expect(parsed.data.isGuest).toBe('true');
    }
  });

  it('rejects metadata not written by create-auth-hold-v2', () => {
    expect(parseCheckoutV2Metadata({ source: 'something-else' }).ok).toBe(false);
    expect(parseCheckoutV2Metadata(null).ok).toBe(false);
    expect(parseCheckoutV2Metadata({ source: 'checkout-v2' }).ok).toBe(false); // missing orderId
  });

  it('rejects an invalid expectedTotalCents', () => {
    const result = parseCheckoutV2Metadata({
      source: 'checkout-v2',
      orderId: 'ORDER-1',
      expectedTotalCents: 'not-a-number',
    });
    expect(result.ok).toBe(false);
  });
});
