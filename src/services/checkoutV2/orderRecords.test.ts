import { describe, expect, it } from 'vitest';
import { buildFreshOrderRecords, buildQuoteConversionUpdate } from './orderRecords';

describe('buildFreshOrderRecords', () => {
  const baseInput = {
    orderId: 'ORDER-1',
    status: 'authorized' as const,
    stripeSessionId: 'cs_test_1',
    stripePaymentIntentId: 'pi_test_1',
    billingName: 'Jane Doe',
    billingEmail: 'jane@example.com',
    couponCode: null,
    couponDiscount: 0,
    depositOption: false,
  };

  it('builds one row per backup item with the computed status (F2 fix — never an undeclared paymentStatus)', () => {
    const rows = buildFreshOrderRecords({
      ...baseInput,
      items: [
        {
          id: 'prod-1',
          price: 25,
          quantity: 1,
          tons: 4,
          total_price: 100,
          deliveryAddress: { street: '1 Main St', city: 'Dallas', state: 'TX', zip: '75001' },
          contactInfo: { name: 'Jane Doe', email: 'jane@example.com', phone: '555-1234' },
          deliveryDate: '2026-10-01',
        },
      ],
    });

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      order_id: 'ORDER-1',
      product_id: 'prod-1',
      quantity: 4,
      total_price: 100,
      status: 'authorized',
      delivery_street: '1 Main St',
      delivery_name: 'Jane Doe',
      stripe_session_id: 'cs_test_1',
      stripe_payment_intent_id: 'pi_test_1',
      is_deposit_payment: false,
      deposit_amount: null,
      balance_due: null,
    });
  });

  it('applies a coupon discount proportionally, matching pricing.computeItemFinalPricing', () => {
    const rows = buildFreshOrderRecords({
      ...baseInput,
      couponCode: 'SAVE5',
      couponDiscount: 40,
      items: [
        { id: 'a', price: 25, quantity: 1, tons: 4, total_price: 100 },
        { id: 'b', price: 100, quantity: 1, tons: 3, total_price: 300 },
      ],
    });
    expect(rows[0].total_price).toBeCloseTo(90);
    expect(rows[1].total_price).toBeCloseTo(270);
    expect(rows[0].coupon).toBe('SAVE5');
  });

  it('splits the deposit evenly and sets is_deposit_payment on every row', () => {
    const rows = buildFreshOrderRecords({
      ...baseInput,
      depositOption: true,
      items: [
        { id: 'a', price: 25, quantity: 1, tons: 4, total_price: 100 },
        { id: 'b', price: 100, quantity: 1, tons: 3, total_price: 300 },
      ],
    });
    expect(rows[0].total_price).toBeCloseTo(99.5);
    expect(rows[1].total_price).toBeCloseTo(99.5);
    expect(rows[0].is_deposit_payment).toBe(true);
    expect(rows[0].deposit_amount).toBe(199);
    expect(rows[0].balance_due).toBe(201);
  });

  it('carries UTM attribution fields through when present', () => {
    const rows = buildFreshOrderRecords({
      ...baseInput,
      items: [{ id: 'a', price: 25, quantity: 1, tons: 4, total_price: 100 }],
      utmData: { gclid: 'abc123', utm_source: 'google' },
    });
    expect(rows[0].gclid).toBe('abc123');
    expect(rows[0].utm_source).toBe('google');
    expect(rows[0].gbraid).toBeNull();
  });
});

describe('buildQuoteConversionUpdate', () => {
  it('builds the QUOTE- -> ORDER- update payload', () => {
    const update = buildQuoteConversionUpdate({
      orderIdFromQuote: 'ORDER-from-quote-1',
      status: 'paid',
      stripeSessionId: 'cs_test_1',
      stripePaymentIntentId: 'pi_test_1',
    });
    expect(update).toMatchObject({
      order_id: 'ORDER-from-quote-1',
      status: 'paid',
      quote_converted: true,
      stripe_session_id: 'cs_test_1',
    });
  });
});
