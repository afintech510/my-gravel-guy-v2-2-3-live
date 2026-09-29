// Guards against the checked-in Deno bundle (supabase/functions/_shared/checkout-v2.bundle.js)
// drifting from its source (src/services/checkoutV2/bundleEntry.ts). The edge functions
// (create-auth-hold-v2, verify-payment-v2) import only the bundle, never src/ directly, so if
// someone edits any of contract/pricing/metadata/binding/statusMapping/idempotency/emailPayload/
// orderRecords.ts (or src/utils/emailTemplates.ts) and forgets to regenerate the bundle,
// production would silently keep running stale logic. Same pattern as
// src/metro/checkout/bundleParity.test.ts.
import { describe, expect, it, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import * as src from './bundleEntry';

const BUNDLE_PATH = path.resolve(__dirname, '../../../supabase/functions/_shared/checkout-v2.bundle.js');
const REGEN_HINT = 'Bundle is missing or stale. Run: node scripts/checkout/export-checkout-v2-bundle.mjs';

let bundled: typeof src;

beforeAll(async () => {
  if (!existsSync(BUNDLE_PATH)) {
    throw new Error(REGEN_HINT);
  }
  bundled = await import(/* @vite-ignore */ BUNDLE_PATH);
});

describe('checkout-v2.bundle.js parity with src/services/checkoutV2', () => {
  it('computeExpectedTotalCents matches across src and bundle', () => {
    const items = [
      { price: 49.99, quantity: 3 },
      { price: 10, quantity: 2 },
    ];
    expect(bundled.computeExpectedTotalCents(items, false), REGEN_HINT).toBe(
      src.computeExpectedTotalCents(items, false),
    );
    expect(bundled.computeExpectedTotalCents(items, true), REGEN_HINT).toBe(
      src.computeExpectedTotalCents(items, true),
    );
  });

  it('evaluateItemPrices matches across src and bundle', () => {
    const items = [{ id: 'p1', name: 'Gravel', price: 5, quantity: 40 }];
    const dbPrices = [{ id: 'p1', price: 25 }];
    expect(bundled.evaluateItemPrices(items, dbPrices, false), REGEN_HINT).toEqual(
      src.evaluateItemPrices(items, dbPrices, false),
    );
  });

  it('buildCheckoutV2Metadata / parseCheckoutV2Metadata round-trip matches across src and bundle', () => {
    const input = {
      orderId: 'ORDER-1',
      expectedTotalCents: 1234,
      depositOption: false,
      priceCheck: 'unverifiable' as const,
      items: [{ id: 1, price: 10, quantity: 2 }],
      userId: 'guest',
      userEmail: 'test@example.com',
      isGuest: true,
    };
    const srcMeta = src.buildCheckoutV2Metadata(input);
    const bundledMeta = bundled.buildCheckoutV2Metadata(input);
    expect(bundledMeta, REGEN_HINT).toEqual(srcMeta);
    const asRecord = (m: typeof bundledMeta) => m as unknown as Record<string, string>;
    expect(bundled.parseCheckoutV2Metadata(asRecord(bundledMeta)), REGEN_HINT).toEqual(
      src.parseCheckoutV2Metadata(asRecord(srcMeta)),
    );
  });

  it('evaluateBinding matches across src and bundle', () => {
    expect(bundled.evaluateBinding('ORDER-a', 'ORDER-b', 100, 100), REGEN_HINT).toEqual(
      src.evaluateBinding('ORDER-a', 'ORDER-b', 100, 100),
    );
  });

  it('computeOrderStatus matches across src and bundle', () => {
    const verification = { paymentVerified: true, isAuthorized: false, usedFallback: false };
    expect(bundled.computeOrderStatus(verification, true), REGEN_HINT).toBe(src.computeOrderStatus(verification, true));
  });

  it('buildFreshOrderRecords matches across src and bundle', () => {
    const input = {
      orderId: 'ORDER-1',
      status: 'authorized' as const,
      stripeSessionId: 'cs_test_1',
      stripePaymentIntentId: 'pi_test_1',
      billingName: 'Jane Doe',
      billingEmail: 'jane@example.com',
      couponCode: null,
      couponDiscount: 0,
      depositOption: false,
      items: [{ id: 'a', price: 25, quantity: 1, tons: 4, total_price: 100 }],
    };
    expect(bundled.buildFreshOrderRecords(input), REGEN_HINT).toEqual(src.buildFreshOrderRecords(input));
  });

  it('buildOrderEmailData escaping matches across src and bundle', () => {
    const input = {
      orderId: 'ORDER-1',
      customerEmail: 'test@example.com',
      customerName: '<b>Jane</b>',
      rows: [{ product_name: '<i>Gravel</i>', quantity: 1, total_price: 100 }],
    };
    expect(bundled.buildOrderEmailData(input), REGEN_HINT).toEqual(src.buildOrderEmailData(input));
  });

  it('generateCustomerConfirmationEmail (re-exported from src/utils/emailTemplates.ts) matches across src and bundle', () => {
    const orderData = {
      order_id: 'ORDER-1',
      items: [{ product_name: 'Gravel', quantity: 1, total_price: 100 }],
      total_amount: 100,
      customer_email: 'test@example.com',
      customer_name: 'Jane',
    };
    expect(bundled.generateCustomerConfirmationEmail(orderData), REGEN_HINT).toBe(
      src.generateCustomerConfirmationEmail(orderData),
    );
  });
});
