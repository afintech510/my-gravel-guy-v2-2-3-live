import { describe, expect, it } from 'vitest';
import type { MetroOrderRow } from './verifyLogic';
import {
  buildConfirmedOrder,
  buildErrorResponse,
  buildReviewRequiredResponse,
  buildSuccessResponse,
  extractPaymentIntentId,
  httpStatusForResponse,
  isMetroCheckoutWebhookEvent,
  mapPaymentIntentStatus,
  parseZoneAndTruckPlanFromNotes,
  rowStatusToPaymentStatus,
  validateSession,
  validateVerifyRequest,
} from './verifyLogic';

function baseRow(overrides: Partial<MetroOrderRow> = {}): MetroOrderRow {
  return {
    attachment_files: null,
    balance_due: null,
    base_price: 312.5,
    billing_email: 'jane@example.com',
    billing_name: 'Jane Doe',
    confirmation_deadline_at: null,
    confirmed_at: null,
    coupon: null,
    created_at: null,
    delivered_at: null,
    delivery_city: 'Dallas',
    delivery_date: '2026-10-05',
    delivery_email: 'jane@example.com',
    delivery_instructions: null,
    delivery_name: 'Jane Doe',
    delivery_phone: '2145551234',
    delivery_state: 'TX',
    delivery_street: '123 Main St',
    delivery_time_preference: null,
    delivery_zip: '75201',
    deposit_amount: null,
    expedite_fee_amount: 0,
    expedite_fee_pct: null,
    fulfillment_eta: null,
    fulfillment_status: null,
    ga4_purchase_fired: null,
    gbraid: null,
    gclid: null,
    id: 'row-id-1',
    is_deposit_payment: null,
    landing_page_url: null,
    market_slug: 'dallas-fort-worth',
    material_slug: 'gravel/pea-gravel',
    notes: 'Zone: Core (dfw-core). Truck plan: 10 tons (Large dump). metro-checkout v2 (post-payment insert).',
    order_id: 'ORDER-METRO-1735689600000-a1b2c3',
    original_quote_id: null,
    payment_terms: null,
    product_id: 'metro:dallas-fort-worth:gravel:pea-gravel',
    quantity: 10,
    quote_converted: null,
    quote_expires_at: null,
    quote_notes: null,
    quote_status: null,
    quoted_price: null,
    referrer: null,
    sales_commission: null,
    sales_person: null,
    saturday_fee_amount: 0,
    saturday_fee_pct: null,
    status: 'authorized',
    stripe_payment_intent_id: 'pi_123',
    stripe_session_id: 'cs_test_123',
    supplier_charges: null,
    supplier_id: null,
    supplier_paidby: null,
    tags: ['metro', 'dallas-fort-worth'],
    total_price: 312.5,
    unit: 'ton',
    unit_price: 31.25,
    updated_at: null,
    user_agent: null,
    utm_campaign: null,
    utm_content: null,
    utm_medium: null,
    utm_source: null,
    utm_term: null,
    wbraid: null,
    zip_adjust: null,
    ...overrides,
  };
}

describe('validateVerifyRequest', () => {
  it('accepts an ORDER-METRO- order id', () => {
    const result = validateVerifyRequest({ sessionId: 'cs_test_123', orderId: 'ORDER-METRO-123-abc' });
    expect(result).toEqual({ ok: true, orderId: 'ORDER-METRO-123-abc' });
  });

  it('rejects a CART-METRO- order id (no more staging prefix)', () => {
    const result = validateVerifyRequest({ sessionId: 'cs_test_123', orderId: 'CART-METRO-123-abc' });
    expect(result.ok).toBe(false);
  });

  it('rejects a missing body', () => {
    const result = validateVerifyRequest(null);
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.status).toBe('invalid');
  });

  it('rejects a missing/empty sessionId', () => {
    const result = validateVerifyRequest({ sessionId: '', orderId: 'ORDER-METRO-123-abc' });
    expect(result.ok).toBe(false);
  });

  it('rejects a non-metro order id', () => {
    const result = validateVerifyRequest({ sessionId: 'cs_test_123', orderId: 'ORDER-1234-abc' });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.error).toMatch(/metro/i);
  });

  it('rejects a QUOTE- order id (not metro)', () => {
    const result = validateVerifyRequest({ sessionId: 'cs_test_123', orderId: 'QUOTE-123' });
    expect(result.ok).toBe(false);
  });
});

describe('validateSession', () => {
  const orderId = 'ORDER-METRO-123-abc';

  it('accepts a matching metro-checkout session', () => {
    const result = validateSession({ metadata: { source: 'metro-checkout', orderId } }, orderId);
    expect(result).toEqual({ ok: true });
  });

  it('rejects a missing session as not_found', () => {
    const result = validateSession(null, orderId);
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.status).toBe('not_found');
  });

  it('rejects a session from a different source as not_found', () => {
    const result = validateSession({ metadata: { source: 'checkout', orderId } }, orderId);
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.status).toBe('not_found');
  });

  it('rejects a session for a different order id as invalid', () => {
    const result = validateSession({ metadata: { source: 'metro-checkout', orderId: 'ORDER-METRO-999-zzz' } }, orderId);
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.status).toBe('invalid');
  });
});

describe('extractPaymentIntentId', () => {
  it('returns the id from an expanded payment_intent object', () => {
    expect(extractPaymentIntentId({ payment_intent: { id: 'pi_123', status: 'succeeded' } })).toBe('pi_123');
  });

  it('returns a string payment_intent as-is', () => {
    expect(extractPaymentIntentId({ payment_intent: 'pi_123' })).toBe('pi_123');
  });

  it('returns null when absent', () => {
    expect(extractPaymentIntentId({ payment_intent: null })).toBeNull();
    expect(extractPaymentIntentId({})).toBeNull();
  });
});

describe('mapPaymentIntentStatus', () => {
  it.each([
    ['requires_capture', 'authorized'],
    ['succeeded', 'paid'],
    ['requires_payment_method', 'unpaid'],
    ['canceled', 'unpaid'],
    [undefined, 'unpaid'],
  ])('maps PaymentIntent status %s -> %s', (status, expected) => {
    expect(mapPaymentIntentStatus({ payment_intent: { status } })).toBe(expected);
  });

  it('treats a string (unexpanded) payment_intent as unpaid', () => {
    expect(mapPaymentIntentStatus({ payment_intent: 'pi_123' })).toBe('unpaid');
  });
});

describe('rowStatusToPaymentStatus', () => {
  it.each([
    ['authorized', 'authorized'],
    ['paid', 'paid'],
    ['review_required', null],
    ['cart', null],
    [null, null],
    [undefined, null],
  ])('maps row status %s -> %s', (status, expected) => {
    expect(rowStatusToPaymentStatus(status as string | null | undefined)).toBe(expected);
  });
});

describe('parseZoneAndTruckPlanFromNotes', () => {
  it('extracts zone name and truck plan from the standard notes format', () => {
    const notes = 'Zone: Core (dfw-core). Truck plan: 10 tons (Large dump). metro-checkout v2 (post-payment insert).';
    expect(parseZoneAndTruckPlanFromNotes(notes)).toEqual({
      zoneName: 'Core',
      truckPlan: '10 tons (Large dump)',
    });
  });

  it('extracts zone/truck plan even with fee lines and a review-required tag in between', () => {
    const notes =
      'Zone: Far North (dfw-far-north). Truck plan: 5 tons (Small dump) + 3 tons (Small dump). ' +
      'Saturday fee: $25.00. Rush fee: $50.00. metro-checkout v2 (post-payment insert). [REVIEW REQUIRED] amount mismatch.';
    expect(parseZoneAndTruckPlanFromNotes(notes)).toEqual({
      zoneName: 'Far North',
      truckPlan: '5 tons (Small dump) + 3 tons (Small dump)',
    });
  });

  it('returns empty object for null/unparseable notes', () => {
    expect(parseZoneAndTruckPlanFromNotes(null)).toEqual({});
    expect(parseZoneAndTruckPlanFromNotes('some unrelated note')).toEqual({});
  });
});

describe('buildConfirmedOrder', () => {
  it('resolves variant name and unit from the metro config via market_slug/material_slug', () => {
    const order = buildConfirmedOrder(baseRow());
    expect(order).toMatchObject({
      orderId: 'ORDER-METRO-1735689600000-a1b2c3',
      metroSlug: 'dallas-fort-worth',
      quantity: 10,
      unit: 'ton',
      total: 312.5,
      deliveryDate: '2026-10-05',
      deliveryStreet: '123 Main St',
      deliveryCity: 'Dallas',
      deliveryState: 'TX',
      deliveryZip: '75201',
      zoneName: 'Core',
      truckPlan: '10 tons (Large dump)',
      customerEmail: 'jane@example.com',
    });
    expect(order.variantName).not.toBe('pea-gravel'); // resolved to the real display name
  });

  it('falls back to the raw slug/product_id when the metro/category/variant cannot be resolved', () => {
    const order = buildConfirmedOrder(
      baseRow({ market_slug: 'unknown-metro', material_slug: 'gravel/unknown-variant', notes: null }),
    );
    expect(order.metroSlug).toBe('unknown-metro');
    expect(order.variantName).toBe('unknown-variant');
    expect(order.zoneName).toBeUndefined();
    expect(order.truckPlan).toBeUndefined();
  });

  it('falls back to billing_email when delivery_email is missing', () => {
    const order = buildConfirmedOrder(baseRow({ delivery_email: null, billing_email: 'billing@example.com' }));
    expect(order.customerEmail).toBe('billing@example.com');
  });

  it('omits deliveryCity when null', () => {
    const order = buildConfirmedOrder(baseRow({ delivery_city: null }));
    expect(order.deliveryCity).toBeUndefined();
  });
});

describe('buildSuccessResponse / buildErrorResponse / buildReviewRequiredResponse / httpStatusForResponse', () => {
  it('builds a success response with alreadyProcessed false', () => {
    const response = buildSuccessResponse(baseRow({ status: 'paid' }), 'paid', false);
    expect(response).toMatchObject({
      success: true,
      orderId: 'ORDER-METRO-1735689600000-a1b2c3',
      status: 'paid',
      alreadyProcessed: false,
    });
    expect(httpStatusForResponse(response)).toBe(200);
  });

  it('builds a success response with alreadyProcessed true', () => {
    const response = buildSuccessResponse(baseRow(), 'authorized', true);
    expect(response.success && response.alreadyProcessed).toBe(true);
  });

  it('builds a success response for a Stripe test-mode order with status "test"', () => {
    const response = buildSuccessResponse(baseRow({ status: 'test' }), 'test', false);
    expect(response).toMatchObject({ success: true, status: 'test', alreadyProcessed: false });
    expect(httpStatusForResponse(response)).toBe(200);
  });

  it('builds a review-required response as a mismatch-status failure, never a success', () => {
    const response = buildReviewRequiredResponse();
    expect(response).toEqual({
      success: false,
      status: 'mismatch',
      error: "The charged amount does not match this order's total. Please contact support.",
    });
    expect(httpStatusForResponse(response)).toBe(409);
  });

  it.each([
    ['invalid', 400],
    ['not_found', 404],
    ['mismatch', 409],
    ['unpaid', 200],
    ['error', 500],
  ] as const)('maps error status %s -> HTTP %d', (status, expectedHttp) => {
    const response = buildErrorResponse(status, 'boom');
    expect(response).toEqual({ success: false, status, error: 'boom' });
    expect(httpStatusForResponse(response)).toBe(expectedHttp);
  });
});

describe('isMetroCheckoutWebhookEvent', () => {
  it('accepts checkout.session.completed for a metro-checkout session', () => {
    expect(
      isMetroCheckoutWebhookEvent({
        type: 'checkout.session.completed',
        data: { object: { metadata: { source: 'metro-checkout' } } },
      }),
    ).toBe(true);
  });

  it('accepts checkout.session.async_payment_succeeded for a metro-checkout session', () => {
    expect(
      isMetroCheckoutWebhookEvent({
        type: 'checkout.session.async_payment_succeeded',
        data: { object: { metadata: { source: 'metro-checkout' } } },
      }),
    ).toBe(true);
  });

  it('rejects an unrelated event type', () => {
    expect(
      isMetroCheckoutWebhookEvent({
        type: 'payment_intent.succeeded',
        data: { object: { metadata: { source: 'metro-checkout' } } },
      }),
    ).toBe(false);
  });

  it('rejects a checkout.session.completed for a non-metro session (e.g. the live create-auth-hold flow)', () => {
    expect(
      isMetroCheckoutWebhookEvent({
        type: 'checkout.session.completed',
        data: { object: { metadata: { source: 'create-auth-hold' } } },
      }),
    ).toBe(false);
  });

  it('rejects a session with no metadata at all', () => {
    expect(isMetroCheckoutWebhookEvent({ type: 'checkout.session.completed', data: { object: {} } })).toBe(false);
  });

  it('rejects a missing/malformed event', () => {
    expect(isMetroCheckoutWebhookEvent(null)).toBe(false);
    expect(isMetroCheckoutWebhookEvent(undefined)).toBe(false);
  });
});
