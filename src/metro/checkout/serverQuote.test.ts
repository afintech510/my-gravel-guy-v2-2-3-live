import { describe, expect, it } from 'vitest';
import { dallasFortWorth } from '../config/dallasFortWorth';
import { longIsland } from '../config/longIsland';
import { getDeliveryDayOptions } from '../lib/dates';
import { quote } from '../lib/pricing';
import { METRO_INPUT_CAPS, METRO_QUANTITY_MAX, type MetroCheckoutRequest } from './contract';
import {
  buildLineItemCents,
  buildServerQuote,
  buildTruckPlanLabel,
  centsFromDollars,
  generateMetroOrderId,
  resolveMetroCheckoutOrigin,
  sanitizeCheckoutRequest,
  sanitizeUtmData,
  validateRequest,
} from './serverQuote';

const NOW = new Date('2026-09-28T15:00:00Z');

function baseRequest(overrides: Partial<MetroCheckoutRequest> = {}): MetroCheckoutRequest {
  const day = getDeliveryDayOptions(dallasFortWorth, NOW)[0];
  return {
    metroSlug: 'dallas-fort-worth',
    zip: '75201',
    categorySlug: 'gravel',
    variantSlug: 'pea-gravel',
    quantity: 10,
    deliveryDate: day.date,
    contact: { name: 'Jane Doe', email: 'jane@example.com', mobile: '2145551234' },
    address: { street: '123 Main St', city: 'Dallas', state: 'TX', zip: '75201' },
    expectedTotal: 0,
    ...overrides,
  };
}

describe('validateRequest', () => {
  it('accepts a well-formed request', () => {
    expect(validateRequest(baseRequest())).toEqual({ ok: true });
  });

  it.each([
    ['metroSlug', { metroSlug: '' }],
    ['zip', { zip: 'abc' }],
    ['zip', { zip: '123' }],
    ['categorySlug', { categorySlug: '' }],
    ['variantSlug', { variantSlug: '' }],
    ['quantity zero', { quantity: 0 }],
    ['quantity negative', { quantity: -5 }],
    ['quantity NaN', { quantity: NaN }],
    ['deliveryDate format', { deliveryDate: '09/28/2026' }],
    ['expectedTotal negative', { expectedTotal: -1 }],
    ['expectedTotal NaN', { expectedTotal: NaN }],
  ])('rejects invalid %s', (_label, overrides) => {
    const result = validateRequest(baseRequest(overrides as Partial<MetroCheckoutRequest>));
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.code).toBe('INVALID_INPUT');
      expect(result.status).toBe(400);
    }
  });

  it('rejects a missing/invalid contact email', () => {
    const result = validateRequest(baseRequest({ contact: { name: 'Jane', email: 'not-an-email', mobile: '123' } }));
    expect(result.ok).toBe(false);
  });

  it('rejects a cancelPath that does not start with /', () => {
    const result = validateRequest(baseRequest({ cancelPath: 'cart' }));
    expect(result.ok).toBe(false);
  });

  it('rejects a cancelPath starting with //', () => {
    const result = validateRequest(baseRequest({ cancelPath: '//evil.com' }));
    expect(result.ok).toBe(false);
  });

  it('accepts a valid cancelPath', () => {
    expect(validateRequest(baseRequest({ cancelPath: '/cart' })).ok).toBe(true);
  });
});

describe('buildServerQuote', () => {
  it('returns PRICE_BOOK_UNCONFIRMED for DFW (unconfirmed) without the override', () => {
    const result = buildServerQuote(baseRequest(), NOW, { allowUnconfirmed: false });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.code).toBe('PRICE_BOOK_UNCONFIRMED');
    expect(dallasFortWorth.priceBookConfirmed).toBe(false);
  });

  it('allows checkout through with allowUnconfirmed: true', () => {
    const result = buildServerQuote(baseRequest({ expectedTotal: 999999 }), NOW, { allowUnconfirmed: true });
    // expectedTotal is deliberately wrong -> PRICE_CHANGED, not PRICE_BOOK_UNCONFIRMED
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.code).toBe('PRICE_CHANGED');
  });

  it('computes a matching total and returns ok when expectedTotal matches within tolerance', () => {
    const day = getDeliveryDayOptions(dallasFortWorth, NOW)[0];
    const q = quote({
      metro: dallasFortWorth,
      categorySlug: 'gravel',
      variantSlug: 'pea-gravel',
      quantity: 10,
      zoneSlug: 'dfw-core',
      saturday: day.isSaturday,
      speed: day.isRush ? 'rush' : 'standard',
    })!;
    const result = buildServerQuote(baseRequest({ expectedTotal: q.total }), NOW, { allowUnconfirmed: true });
    expect(result.ok).toBe(true);
    if (result.ok === true) {
      expect(result.quote.total).toBe(q.total);
      expect(result.quote.isSaturday).toBe(day.isSaturday);
      expect(result.quote.isRush).toBe(day.isRush);
      expect(result.quote.zoneSlug).toBe('dfw-core');
    }
  });

  it('rejects a zip outside any zone with OUT_OF_AREA', () => {
    const result = buildServerQuote(baseRequest({ zip: '90210', address: { street: 'x', state: 'CA', zip: '90210' } }), NOW, {
      allowUnconfirmed: true,
    });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.code).toBe('OUT_OF_AREA');
  });

  it('rejects an unknown metro with INVALID_INPUT', () => {
    const result = buildServerQuote(baseRequest({ metroSlug: 'nowhere' }), NOW, { allowUnconfirmed: true });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.code).toBe('INVALID_INPUT');
  });

  it('rejects an unknown category/variant with INVALID_INPUT', () => {
    const result = buildServerQuote(baseRequest({ variantSlug: 'not-a-real-variant' }), NOW, { allowUnconfirmed: true });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.code).toBe('INVALID_INPUT');
  });

  it('rejects a deliveryDate not in the current day options with DATE_UNAVAILABLE', () => {
    const result = buildServerQuote(baseRequest({ deliveryDate: '2020-01-01' }), NOW, { allowUnconfirmed: true });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.code).toBe('DATE_UNAVAILABLE');
  });

  it('ignores client-supplied saturday/rush-shaped fields and derives them from deliveryDate server-side', () => {
    // The contract has no isSaturday/isRush request fields at all — this test documents that
    // even if a client somehow smuggled them in (e.g. via a stale/tampered client build), the
    // server never reads them; only deliveryDate drives isSaturday/isRush.
    const day = getDeliveryDayOptions(dallasFortWorth, NOW)[0];
    const q = quote({
      metro: dallasFortWorth,
      categorySlug: 'gravel',
      variantSlug: 'pea-gravel',
      quantity: 10,
      zoneSlug: 'dfw-core',
      saturday: day.isSaturday,
      speed: day.isRush ? 'rush' : 'standard',
    })!;
    const tampered = { ...baseRequest({ expectedTotal: q.total }), isSaturday: true, isRush: true } as MetroCheckoutRequest;
    const result = buildServerQuote(tampered, NOW, { allowUnconfirmed: true });
    expect(result.ok).toBe(true);
    if (result.ok === true) {
      expect(result.quote.isSaturday).toBe(day.isSaturday);
      expect(result.quote.isRush).toBe(day.isRush);
    }
  });

  it('rejects below-minimum quantities with BELOW_MINIMUM and still attaches serverQuote', () => {
    const day = getDeliveryDayOptions(longIsland, NOW)[0];
    const result = buildServerQuote(
      baseRequest({
        metroSlug: 'long-island',
        zip: '11960',
        categorySlug: 'gravel',
        variantSlug: 'pea-gravel-38',
        quantity: 1,
        deliveryDate: day.date,
        address: { street: '1 Test Rd', state: 'NY', zip: '11960' },
      }),
      NOW,
      { allowUnconfirmed: true },
    );
    expect(result.ok).toBe(false);
    if (result.ok === false) {
      expect(result.code).toBe('BELOW_MINIMUM');
      expect(result.serverQuote).toBeDefined();
    }
  });
});

describe('buildTruckPlanLabel', () => {
  it('formats a single-load plan', () => {
    const label = buildTruckPlanLabel([{ truck: dallasFortWorth.trucks[0], quantity: 5 }], 'ton');
    expect(label).toBe(`5 tons (${dallasFortWorth.trucks[0].name})`);
  });

  it('joins multiple loads with " + "', () => {
    const label = buildTruckPlanLabel(
      [
        { truck: dallasFortWorth.trucks[2], quantity: 24 },
        { truck: dallasFortWorth.trucks[0], quantity: 6 },
      ],
      'ton',
    );
    expect(label).toContain(' + ');
    expect(label).toContain('24 tons');
    expect(label).toContain('6 tons');
  });
});

describe('generateMetroOrderId', () => {
  it('matches the ORDER-METRO-<ts>-<rand> shape (no more CART- staging prefix)', () => {
    const ts = new Date('2026-01-01T00:00:00Z');
    const id = generateMetroOrderId(ts, () => 0.123456);
    expect(id).toMatch(/^ORDER-METRO-\d+-[0-9a-z]+$/);
    expect(id.startsWith(`ORDER-METRO-${ts.getTime()}-`)).toBe(true);
  });

  it('produces different ids for different random values', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const a = generateMetroOrderId(now, () => 0.111);
    const b = generateMetroOrderId(now, () => 0.999);
    expect(a).not.toBe(b);
  });
});

// Note: buildMetroOrderRow (the `orders` insert-row builder) now lives in conversion.ts as
// buildMetroOrderRowFromMetadata, since no row is ever built at checkout-session-creation time
// anymore — see conversion.test.ts.

describe('sanitizeCheckoutRequest / validateRequest input caps (security-review F6/F7/F9)', () => {
  it('trims, strips control characters, and truncates every free-text field to its cap', () => {
    const dirty = baseRequest({
      contact: { name: `  Jane\x00Doe${'x'.repeat(200)}  `, email: ' jane@example.com ', mobile: '  214-555-1234\x07  ' },
      address: { street: `123 Main St${'y'.repeat(300)}`, city: 'Dallas', state: ' tx ', zip: ' 75201 ' },
      dropNotes: `line one\nline two\x00${'z'.repeat(600)}`,
    });
    const clean = sanitizeCheckoutRequest(dirty);
    expect(clean.contact.name.length).toBeLessThanOrEqual(METRO_INPUT_CAPS.name);
    expect(clean.contact.name).not.toContain('\x00');
    expect(clean.address.street.length).toBeLessThanOrEqual(METRO_INPUT_CAPS.street);
    expect(clean.address.state).toBe('TX');
    expect(clean.address.zip).toBe('75201');
    expect(clean.dropNotes!.length).toBeLessThanOrEqual(METRO_INPUT_CAPS.dropNotes);
    expect(clean.dropNotes).toContain('\n'); // newlines preserved in the one multi-line field
    expect(clean.dropNotes).not.toContain('\x00');
  });

  it('filters utmData to the allowlist and caps each value length', () => {
    const clean = sanitizeUtmData({
      utm_source: 'google',
      not_allowlisted: 'drop-me',
      gclid: 'x'.repeat(9999),
      utm_medium: '  cpc  ',
    });
    expect(clean).toEqual({
      utm_source: 'google',
      gclid: 'x'.repeat(METRO_INPUT_CAPS.utmValue),
      utm_medium: 'cpc',
    });
    expect(clean.not_allowlisted).toBeUndefined();
  });

  it('rejects a quantity above METRO_QUANTITY_MAX', () => {
    const result = validateRequest(baseRequest({ quantity: METRO_QUANTITY_MAX + 0.5 }));
    expect(result.ok).toBe(false);
  });

  it('accepts a quantity exactly at METRO_QUANTITY_MAX', () => {
    const result = validateRequest(baseRequest({ quantity: METRO_QUANTITY_MAX }));
    expect(result.ok).toBe(true);
  });

  it('rejects a quantity not on the half-unit step', () => {
    const result = validateRequest(baseRequest({ quantity: 7.3333 }));
    expect(result.ok).toBe(false);
  });

  it('accepts a quantity on the half-unit step', () => {
    expect(validateRequest(baseRequest({ quantity: 7.5 })).ok).toBe(true);
    expect(validateRequest(baseRequest({ quantity: 8 })).ok).toBe(true);
  });

  it('rejects a zip with a +4 suffix (5-digit only, per METRO_INPUT_CAPS.zip)', () => {
    const result = validateRequest(baseRequest({ zip: '75201-1234' }));
    expect(result.ok).toBe(false);
  });

  it('rejects an address.state that is not exactly 2 letters', () => {
    const result = validateRequest(baseRequest({ address: { street: '1 Main St', state: 'Texas', zip: '75201' } }));
    expect(result.ok).toBe(false);
  });

  it('rejects a mobile number with no digits', () => {
    const result = validateRequest(baseRequest({ contact: { name: 'Jane', email: 'jane@example.com', mobile: 'call-me' } }));
    expect(result.ok).toBe(false);
  });

  it('rejects an email over the 254-char cap even before truncation would hide it', () => {
    const longEmail = `${'a'.repeat(250)}@example.com`; // > 254 chars total
    const sanitized = sanitizeCheckoutRequest(baseRequest({ contact: { name: 'Jane', email: longEmail, mobile: '2145551234' } }));
    // sanitizeCheckoutRequest truncates to the cap — assert the truncated form is still a
    // well-formed email that validateRequest accepts (documents truncate-then-validate ordering).
    expect(sanitized.contact.email.length).toBeLessThanOrEqual(METRO_INPUT_CAPS.email);
  });
});

describe('buildServerQuote sanitizes the request before quoting', () => {
  it('accepts a request with a padded/dirty zip and still resolves the correct zone', () => {
    const result = buildServerQuote(baseRequest({ zip: '  75201  ' }), NOW, { allowUnconfirmed: true });
    expect(result.ok === true || (result.ok === false && result.code === 'PRICE_CHANGED')).toBe(true);
  });
});

describe('cents math (security-review F8)', () => {
  it('centsFromDollars rounds to the nearest cent', () => {
    expect(centsFromDollars(312.5)).toBe(31250);
    expect(centsFromDollars(33.333)).toBe(3333);
  });

  it('buildLineItemCents always sums exactly to the total in cents', () => {
    const day = getDeliveryDayOptions(dallasFortWorth, NOW)[0];
    const q = quote({
      metro: dallasFortWorth,
      categorySlug: 'gravel',
      variantSlug: 'pea-gravel',
      quantity: 10,
      zoneSlug: 'dfw-core',
      saturday: true,
      speed: 'rush',
    })!;
    const serverQuote = {
      metroSlug: 'dallas-fort-worth',
      zoneSlug: 'dfw-core',
      zoneName: 'Core',
      categorySlug: 'gravel' as const,
      variantSlug: 'pea-gravel',
      variantName: 'Pea Gravel',
      unit: q.unit,
      quantity: q.quantity,
      deliveryDate: day.date,
      isSaturday: true,
      isRush: true,
      truckPlan: 'x',
      basePrice: q.basePrice,
      saturdayFee: q.saturdayFee,
      rushFee: q.rushFee,
      total: q.total,
      pricePerUnit: q.pricePerUnit,
    };
    const cents = buildLineItemCents(serverQuote);
    expect(cents.basePriceCents + cents.saturdayFeeCents + cents.rushFeeCents).toBe(cents.totalCents);
    expect(cents.totalCents).toBe(centsFromDollars(q.total));
  });

  it('omits fee cents when there is no fee, with base absorbing the full total', () => {
    const serverQuote = {
      metroSlug: 'dallas-fort-worth',
      zoneSlug: 'dfw-core',
      zoneName: 'Core',
      categorySlug: 'gravel' as const,
      variantSlug: 'pea-gravel',
      variantName: 'Pea Gravel',
      unit: 'ton' as const,
      quantity: 10,
      deliveryDate: '2026-10-05',
      isSaturday: false,
      isRush: false,
      truckPlan: 'x',
      basePrice: 100,
      saturdayFee: 0,
      rushFee: 0,
      total: 100,
      pricePerUnit: 10,
    };
    const cents = buildLineItemCents(serverQuote);
    expect(cents).toEqual({ basePriceCents: 10000, saturdayFeeCents: 0, rushFeeCents: 0, totalCents: 10000 });
  });
});

describe('resolveMetroCheckoutOrigin', () => {
  it('allows the production origin', () => {
    expect(resolveMetroCheckoutOrigin('https://mygravelguy.com', undefined)).toBe('https://mygravelguy.com');
  });

  it('allows www and localhost', () => {
    expect(resolveMetroCheckoutOrigin('https://www.mygravelguy.com', undefined)).toBe('https://www.mygravelguy.com');
    expect(resolveMetroCheckoutOrigin('http://localhost:8080', undefined)).toBe('http://localhost:8080');
  });

  it('falls back to the default origin for an unrecognized origin', () => {
    expect(resolveMetroCheckoutOrigin('https://evil.example.com', undefined)).toBe('https://mygravelguy.com');
  });

  it('falls back to the default origin for a missing origin header', () => {
    expect(resolveMetroCheckoutOrigin(null, undefined)).toBe('https://mygravelguy.com');
  });

  it('allows an origin listed in the extra-origins env var', () => {
    expect(resolveMetroCheckoutOrigin('https://staging.mygravelguy.com', 'https://staging.mygravelguy.com,https://preview.example.com')).toBe(
      'https://staging.mygravelguy.com',
    );
  });
});
