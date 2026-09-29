import { describe, it, expect, vi, beforeEach } from 'vitest';

// rls-hotfix: insertOrderToDatabase is the anonymous checkout insert path
// (PaymentSuccess.tsx -> handleDatabaseInsert). It MUST keep working with the exact same
// permissiveness under the hotfix (anon INSERT on `orders` is not narrowed by status in this
// stage) — but it must no longer rely on `.insert().select()` succeeding, since anon SELECT is
// being removed and RLS would return zero rows on RETURNING even though the insert succeeded.

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn() },
}));

import { supabase } from '@/integrations/supabase/client';
import { insertOrderToDatabase } from './orderInsertService';

function makeInsertBuilder(result: { error: any }) {
  const select = vi.fn();
  const builder: any = {
    select,
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  const insert = vi.fn((_records: any) => builder);
  return { insert, select };
}

const orderData = {
  orderId: 'ORDER-20260928-123',
  items: [
    {
      id: 'gravel-1',
      name: 'Crushed Gravel',
      price: 100,
      tons: 2,
      contactInfo: { name: 'Jane Doe', phone: '555-1212', email: 'jane@example.com' },
      deliveryAddress: { street: '1 Main St', city: 'Austin', state: 'TX', zip: '78701' },
    } as any,
  ],
  stripeSessionId: 'cs_test_123',
  stripePaymentIntentId: 'pi_test_123',
};

describe('insertOrderToDatabase (rls-hotfix)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts without chaining .select() (anon SELECT is removed by the RLS hotfix)', async () => {
    const { insert, select } = makeInsertBuilder({ error: null });
    (supabase.from as any).mockReturnValue({ insert });

    const result = await insertOrderToDatabase(orderData);

    expect(supabase.from).toHaveBeenCalledWith('orders');
    expect(insert).toHaveBeenCalledTimes(1);
    expect(select).not.toHaveBeenCalled();

    // Every field PaymentSuccess.tsx reads downstream (transformOrderDataForEmail, purchase
    // conversion tracking) is present without needing a DB round trip.
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      order_id: 'ORDER-20260928-123',
      status: 'confirmed',
      delivery_email: 'jane@example.com',
      total_price: 200,
      stripe_session_id: 'cs_test_123',
      stripe_payment_intent_id: 'pi_test_123',
    });
    // Synthesized stable id for use as a React key (DB no longer echoes one back).
    expect(result[0].id).toBe('ORDER-20260928-123-0');
  });

  it('does not narrow the anon insert by status — still inserts status: "confirmed" (Stage 0a keeps anon INSERT exactly as permissive as today)', async () => {
    const { insert } = makeInsertBuilder({ error: null });
    (supabase.from as any).mockReturnValue({ insert });

    await insertOrderToDatabase(orderData);

    const insertedRecords = insert.mock.calls[0][0];
    expect(insertedRecords[0].status).toBe('confirmed');
  });

  it('propagates a real insert error', async () => {
    const { insert } = makeInsertBuilder({ error: { message: 'permission denied' } });
    (supabase.from as any).mockReturnValue({ insert });

    await expect(insertOrderToDatabase(orderData)).rejects.toThrow(/Enhanced database insert failed/);
  });
});
