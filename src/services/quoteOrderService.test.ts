import { describe, it, expect, vi, beforeEach } from 'vitest';

// rls-hotfix: same regression class as cartInsertService.test.ts — createQuoteOrder must not
// depend on `.insert().select().single()` once anon SELECT on `orders` is removed.

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';
import { createQuoteOrder, generateQuoteOrderId } from './quoteOrderService';

function makeInsertBuilder(result: { error: any }) {
  const single = vi.fn();
  const select = vi.fn();
  // The actual code no longer chains .select()/.single() — insert() itself must resolve
  // directly to { error }, matching supabase-js's default `return=minimal` behavior.
  const insert = vi.fn((_records: any) => Promise.resolve(result));
  return { insert, select, single };
}

const quoteData = {
  customerName: 'Jane Doe',
  customerEmail: 'jane@example.com',
  customerPhone: '555-1212',
  zipCode: '78701',
  projectDetails: 'Need gravel',
};

describe('createQuoteOrder (rls-hotfix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts without chaining .select()/.single() (anon SELECT is removed by the RLS hotfix)', async () => {
    const { insert, select, single } = makeInsertBuilder({ error: null });
    (supabase.from as any).mockReturnValue({ insert });

    const result = await createQuoteOrder(quoteData);

    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(insert).toHaveBeenCalledTimes(1);
    expect(select).not.toHaveBeenCalled();
    expect(single).not.toHaveBeenCalled();

    expect(result.success).toBe(true);
    expect(result.orderId).toMatch(/^QUOTE-/);
    // data is the locally-built record, not a DB round trip
    expect(result.data).toMatchObject({
      status: 'Quote',
      total_price: 0,
      unit_price: 0,
      delivery_email: 'jane@example.com',
    });
  });

  it('returns { success: false } on insert error instead of throwing to the caller', async () => {
    const { insert } = makeInsertBuilder({ error: { message: 'permission denied', name: 'PostgrestError' } as any });
    (supabase.from as any).mockReturnValue({ insert });

    const result = await createQuoteOrder(quoteData);
    expect(result.success).toBe(false);
  });

  it('locks status to Quote / $0 pricing (matches the anon INSERT policy scope)', async () => {
    const { insert } = makeInsertBuilder({ error: null });
    (supabase.from as any).mockReturnValue({ insert });

    await createQuoteOrder(quoteData);

    const insertedRecords = insert.mock.calls[0][0];
    expect(insertedRecords[0].status).toBe('Quote');
    expect(insertedRecords[0].total_price).toBe(0);
    expect(insertedRecords[0].unit_price).toBe(0);
  });
});

describe('generateQuoteOrderId', () => {
  it('produces a QUOTE-prefixed id', () => {
    expect(generateQuoteOrderId()).toMatch(/^QUOTE-\d{8}-\d+$/);
  });
});
