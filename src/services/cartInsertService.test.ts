import { describe, it, expect, vi, beforeEach } from 'vitest';

// rls-hotfix: regression test for the anon-INSERT-then-SELECT fix. Once anon SELECT on `orders`
// is removed (sql/rls-hotfix-stage0a.sql), `.insert().select()` would come back empty under RLS
// (Postgres governs INSERT...RETURNING via the SELECT policy) even though the insert itself
// succeeded. insertCartToDatabase must not depend on the DB echoing the row back.

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn(),
    },
  };
});

vi.mock('./supplierQuoteService', () => ({
  createLeadFromForm: vi.fn().mockResolvedValue({ success: true }),
}));

import { supabase } from '@/integrations/supabase/client';
import { insertCartToDatabase } from './cartInsertService';

function makeInsertBuilder(result: { error: any }) {
  const select = vi.fn();
  const builder: any = {
    select,
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  const insert = vi.fn((_records: any) => builder);
  return { insert, select, builder };
}

describe('insertCartToDatabase (rls-hotfix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const cartData = {
    items: [
      {
        id: 'gravel-1',
        name: 'Crushed Gravel',
        price: 42,
        tons: 3,
        contactInfo: { name: 'Jane Doe', phone: '555-1212', email: 'jane@example.com' },
        deliveryAddress: { street: '1 Main St', city: 'Austin', state: 'TX', zip: '78701' },
      } as any,
    ],
  };

  it('inserts without chaining .select() (anon SELECT is removed by the RLS hotfix)', async () => {
    const { insert, select } = makeInsertBuilder({ error: null });
    (supabase.from as any).mockReturnValue({ insert });

    const result = await insertCartToDatabase(cartData);

    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(insert).toHaveBeenCalledTimes(1);
    expect(select).not.toHaveBeenCalled();

    // Returned data is built client-side, not read back from the DB.
    expect(result.cartId).toMatch(/^CART-/);
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      status: 'cart',
      delivery_email: 'jane@example.com',
      unit_price: 42,
    });
  });

  it('still throws on a real insert error', async () => {
    const { insert } = makeInsertBuilder({ error: { message: 'permission denied' } });
    (supabase.from as any).mockReturnValue({ insert });

    await expect(insertCartToDatabase(cartData)).rejects.toThrow(/Cart database insert failed/);
  });

  it('sends the insert with the status locked to "cart" (matches the anon INSERT policy)', async () => {
    const { insert } = makeInsertBuilder({ error: null });
    (supabase.from as any).mockReturnValue({ insert });

    await insertCartToDatabase(cartData);

    const insertedRecords = insert.mock.calls[0][0];
    expect(insertedRecords).toHaveLength(1);
    expect(insertedRecords[0].status).toBe('cart');
  });
});
