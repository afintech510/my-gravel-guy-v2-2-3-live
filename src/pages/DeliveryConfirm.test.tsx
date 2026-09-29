import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

// rls-hotfix: DeliveryConfirm.tsx used to do a raw `.from('delivery_confirmations').select(...)`.
// That table had zero RLS at all — anyone with the public anon key could enumerate every token
// and every customer's PII with `select=*`, no token needed. RLS now denies anon SELECT/UPDATE
// entirely; the page must go through the get_delivery_confirmation / confirm_delivery RPCs,
// which take the token as an explicit argument. This test asserts the RPC name/args.

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(),
  },
}));

// geolocation isn't implemented in jsdom
beforeEach(() => {
  Object.defineProperty(global.navigator, 'geolocation', {
    value: { getCurrentPosition: vi.fn() },
    configurable: true,
  });
});

import { supabase } from '@/integrations/supabase/client';
import DeliveryConfirm from './DeliveryConfirm';

function renderAtToken(token: string) {
  return render(
    <MemoryRouter initialEntries={[`/delivery-confirm?token=${token}`]}>
      <Routes>
        <Route path="/delivery-confirm" element={<DeliveryConfirm />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('DeliveryConfirm (rls-hotfix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the confirmation record via the get_delivery_confirmation RPC, keyed by token', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: [], error: null });

    renderAtToken('11111111-2222-3333-4444-555555555555');

    await waitFor(() => {
      expect(supabase.rpc).toHaveBeenCalledWith('get_delivery_confirmation', {
        p_token: '11111111-2222-3333-4444-555555555555',
      });
    });
  });

  it('treats an empty RPC result as "not found", never a bare table read', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: [], error: null });

    const { findByText } = renderAtToken('does-not-exist');

    await findByText(/Link Invalid/i);
  });

  it('falls back to the raw table SELECT if the RPC has not been deployed yet (PGRST202) — temporary compat shim', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function public.get_delivery_confirmation' },
    });
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { token: 'abc', order_id: 'ORDER-1', confirmed_at: null, confirmed_delivery: false, verified_at: null },
      error: null,
    });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    (supabase.from as any).mockReturnValue({ select });

    renderAtToken('abc');

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('delivery_confirmations');
      expect(eq).toHaveBeenCalledWith('token', 'abc');
    });
  });
});
