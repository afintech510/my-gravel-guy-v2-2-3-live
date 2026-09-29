import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { FunctionsHttpError } from '@supabase/supabase-js';
import {
  isMetroCheckoutEnabled,
  startMetroCheckout,
  getMetroPendingCheckout,
  clearMetroPendingCheckout,
  METRO_PENDING_CHECKOUT_KEY,
} from './metroCheckoutService';
import type { MetroOrderSubmission } from './metroQuoteService';
import type { MetroCheckoutResponse, MetroServerQuote } from '../checkout/contract';
import type { Metro } from '../types';

const confirmedMetro: Metro = {
  slug: 'dallas-fort-worth',
  name: 'Dallas–Fort Worth',
  shortName: 'DFW',
  state: 'TX',
  timeZone: 'America/Chicago',
  status: 'live',
  headline: 'h',
  subhead: 's',
  priceBookConfirmed: true,
  nodes: [],
  zones: [],
  towns: [],
  categories: [],
  trucks: [],
  pricing: { premiumRate: 0.2, additionalLoadDiscount: 0.25, saturdayFeeRate: 0.1, rushFeeRate: 0.15, roundTo: 1 },
  phone: '(555) 555-5555',
  phoneHref: 'tel:+15555555555',
};

const unconfirmedMetro: Metro = { ...confirmedMetro, priceBookConfirmed: false };

const submission: MetroOrderSubmission = {
  metro: confirmedMetro,
  zip: '75001',
  zone: { slug: 'dfw-core', name: 'DFW Core', loadCost: 85, minUnits: 3, zips: ['75001'] },
  category: { slug: 'gravel', name: 'Gravel', tagline: 't', unit: 'ton', tonsPerYard: 1.4, defaultDepthIn: 3, variants: [] },
  variant: { slug: 'pea-gravel', name: 'Pea Gravel', shortDescription: 's', bestFor: [], nodePricePerUnit: 50, swatch: '#999' },
  quantity: 10,
  day: { date: '2026-10-05', label: 'Mon, Oct 5', isSaturday: false, isRush: false },
  street: '123 Test Ln',
  dropNotes: 'Leave at gate',
  name: 'QA Tester',
  email: 'qa@example.com',
  mobile: '555-123-4567',
  quote: {
    unit: 'ton',
    quantity: 10,
    loads: [],
    materialCost: 400,
    deliveryCost: 85,
    premium: 100,
    basePrice: 585,
    saturdayFee: 0,
    rushFee: 0,
    total: 585,
    pricePerUnit: 58.5,
    belowMinimum: false,
    minUnits: 3,
  },
};

const serverQuote: MetroServerQuote = {
  metroSlug: 'dallas-fort-worth',
  zoneSlug: 'dfw-core',
  zoneName: 'DFW Core',
  categorySlug: 'gravel',
  variantSlug: 'pea-gravel',
  variantName: 'Pea Gravel',
  unit: 'ton',
  quantity: 10,
  deliveryDate: '2026-10-05',
  isSaturday: false,
  isRush: false,
  truckPlan: 'Small dump x1',
  basePrice: 585,
  saturdayFee: 0,
  rushFee: 0,
  total: 585,
  pricePerUnit: 58.5,
};

describe('isMetroCheckoutEnabled', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('is false when the price book is unconfirmed, regardless of the env flag', () => {
    vi.stubEnv('VITE_METRO_CHECKOUT_ENABLED', 'true');
    expect(isMetroCheckoutEnabled(unconfirmedMetro)).toBe(false);
  });

  it('is false when the price book is confirmed but the env flag is off/unset', () => {
    vi.stubEnv('VITE_METRO_CHECKOUT_ENABLED', 'false');
    expect(isMetroCheckoutEnabled(confirmedMetro)).toBe(false);
  });

  it('is true only when both the price book is confirmed AND the env flag is exactly "true"', () => {
    vi.stubEnv('VITE_METRO_CHECKOUT_ENABLED', 'true');
    expect(isMetroCheckoutEnabled(confirmedMetro)).toBe(true);
  });
});

describe('startMetroCheckout', () => {
  const storePendingCheckout = vi.fn();
  const getUtmData = vi.fn(() => undefined);

  beforeEach(() => {
    storePendingCheckout.mockReset();
    getUtmData.mockReset().mockReturnValue(undefined);
  });

  it('maps a successful response to a redirect result and writes the metro-only pending-checkout record keyed to the server order_id', async () => {
    const invoke = vi.fn().mockResolvedValue({
      data: {
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        session_id: 'cs_test_123',
        order_id: 'ORDER-METRO-abc123',
        serverQuote,
      } satisfies MetroCheckoutResponse,
      error: null,
    });

    const result = await startMetroCheckout(submission, { invoke, storePendingCheckout, getUtmData, cancelPath: '/dallas-fort-worth' });

    expect(result).toEqual({ kind: 'redirect', url: 'https://checkout.stripe.com/pay/cs_test_123' });
    expect(invoke).toHaveBeenCalledWith(
      expect.objectContaining({
        metroSlug: 'dallas-fort-worth',
        zip: '75001',
        categorySlug: 'gravel',
        variantSlug: 'pea-gravel',
        quantity: 10,
        deliveryDate: '2026-10-05',
        contact: { name: 'QA Tester', email: 'qa@example.com', mobile: '555-123-4567' },
        address: { street: '123 Test Ln', state: 'TX', zip: '75001' },
        expectedTotal: 585,
        cancelPath: '/dallas-fort-worth',
      }),
    );

    expect(storePendingCheckout).toHaveBeenCalledTimes(1);
    const record = storePendingCheckout.mock.calls[0][0];
    expect(record.orderId).toBe('ORDER-METRO-abc123');
    expect(record.serverQuote).toEqual(serverQuote);
    expect(typeof record.createdAt).toBe('number');
  });

  it('maps a PRICE_CHANGED (409) response to price_changed with the server quote, and does not write a pending-checkout record', async () => {
    const changedQuote: MetroServerQuote = { ...serverQuote, total: 620, basePrice: 620 };
    const error = new FunctionsHttpError({ json: async () => ({ error: 'Price changed', code: 'PRICE_CHANGED', serverQuote: changedQuote }) });
    const invoke = vi.fn().mockResolvedValue({ data: null, error });

    const result = await startMetroCheckout(submission, { invoke, storePendingCheckout, getUtmData });

    expect(result).toEqual({ kind: 'price_changed', serverQuote: changedQuote });
    expect(storePendingCheckout).not.toHaveBeenCalled();
  });

  it.each(['PRICE_BOOK_UNCONFIRMED', 'SERVER_ERROR'] as const)(
    'maps %s to fallback_quote so the caller transparently falls back to the quote-request path',
    async code => {
      const error = new FunctionsHttpError({ json: async () => ({ error: 'nope', code }) });
      const invoke = vi.fn().mockResolvedValue({ data: null, error });

      const result = await startMetroCheckout(submission, { invoke, storePendingCheckout, getUtmData });

      expect(result).toEqual({ kind: 'fallback_quote', reason: code });
    },
  );

  it.each(['OUT_OF_AREA', 'DATE_UNAVAILABLE', 'BELOW_MINIMUM', 'INVALID_INPUT'] as const)(
    'maps %s to a customer-facing error result',
    async code => {
      const error = new FunctionsHttpError({ json: async () => ({ error: `${code} message`, code }) });
      const invoke = vi.fn().mockResolvedValue({ data: null, error });

      const result = await startMetroCheckout(submission, { invoke, storePendingCheckout, getUtmData });

      expect(result).toEqual({ kind: 'error', code, message: `${code} message` });
    },
  );

  it('falls back to fallback_quote on a network/invoke failure (FunctionsFetchError-style, not FunctionsHttpError)', async () => {
    const invoke = vi.fn().mockResolvedValue({ data: null, error: new Error('Failed to fetch') });

    const result = await startMetroCheckout(submission, { invoke, storePendingCheckout, getUtmData });

    expect(result).toEqual({ kind: 'fallback_quote', reason: 'Failed to fetch' });
    expect(storePendingCheckout).not.toHaveBeenCalled();
  });

  it('falls back to fallback_quote when invoke itself throws', async () => {
    const invoke = vi.fn().mockRejectedValue(new Error('boom'));

    const result = await startMetroCheckout(submission, { invoke, storePendingCheckout, getUtmData });

    expect(result).toEqual({ kind: 'fallback_quote', reason: 'boom' });
  });

  it('includes UTM data on the request when getUtmData returns values (pending-checkout record itself carries no UTM data)', async () => {
    getUtmData.mockReturnValue({ utm_source: 'google', utm_medium: 'cpc' });
    const invoke = vi.fn().mockResolvedValue({
      data: { url: 'https://checkout.stripe.com/pay/cs_test_456', session_id: 'cs_test_456', order_id: 'ORDER-METRO-xyz', serverQuote },
      error: null,
    });

    await startMetroCheckout(submission, { invoke, storePendingCheckout, getUtmData });

    expect(invoke).toHaveBeenCalledWith(expect.objectContaining({ utmData: { utm_source: 'google', utm_medium: 'cpc' } }));
    expect(storePendingCheckout).toHaveBeenCalledTimes(1);
  });

  it('never writes the live /checkout flow localStorage keys', async () => {
    localStorage.clear();
    const invoke = vi.fn().mockResolvedValue({
      data: { url: 'https://checkout.stripe.com/pay/cs_test_789', session_id: 'cs_test_789', order_id: 'ORDER-METRO-live-check', serverQuote },
      error: null,
    });

    // Use the real default storePendingCheckout by omitting the dep, to prove production
    // behavior only ever touches METRO_PENDING_CHECKOUT_KEY.
    await startMetroCheckout(submission, { invoke, getUtmData });

    expect(localStorage.getItem('checkout-order-backup')).toBeNull();
    expect(localStorage.getItem('checkout-in-progress')).toBeNull();
    expect(localStorage.getItem('checkout-order-id')).toBeNull();
    expect(localStorage.getItem(METRO_PENDING_CHECKOUT_KEY)).not.toBeNull();
    localStorage.clear();
  });
});

describe('getMetroPendingCheckout / clearMetroPendingCheckout', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('returns null when nothing is stored', () => {
    expect(getMetroPendingCheckout()).toBeNull();
  });

  it('returns the parsed record when one is stored, and clears it on demand', () => {
    const record = { orderId: 'ORDER-METRO-abc', serverQuote, createdAt: 12345 };
    localStorage.setItem(METRO_PENDING_CHECKOUT_KEY, JSON.stringify(record));

    expect(getMetroPendingCheckout()).toEqual(record);

    clearMetroPendingCheckout();
    expect(getMetroPendingCheckout()).toBeNull();
    expect(localStorage.getItem(METRO_PENDING_CHECKOUT_KEY)).toBeNull();
  });

  it('returns null and does not throw on malformed JSON', () => {
    localStorage.setItem(METRO_PENDING_CHECKOUT_KEY, '{not json');
    expect(getMetroPendingCheckout()).toBeNull();
  });

  it('returns null when the stored record is missing required fields', () => {
    localStorage.setItem(METRO_PENDING_CHECKOUT_KEY, JSON.stringify({ foo: 'bar' }));
    expect(getMetroPendingCheckout()).toBeNull();
  });
});
