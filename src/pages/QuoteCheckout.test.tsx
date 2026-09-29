import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// rls-hotfix: QuoteCheckout.tsx used to do a raw `.from('orders').select('*').like(...)`, which
// relied on anon SELECT being open. That policy is being removed (F5 fix — anon could otherwise
// `SELECT *` the whole orders table), so the page must call the new SECURITY DEFINER RPCs
// instead. This test asserts the RPC name/args, not UI details.

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}));

vi.mock('@/services/productService', () => ({
  getProducts: vi.fn().mockResolvedValue([]),
}));

import { supabase } from '@/integrations/supabase/client';
import QuoteCheckout from './QuoteCheckout';

function renderAtQuote(quoteId: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/quote-checkout/${quoteId}`]}>
        <Routes>
          <Route path="/quote-checkout/:quoteId" element={<QuoteCheckout />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('QuoteCheckout (rls-hotfix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches quote data via the get_quote_by_id RPC instead of a raw table SELECT', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: [
        {
          id: '1',
          order_id: 'QUOTE-20260928-123',
          product_id: 'gravel',
          quantity: 5,
          unit: 'tons',
          unit_price: 40,
          total_price: 200,
          delivery_name: 'Jane Doe',
          delivery_email: 'jane@example.com',
          delivery_phone: '555-1212',
          delivery_street: '1 Main St',
          delivery_city: 'Austin',
          delivery_state: 'TX',
          delivery_zip: '78701',
          delivery_date: '2026-10-01',
          delivery_time_preference: 'Morning (8am-12pm)',
          delivery_instructions: '',
          quote_expires_at: null,
          quote_notes: '',
          notes: '',
        },
      ],
      error: null,
    });

    renderAtQuote('QUOTE-20260928-123');

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('get_quote_by_id', { p_quote_id: 'QUOTE-20260928-123' });
    });

    await screen.findByText(/Quote Review & Payment/i);
  });

  it('falls back to the raw table SELECT if the RPC has not been deployed yet (PGRST202) — temporary compat shim', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function public.get_quote_by_id' },
    });
    const like = vi.fn().mockReturnThis();
    const eq = vi.fn().mockResolvedValue({
      data: [
        {
          id: '1',
          order_id: 'QUOTE-20260928-123',
          product_id: 'gravel',
          quantity: 5,
          unit: 'tons',
          unit_price: 40,
          total_price: 200,
          delivery_name: 'Jane Doe',
          delivery_email: 'jane@example.com',
          delivery_phone: '555-1212',
          delivery_street: '1 Main St',
          delivery_city: 'Austin',
          delivery_state: 'TX',
          delivery_zip: '78701',
          delivery_date: '2026-10-01',
          delivery_time_preference: 'Morning (8am-12pm)',
          delivery_instructions: '',
          quote_expires_at: null,
          quote_notes: '',
          notes: '',
        },
      ],
      error: null,
    });
    const select = vi.fn(() => ({ like: (...args: any[]) => { like(...args); return { eq }; } }));
    (supabase.from as any).mockReturnValue({ select });

    renderAtQuote('QUOTE-20260928-123');

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('orders');
      expect(eq).toHaveBeenCalledWith('status', 'Quote');
    });

    await screen.findByText(/Quote Review & Payment/i);
  });
});
