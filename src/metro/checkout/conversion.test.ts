import { describe, expect, it } from 'vitest';
import { METRO_CHECKOUT_METADATA_KEYS, type MetroCheckoutRequest, type MetroServerQuote } from './contract';
import {
  buildMetroCheckoutMetadata,
  buildMetroOrderRowFromMetadata,
  evaluateAmountAndPrice,
  isUniqueViolation,
  parseMetroCheckoutMetadata,
  resolveInsertRace,
} from './conversion';

const request: MetroCheckoutRequest = {
  metroSlug: 'dallas-fort-worth',
  zip: '75201',
  categorySlug: 'gravel',
  variantSlug: 'pea-gravel',
  quantity: 10,
  deliveryDate: '2026-10-05',
  contact: { name: 'Jane Doe', email: 'jane@example.com', mobile: '2145551234' },
  address: { street: '123 Main St', city: 'Dallas', state: 'TX', zip: '75201' },
  dropNotes: 'Gate code 1234',
  expectedTotal: 312.5,
  utmData: { utm_source: 'google', utm_medium: 'cpc', gclid: 'xyz' },
};

const serverQuote: MetroServerQuote = {
  metroSlug: 'dallas-fort-worth',
  zoneSlug: 'dfw-core',
  zoneName: 'Core',
  categorySlug: 'gravel',
  variantSlug: 'pea-gravel',
  variantName: 'Pea Gravel (3/8")',
  unit: 'ton',
  quantity: 10,
  deliveryDate: '2026-10-05',
  isSaturday: false,
  isRush: false,
  truckPlan: '10 tons (Large dump)',
  basePrice: 312.5,
  saturdayFee: 0,
  rushFee: 0,
  total: 312.5,
  pricePerUnit: 31.25,
};

const extra = { userId: 'guest', userEmail: 'jane@example.com', isGuest: true, userAgent: 'Mozilla/5.0 (test)' };

describe('buildMetroCheckoutMetadata / parseMetroCheckoutMetadata round-trip', () => {
  it('round-trips every field the request/quote carries', () => {
    const orderId = 'ORDER-METRO-1735689600000-a1b2c3';
    const metadata = buildMetroCheckoutMetadata(request, orderId, serverQuote, extra);
    const parsed = parseMetroCheckoutMetadata(metadata);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.data.orderId).toBe(orderId);
    expect(parsed.data.serverTotal).toBe(312.5);
    expect(parsed.data.zoneSlug).toBe('dfw-core');
    expect(parsed.data.userId).toBe('guest');
    expect(parsed.data.isGuest).toBe(true);
    expect(parsed.data.request).toMatchObject({
      metroSlug: 'dallas-fort-worth',
      zip: '75201',
      categorySlug: 'gravel',
      variantSlug: 'pea-gravel',
      quantity: 10,
      deliveryDate: '2026-10-05',
      contact: { name: 'Jane Doe', email: 'jane@example.com', mobile: '2145551234' },
      address: { street: '123 Main St', city: 'Dallas', state: 'TX', zip: '75201' },
      dropNotes: 'Gate code 1234',
    });
    expect(parsed.data.request.utmData).toEqual({ utm_source: 'google', utm_medium: 'cpc', gclid: 'xyz' });
  });

  it('produces no more than 50 metadata keys, each key <=40 chars and each value <=500 chars (Stripe limits)', () => {
    const orderId = 'ORDER-METRO-1735689600000-a1b2c3';
    const longNotes = 'x'.repeat(500);
    const metadata = buildMetroCheckoutMetadata({ ...request, dropNotes: longNotes }, orderId, serverQuote, extra);
    const keys = Object.keys(metadata);
    expect(keys.length).toBeLessThanOrEqual(50);
    expect(keys.length).toBe(METRO_CHECKOUT_METADATA_KEYS.length);
    for (const key of keys) {
      expect(key.length).toBeLessThanOrEqual(40);
      expect(metadata[key].length).toBeLessThanOrEqual(500);
    }
    expect(metadata.dropNotes.length).toBe(500);
  });

  it('serializes an absent city/dropNotes as empty string (Stripe metadata cannot hold null)', () => {
    const orderId = 'ORDER-METRO-1735689600000-a1b2c3';
    const bare: MetroCheckoutRequest = { ...request, address: { ...request.address, city: undefined }, dropNotes: undefined };
    const metadata = buildMetroCheckoutMetadata(bare, orderId, serverQuote, extra);
    expect(metadata.city).toBe('');
    expect(metadata.dropNotes).toBe('');

    const parsed = parseMetroCheckoutMetadata(metadata);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.request.address.city).toBeUndefined();
      expect(parsed.data.request.dropNotes).toBeUndefined();
    }
  });

  it('only carries utm keys that were actually present', () => {
    const orderId = 'ORDER-METRO-1735689600000-a1b2c3';
    const metadata = buildMetroCheckoutMetadata({ ...request, utmData: {} }, orderId, serverQuote, extra);
    const parsed = parseMetroCheckoutMetadata(metadata);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.data.request.utmData).toBeUndefined();
  });
});

describe('parseMetroCheckoutMetadata error paths', () => {
  it('rejects missing/null metadata', () => {
    expect(parseMetroCheckoutMetadata(null).ok).toBe(false);
    expect(parseMetroCheckoutMetadata(undefined).ok).toBe(false);
  });

  it('rejects metadata whose source is not metro-checkout', () => {
    const result = parseMetroCheckoutMetadata({ source: 'checkout' });
    expect(result.ok).toBe(false);
  });

  it('rejects metadata missing orderId', () => {
    const result = parseMetroCheckoutMetadata({ source: 'metro-checkout' });
    expect(result.ok).toBe(false);
  });

  it('rejects metadata with a non-numeric quantity/serverTotal', () => {
    expect(
      parseMetroCheckoutMetadata({ source: 'metro-checkout', orderId: 'ORDER-METRO-1', quantity: 'ten', serverTotal: '100' }).ok,
    ).toBe(false);
    expect(
      parseMetroCheckoutMetadata({ source: 'metro-checkout', orderId: 'ORDER-METRO-1', quantity: '10', serverTotal: 'a lot' }).ok,
    ).toBe(false);
  });

  it('rejects metadata missing required order fields', () => {
    const result = parseMetroCheckoutMetadata({
      source: 'metro-checkout',
      orderId: 'ORDER-METRO-1',
      quantity: '10',
      serverTotal: '100',
      // metroSlug/zip/categorySlug/variantSlug/deliveryDate/name/street/state all missing
    });
    expect(result.ok).toBe(false);
  });
});

describe('buildMetroOrderRowFromMetadata', () => {
  it('maps a normal conversion to an authorized/paid row with stripe ids set', () => {
    const row = buildMetroOrderRowFromMetadata({
      orderId: 'ORDER-METRO-123-abc',
      serverQuote,
      request,
      status: 'authorized',
      stripeSessionId: 'cs_test_123',
      stripePaymentIntentId: 'pi_123',
    });
    expect(row.order_id).toBe('ORDER-METRO-123-abc');
    expect(row.status).toBe('authorized');
    expect(row.stripe_session_id).toBe('cs_test_123');
    expect(row.stripe_payment_intent_id).toBe('pi_123');
    expect(row.product_id).toBe('metro:dallas-fort-worth:gravel:pea-gravel');
    expect(row.material_slug).toBe('gravel/pea-gravel');
    expect(row.market_slug).toBe('dallas-fort-worth');
    expect(row.utm_source).toBe('google');
    expect(row.gclid).toBe('xyz');
    expect(row.delivery_instructions).toBe('Gate code 1234');
    expect(row.notes).not.toContain('REVIEW REQUIRED');
  });

  it('appends the review reason to notes and never sends it as a normal status', () => {
    const row = buildMetroOrderRowFromMetadata({
      orderId: 'ORDER-METRO-123-abc',
      serverQuote,
      request,
      status: 'review_required',
      stripeSessionId: 'cs_test_123',
      stripePaymentIntentId: null,
      reviewReason: 'amount_total mismatch',
    });
    expect(row.status).toBe('review_required');
    expect(row.notes).toContain('[REVIEW REQUIRED] amount_total mismatch');
  });

  it('defaults optional fields to null when absent', () => {
    const bare: MetroCheckoutRequest = { ...request, address: { ...request.address, city: undefined }, dropNotes: undefined, utmData: undefined };
    const row = buildMetroOrderRowFromMetadata({
      orderId: 'ORDER-METRO-456-def',
      serverQuote,
      request: bare,
      status: 'paid',
      stripeSessionId: 'cs_test_456',
      stripePaymentIntentId: null,
    });
    expect(row.delivery_instructions).toBeNull();
    expect(row.delivery_city).toBeNull();
    expect(row.gclid).toBeNull();
    expect(row.utm_source).toBeNull();
  });
});

describe('isUniqueViolation', () => {
  it('recognizes Postgres error code 23505', () => {
    expect(isUniqueViolation({ code: '23505', message: 'duplicate key' })).toBe(true);
  });

  it('rejects other error shapes', () => {
    expect(isUniqueViolation({ code: '23503' })).toBe(false);
    expect(isUniqueViolation(new Error('boom'))).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
    expect(isUniqueViolation(undefined)).toBe(false);
  });
});

describe('resolveInsertRace', () => {
  it('keeps the earliest created_at as the winner and reports the caller as winner when it matches', () => {
    const rows = [
      { id: 'row-b', created_at: '2026-01-01T00:00:01.000Z' },
      { id: 'row-a', created_at: '2026-01-01T00:00:00.000Z' },
    ];
    const result = resolveInsertRace(rows, 'row-a');
    expect(result.winner.id).toBe('row-a');
    expect(result.losers.map(r => r.id)).toEqual(['row-b']);
    expect(result.isWinner).toBe(true);
  });

  it('reports the caller as a loser when a different row is earliest', () => {
    const rows = [
      { id: 'row-b', created_at: '2026-01-01T00:00:01.000Z' },
      { id: 'row-a', created_at: '2026-01-01T00:00:00.000Z' },
    ];
    const result = resolveInsertRace(rows, 'row-b');
    expect(result.winner.id).toBe('row-a');
    expect(result.isWinner).toBe(false);
  });

  it('falls back to id comparison when created_at is identical/missing (deterministic tie-break)', () => {
    const rows = [
      { id: 'row-z', created_at: null },
      { id: 'row-a', created_at: null },
    ];
    const result = resolveInsertRace(rows, 'row-a');
    expect(result.winner.id).toBe('row-a');
  });

  it('handles the single-row (no race) case', () => {
    const rows = [{ id: 'only-row', created_at: '2026-01-01T00:00:00.000Z' }];
    const result = resolveInsertRace(rows, 'only-row');
    expect(result.winner.id).toBe('only-row');
    expect(result.losers).toEqual([]);
    expect(result.isWinner).toBe(true);
  });
});

describe('evaluateAmountAndPrice', () => {
  it('passes when amount_total and the recomputed total both match metadata.serverTotal', () => {
    expect(evaluateAmountAndPrice(31250, 312.5, 312.5)).toEqual({ ok: true });
  });

  it('fails when amount_total (cents) does not match metadata.serverTotal', () => {
    const result = evaluateAmountAndPrice(30000, 312.5, 312.5);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/amount_total/);
  });

  it('fails when amount_total is null/undefined', () => {
    expect(evaluateAmountAndPrice(null, 312.5, 312.5).ok).toBe(false);
    expect(evaluateAmountAndPrice(undefined, 312.5, 312.5).ok).toBe(false);
  });

  it('fails when the recomputed price could not be determined at all', () => {
    const result = evaluateAmountAndPrice(31250, 312.5, null);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/recompute/i);
  });

  it('fails when the recomputed price differs from metadata.serverTotal beyond tolerance', () => {
    const result = evaluateAmountAndPrice(31250, 312.5, 320);
    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/Recomputed price/);
  });

  it('tolerates floating-point rounding within METRO_PRICE_TOLERANCE', () => {
    expect(evaluateAmountAndPrice(3333, 33.33, 33.335).ok).toBe(true);
  });
});
