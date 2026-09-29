import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useMetroOrder } from './useMetroOrder';
import type { Metro } from '../types';
import type { MetroServerQuote } from '../checkout/contract';

// Same reasoning as OrderFlow.test.tsx: mock the quote-request pipeline at the module
// boundary so these tests never touch the network or the production email/SMS pipeline.
vi.mock('../services/metroQuoteService', () => ({
  submitMetroOrderRequest: vi.fn(),
  submitMetroWaitlist: vi.fn(),
}));

import { submitMetroOrderRequest } from '../services/metroQuoteService';

const mockSubmitOrder = submitMetroOrderRequest as unknown as ReturnType<typeof vi.fn>;

function makeMetro(priceBookConfirmed: boolean): Metro {
  return {
    slug: 'test-metro',
    name: 'Test Metro',
    shortName: 'Test',
    state: 'TX',
    timeZone: 'America/Chicago',
    status: 'live',
    headline: 'h',
    subhead: 's',
    priceBookConfirmed,
    nodes: [{ id: 'node-1', name: 'Test Yard', publicLabel: 'Test Yard', cutoffHour: 23, deliversSaturday: true }],
    zones: [{ slug: 'core', name: 'Core Zone', loadCost: 100, minUnits: 3, zips: ['20001'] }],
    towns: [],
    categories: [
      {
        slug: 'gravel',
        name: 'Gravel',
        tagline: 't',
        unit: 'ton',
        tonsPerYard: 1.4,
        defaultDepthIn: 3,
        variants: [
          { slug: 'pea-gravel', name: 'Pea Gravel', shortDescription: 's', bestFor: [], nodePricePerUnit: 50, swatch: '#999' },
        ],
      },
    ],
    trucks: [{ id: 'small', name: 'Small dump', capacityTons: 20, capacityYards: 20, deliveryCostFactor: 1 }],
    pricing: { premiumRate: 0.2, additionalLoadDiscount: 0.25, saturdayFeeRate: 0.1, rushFeeRate: 0.15, roundTo: 1 },
    phone: '(555) 555-5555',
    phoneHref: 'tel:+15555555555',
  };
}

const serverQuote: MetroServerQuote = {
  metroSlug: 'test-metro',
  zoneSlug: 'core',
  zoneName: 'Core Zone',
  categorySlug: 'gravel',
  variantSlug: 'pea-gravel',
  variantName: 'Pea Gravel',
  unit: 'ton',
  quantity: 10,
  deliveryDate: '2026-10-05',
  isSaturday: false,
  isRush: false,
  truckPlan: 'Small dump x1',
  basePrice: 700,
  saturdayFee: 0,
  rushFee: 0,
  total: 700,
  pricePerUnit: 70,
};

/** Drives the hook up to (and including) the contact form's required fields, leaving it
 * ready for `submit()`. */
async function driveToContactStep(metro: Metro, extraOptions: Parameters<typeof useMetroOrder>[1] = {}) {
  const hook = renderHook(() => useMetroOrder(metro, extraOptions));

  act(() => hook.result.current.checkZip('20001'));
  act(() => hook.result.current.selectCategory('gravel'));
  act(() => hook.result.current.selectVariant('pea-gravel'));
  act(() => hook.result.current.selectDay(hook.result.current.dayOptions[0]));
  act(() =>
    hook.result.current.updateContact({
      street: '123 Test Ln',
      name: 'QA Tester',
      mobile: '555-123-4567',
      email: 'qa@example.com',
      smsConsent: true,
    }),
  );

  return hook;
}

beforeEach(() => {
  mockSubmitOrder.mockReset().mockResolvedValue({ success: true });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('useMetroOrder — checkout gating and result handling', () => {
  it('checkout disabled (price book unconfirmed): submit() calls the quote-request path, never the checkout invoke', async () => {
    const metro = makeMetro(false);
    const invoke = vi.fn();
    const navigate = vi.fn();
    const hook = await driveToContactStep(metro, { navigate, checkoutDeps: { invoke, getUtmData: () => undefined } });

    expect(hook.result.current.checkoutEnabled).toBe(false);

    await act(async () => {
      await hook.result.current.submit();
    });

    expect(mockSubmitOrder).toHaveBeenCalledTimes(1);
    expect(invoke).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(hook.result.current.step).toBe('confirmed');
  });

  it('checkout enabled + success: redirects via the injectable navigate dep with the server URL, and never calls the quote-request path', async () => {
    vi.stubEnv('VITE_METRO_CHECKOUT_ENABLED', 'true');
    const metro = makeMetro(true);
    const invoke = vi.fn().mockResolvedValue({
      data: {
        url: 'https://checkout.stripe.com/pay/cs_test_abc',
        session_id: 'cs_test_abc',
        order_id: 'CART-METRO-abc',
        serverQuote,
      },
      error: null,
    });
    const storePendingCheckout = vi.fn();
    const navigate = vi.fn();
    const hook = await driveToContactStep(metro, { navigate, checkoutDeps: { invoke, storePendingCheckout, getUtmData: () => undefined } });

    expect(hook.result.current.checkoutEnabled).toBe(true);

    await act(async () => {
      await hook.result.current.submit();
    });

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('https://checkout.stripe.com/pay/cs_test_abc');
    expect(mockSubmitOrder).not.toHaveBeenCalled();
    expect(storePendingCheckout).toHaveBeenCalledTimes(1);
  });

  it('checkout enabled + PRICE_CHANGED: shows the new server price and does not redirect or fall back to the quote path', async () => {
    vi.stubEnv('VITE_METRO_CHECKOUT_ENABLED', 'true');
    const metro = makeMetro(true);
    const changedQuote: MetroServerQuote = { ...serverQuote, total: 740, basePrice: 740 };
    const error = new FunctionsHttpError({ json: async () => ({ error: 'Price changed', code: 'PRICE_CHANGED', serverQuote: changedQuote }) });
    const invoke = vi.fn().mockResolvedValue({ data: null, error });
    const navigate = vi.fn();
    const hook = await driveToContactStep(metro, { navigate, checkoutDeps: { invoke, getUtmData: () => undefined } });

    await act(async () => {
      await hook.result.current.submit();
    });

    expect(hook.result.current.priceChangeQuote).toEqual(changedQuote);
    expect(navigate).not.toHaveBeenCalled();
    expect(mockSubmitOrder).not.toHaveBeenCalled();
    expect(hook.result.current.step).toBe('contact'); // never advances to 'confirmed'

    // Confirming re-invokes with the server's own total, clearing the price-change state on success.
    invoke.mockResolvedValueOnce({
      data: { url: 'https://checkout.stripe.com/pay/cs_test_def', session_id: 'cs_test_def', order_id: 'CART-METRO-def', serverQuote: changedQuote },
      error: null,
    });
    await act(async () => {
      await hook.result.current.confirmPriceChangeAndContinue();
    });
    expect(navigate).toHaveBeenCalledWith('https://checkout.stripe.com/pay/cs_test_def');
    expect(hook.result.current.priceChangeQuote).toBeNull();
  });

  it.each(['PRICE_BOOK_UNCONFIRMED', 'SERVER_ERROR'] as const)(
    'checkout enabled + %s: transparently falls back to the quote-request path (existing confirmation UI)',
    async code => {
      vi.stubEnv('VITE_METRO_CHECKOUT_ENABLED', 'true');
      const metro = makeMetro(true);
      const error = new FunctionsHttpError({ json: async () => ({ error: 'nope', code }) });
      const invoke = vi.fn().mockResolvedValue({ data: null, error });
      const navigate = vi.fn();
      const hook = await driveToContactStep(metro, { navigate, checkoutDeps: { invoke, getUtmData: () => undefined } });

      await act(async () => {
        await hook.result.current.submit();
      });

      expect(mockSubmitOrder).toHaveBeenCalledTimes(1);
      expect(navigate).not.toHaveBeenCalled();
      expect(hook.result.current.step).toBe('confirmed');
    },
  );

  it('checkout enabled + customer-facing error (OUT_OF_AREA): shows the error, does not fall back silently', async () => {
    vi.stubEnv('VITE_METRO_CHECKOUT_ENABLED', 'true');
    const metro = makeMetro(true);
    const error = new FunctionsHttpError({ json: async () => ({ error: 'Outside delivery area', code: 'OUT_OF_AREA' }) });
    const invoke = vi.fn().mockResolvedValue({ data: null, error });
    const navigate = vi.fn();
    const hook = await driveToContactStep(metro, { navigate, checkoutDeps: { invoke, getUtmData: () => undefined } });

    await act(async () => {
      await hook.result.current.submit();
    });

    expect(hook.result.current.submitError).toBe('Outside delivery area');
    expect(mockSubmitOrder).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(hook.result.current.step).toBe('contact');
  });
});
