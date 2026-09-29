import { describe, it, expect, vi, beforeEach } from 'vitest';

// rls-hotfix: same regression class as cartInsertService.test.ts — createSpecMaterialQuote must
// not depend on `.insert().select().single()` once anon SELECT on `orders` is removed.

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(), functions: { invoke: vi.fn() } },
}));

vi.mock('./supplierQuoteService', () => ({
  createLeadFromForm: vi.fn().mockResolvedValue({ success: true }),
}));

import { supabase } from '@/integrations/supabase/client';
import { createSpecMaterialQuote, generateSpecQuoteId } from './specMaterialQuoteService';

function makeInsertBuilder(result: { error: any }) {
  const single = vi.fn();
  const select = vi.fn();
  // The actual code no longer chains .select()/.single() — insert() itself must resolve
  // directly to { error }, matching supabase-js's default `return=minimal` behavior.
  const insert = vi.fn((_records: any) => Promise.resolve(result));
  return { insert, select, single };
}

const quoteData = {
  fullName: 'John Smith',
  company: 'Smith Construction',
  email: 'john@smithco.example',
  phone: '555-9999',
  deliveryStreet: '1 Spec Way',
  deliveryCity: 'Austin',
  deliveryState: 'TX',
  deliveryZip: '78701',
  material: 'Crushed Stone',
  tons: 20,
  deliveryDatePreference: '2026-10-01',
  deliveryWindowPreference: 'Morning (8am-12pm)',
  expediteRequested: false,
} as any;

describe('createSpecMaterialQuote (rls-hotfix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts without chaining .select()/.single() (anon SELECT is removed by the RLS hotfix)', async () => {
    const { insert, select, single } = makeInsertBuilder({ error: null });
    (supabase.from as any).mockReturnValue({ insert });

    const result = await createSpecMaterialQuote(quoteData);

    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(insert).toHaveBeenCalledTimes(1);
    expect(select).not.toHaveBeenCalled();
    expect(single).not.toHaveBeenCalled();

    expect(result.success).toBe(true);
    expect(result.orderId).toMatch(/^SPEC-/);
  });

  it('locks status to Quote / $0 pricing (matches the anon INSERT policy scope)', async () => {
    const { insert } = makeInsertBuilder({ error: null });
    (supabase.from as any).mockReturnValue({ insert });

    await createSpecMaterialQuote(quoteData);

    const insertedRecords = insert.mock.calls[0][0];
    expect(insertedRecords[0].status).toBe('Quote');
    expect(insertedRecords[0].total_price).toBe(0);
    expect(insertedRecords[0].unit_price).toBe(0);
  });
});

describe('generateSpecQuoteId', () => {
  it('produces a SPEC-prefixed id', () => {
    expect(generateSpecQuoteId()).toMatch(/^SPEC-\d{8}-\d+$/);
  });
});
