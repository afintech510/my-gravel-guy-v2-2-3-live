import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { FunctionsHttpError } from '@supabase/supabase-js';
import type { MetroConfirmedOrder, MetroVerifyResponse } from '@/metro/checkout/contract';
import { METRO_PENDING_CHECKOUT_KEY } from '@/metro/services/metroCheckoutService';

// NOTE: as of the 2026-09-28 hardening pass there is no more CART-METRO- staging id —
// create-metro-checkout now returns the ORDER-METRO- id directly (see contract.ts's
// METRO_ORDER_ID_PREFIX) and that's the id the query string / verify-metro-payment call always
// carries, from checkout all the way through confirmation.

// Mocked at the module boundary so these tests never touch the real (production) Supabase
// project — mirrors the pattern metroCheckoutService.test.ts / OrderFlow.test.tsx use for
// everything else in this codebase that talks to Supabase or the quote-request pipeline.
const invokeMock = vi.fn();
vi.mock('@/integrations/supabase/client', () => ({
  supabase: { functions: { invoke: (...args: unknown[]) => invokeMock(...args) } },
}));

import MetroOrderConfirmedPage from './MetroOrderConfirmedPage';

function renderPage(search: string, { strictMode = false }: { strictMode?: boolean } = {}) {
  const ui = (
    <MemoryRouter initialEntries={[`/metro-order-confirmed${search}`]}>
      <HelmetProvider>
        <MetroOrderConfirmedPage />
      </HelmetProvider>
    </MemoryRouter>
  );
  return render(strictMode ? <React.StrictMode>{ui}</React.StrictMode> : ui);
}

const confirmedOrder: MetroConfirmedOrder = {
  orderId: 'ORDER-METRO-abc123',
  metroSlug: 'dallas-fort-worth',
  variantName: 'Pea Gravel',
  quantity: 10,
  unit: 'ton',
  total: 585,
  deliveryDate: '2026-10-05',
  deliveryStreet: '123 Test Ln',
  deliveryCity: 'Dallas',
  deliveryState: 'TX',
  deliveryZip: '75201',
  zoneName: 'DFW Core',
  truckPlan: 'Small dump x1',
  customerEmail: 'qa@example.com',
  customerName: 'Jane Doe',
  customerPhone: '5551234567',
};

const successResponse: MetroVerifyResponse = {
  success: true,
  orderId: 'ORDER-METRO-abc123',
  status: 'authorized',
  alreadyProcessed: false,
  order: confirmedOrder,
};

beforeEach(() => {
  invokeMock.mockReset();
  localStorage.clear();
  (window as unknown as { gtag?: unknown }).gtag = vi.fn();
});

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('MetroOrderConfirmedPage', () => {
  it('missing params: shows an error state immediately and never calls invoke', async () => {
    renderPage('');

    expect(await screen.findByText(/couldn't confirm your order automatically/i)).toBeInTheDocument();
    expect(invokeMock).not.toHaveBeenCalled();
  });

  it('success: renders the order summary and fires tracking exactly once', async () => {
    invokeMock.mockResolvedValue({ data: successResponse, error: null });

    renderPage('?session_id=cs_test_123&order_id=ORDER-METRO-abc123');

    expect(await screen.findByText('Order confirmed!')).toBeInTheDocument();
    expect(screen.getByText(/ORDER-METRO-abc123/)).toBeInTheDocument();
    expect(screen.getByText(/Pea Gravel/)).toBeInTheDocument();
    expect(screen.getByText(/10 tons/)).toBeInTheDocument();
    expect(screen.getAllByText(/\$585/).length).toBeGreaterThan(0);
    expect(screen.getByText(/123 Test Ln/)).toBeInTheDocument();

    // trackMetroPurchaseConversion fires several window.gtag calls internally (enhanced
    // conversion user-data + the 'purchase' event + the Google Ads conversion) — assert on
    // the 'purchase' event specifically, and that it only fired once.
    const gtagMock = (window as unknown as { gtag: ReturnType<typeof vi.fn> }).gtag;
    await waitFor(() => {
      const purchaseCalls = gtagMock.mock.calls.filter(call => call[0] === 'event' && call[1] === 'purchase');
      expect(purchaseCalls).toHaveLength(1);
    });
    const purchaseCall = gtagMock.mock.calls.find(call => call[0] === 'event' && call[1] === 'purchase')!;
    expect(purchaseCall[2]).toMatchObject({ transaction_id: 'ORDER-METRO-abc123', value: 585 });
    expect(invokeMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).toHaveBeenCalledWith('verify-metro-payment', {
      body: { sessionId: 'cs_test_123', orderId: 'ORDER-METRO-abc123' },
    });

    // G3 (docs/metro/research/metro-checkout-rereview.md): customerName/customerPhone from the
    // verify response must reach Google Ads Enhanced Conversions, not just customerEmail.
    const setUserDataCall = gtagMock.mock.calls.find(call => call[0] === 'set' && call[1] === 'user_data');
    expect(setUserDataCall?.[2]).toMatchObject({
      email: 'qa@example.com',
      phone_number: '+15551234567',
      address: expect.objectContaining({ first_name: 'jane', last_name: 'doe' }),
    });
  });

  it('alreadyProcessed / dedupe guard: does not double-fire tracking when the localStorage guard is already set', async () => {
    localStorage.setItem('mgg_purchase_fired_ORDER-METRO-abc123', 'true');
    invokeMock.mockResolvedValue({
      data: { ...successResponse, alreadyProcessed: true },
      error: null,
    });

    renderPage('?session_id=cs_test_123&order_id=ORDER-METRO-abc123');

    expect(await screen.findByText('Order confirmed!')).toBeInTheDocument();
    const gtagMock = (window as unknown as { gtag: ReturnType<typeof vi.fn> }).gtag;
    const purchaseCalls = gtagMock.mock.calls.filter(call => call[0] === 'event' && call[1] === 'purchase');
    expect(purchaseCalls).toHaveLength(0);
  });

  it('clears the pending-checkout localStorage record on success', async () => {
    localStorage.setItem(
      METRO_PENDING_CHECKOUT_KEY,
      JSON.stringify({
        orderId: 'ORDER-METRO-abc123',
        serverQuote: { metroSlug: 'dallas-fort-worth', total: 585 },
        createdAt: Date.now(),
      }),
    );
    invokeMock.mockResolvedValue({ data: successResponse, error: null });

    renderPage('?session_id=cs_test_123&order_id=ORDER-METRO-abc123');

    await screen.findByText('Order confirmed!');
    expect(localStorage.getItem(METRO_PENDING_CHECKOUT_KEY)).toBeNull();
  });

  it('unpaid: shows a back link to the pending order rather than the generic error message', async () => {
    localStorage.setItem(
      METRO_PENDING_CHECKOUT_KEY,
      JSON.stringify({
        orderId: 'ORDER-METRO-abc123',
        serverQuote: { metroSlug: 'dallas-fort-worth', total: 585 },
        createdAt: Date.now(),
      }),
    );
    invokeMock.mockResolvedValue({
      data: { success: false, status: 'unpaid', error: 'unpaid' } satisfies MetroVerifyResponse,
      error: null,
    });

    renderPage('?session_id=cs_test_123&order_id=ORDER-METRO-abc123');

    expect(await screen.findByText('Payment not completed')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /back to your order/i });
    expect(link).toHaveAttribute('href', '/dallas-fort-worth');
  });

  it('error (e.g. mismatch/invalid/not_found/server error): shows a reassuring message with contact info and the order reference, never the raw error', async () => {
    invokeMock.mockResolvedValue({
      data: { success: false, status: 'mismatch', error: 'Internal session/order mismatch detail' } satisfies MetroVerifyResponse,
      error: null,
    });

    renderPage('?session_id=cs_test_123&order_id=ORDER-METRO-abc123');

    expect(await screen.findByText(/couldn't confirm your order automatically/i)).toBeInTheDocument();
    expect(screen.getByText(/ORDER-METRO-abc123/)).toBeInTheDocument();
    expect(screen.getByText(/\(844\) 624-0400/)).toBeInTheDocument();
    expect(screen.queryByText(/Internal session\/order mismatch detail/)).not.toBeInTheDocument();
    // G1 (docs/metro/research/metro-checkout-rereview.md): a genuine post-payment insert
    // failure surfaces through this same `error` state — the copy must reassure the customer
    // their payment was received and they'll be contacted, not just say "something went wrong".
    expect(screen.getByText(/we've received it and our team is confirming your order now/i)).toBeInTheDocument();
    expect(screen.getByText(/text or email you shortly/i)).toBeInTheDocument();
  });

  it('handles a FunctionsHttpError body the same way as a 200 failure response', async () => {
    const error = new FunctionsHttpError({
      json: async () => ({ success: false, status: 'not_found', error: 'no such session' }),
    });
    invokeMock.mockResolvedValue({ data: null, error });

    renderPage('?session_id=cs_test_123&order_id=ORDER-METRO-abc123');

    expect(await screen.findByText(/couldn't confirm your order automatically/i)).toBeInTheDocument();
    expect(screen.queryByText(/no such session/)).not.toBeInTheDocument();
  });

  it('network/invoke failure: falls back to the generic error state without throwing', async () => {
    invokeMock.mockRejectedValue(new Error('Failed to fetch'));

    renderPage('?session_id=cs_test_123&order_id=ORDER-METRO-abc123');

    expect(await screen.findByText(/couldn't confirm your order automatically/i)).toBeInTheDocument();
  });

  it('StrictMode double-mount: invoke is still only called once', async () => {
    invokeMock.mockResolvedValue({ data: successResponse, error: null });

    renderPage('?session_id=cs_test_123&order_id=ORDER-METRO-abc123', { strictMode: true });

    await screen.findByText('Order confirmed!');
    expect(invokeMock).toHaveBeenCalledTimes(1);
  });
});
