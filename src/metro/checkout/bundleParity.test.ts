// Guards against the checked-in Deno bundle (supabase/functions/_shared/metro-checkout.bundle.js)
// drifting from its source (src/metro/checkout/bundleEntry.ts, which re-exports serverQuote.ts +
// verifyLogic.ts + conversion.ts + emailTemplates.ts). The edge functions import only the
// bundle, never src/ directly, so if someone edits any of those modules (or anything they pull
// in under src/metro/**) and forgets to regenerate the bundle, production would silently keep
// running stale logic. This test bundles nothing itself — it just re-runs buildServerQuote /
// buildMetroOrderRowFromMetadata from both the source entry point and the generated bundle for
// every metro x zone x variant at a few quantities and asserts identical output.
import { describe, expect, it, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { METROS } from '../config';
import { getDeliveryDayOptions } from '../lib/dates';
import * as src from './bundleEntry';
import type { MetroCheckoutRequest } from './contract';

const BUNDLE_PATH = path.resolve(__dirname, '../../../supabase/functions/_shared/metro-checkout.bundle.js');
const REGEN_HINT =
  'Bundle is missing or stale. Run: node scripts/metro/export-metro-checkout-bundle.mjs';

let bundled: typeof src;

beforeAll(async () => {
  if (!existsSync(BUNDLE_PATH)) {
    throw new Error(REGEN_HINT);
  }
  bundled = await import(/* @vite-ignore */ BUNDLE_PATH);
});

const NOW = new Date('2026-09-28T15:00:00Z'); // well after every metro's cutoffHour in its own timezone

function buildRequest(
  metroSlug: string,
  zip: string,
  categorySlug: string,
  variantSlug: string,
  quantity: number,
  deliveryDate: string,
): MetroCheckoutRequest {
  return {
    metroSlug,
    zip,
    categorySlug,
    variantSlug,
    quantity,
    deliveryDate,
    contact: { name: 'Parity Test', email: 'parity@example.com', mobile: '5555555555' },
    address: { street: '1 Test St', state: 'XX', zip },
    // Deliberately wrong — buildServerQuote always attaches `serverQuote` on both the
    // PRICE_CHANGED and BELOW_MINIMUM branches (and on success), so comparing `.serverQuote`
    // across src vs. bundled is valid regardless of whether this happens to match.
    expectedTotal: 0,
  };
}

describe('metro-checkout.bundle.js parity with src/metro/checkout/serverQuote.ts', () => {
  for (const metro of METROS) {
    const dayOptions = getDeliveryDayOptions(metro, NOW);
    const deliveryDate = dayOptions[0]?.date;

    for (const zone of metro.zones) {
      const zip = zone.zips[0];

      for (const category of metro.categories) {
        for (const variant of category.variants) {
          for (const quantity of [zone.minUnits, zone.minUnits + 5, zone.minUnits * 3 + 1]) {
            it(`${metro.slug} / ${zone.slug} / ${category.slug}/${variant.slug} @ qty ${quantity}`, () => {
              expect(deliveryDate, 'metro has no deliverable day options').toBeDefined();

              const request = buildRequest(metro.slug, zip, category.slug, variant.slug, quantity, deliveryDate!);
              const opts = { allowUnconfirmed: true };

              const srcResult = src.buildServerQuote(request, NOW, opts);
              const bundledResult = bundled.buildServerQuote(request, NOW, opts);

              expect(bundledResult.ok, REGEN_HINT).toBe(srcResult.ok);
              expect((bundledResult as { code?: string }).code, REGEN_HINT).toBe(
                (srcResult as { code?: string }).code,
              );

              const srcQuote = srcResult.ok === true ? srcResult.quote : srcResult.serverQuote;
              const bundledQuote = bundledResult.ok === true ? bundledResult.quote : bundledResult.serverQuote;
              expect(bundledQuote, REGEN_HINT).toEqual(srcQuote);
            });
          }
        }
      }
    }
  }

  it('buildMetroOrderRowFromMetadata (conversion.ts) produces identical rows from src and bundle', () => {
    const metro = METROS[0];
    const zone = metro.zones[0];
    const category = metro.categories[0];
    const variant = category.variants[0];
    const dayOptions = getDeliveryDayOptions(metro, NOW);
    const request: MetroCheckoutRequest = {
      ...buildRequest(metro.slug, zone.zips[0], category.slug, variant.slug, zone.minUnits + 2, dayOptions[0].date),
      expectedTotal: 999999,
      utmData: { utm_source: 'google', gclid: 'abc123' },
      dropNotes: 'Leave by the garage',
    };
    const opts = { allowUnconfirmed: true };
    const srcResult = src.buildServerQuote(request, NOW, opts);
    const bundledResult = bundled.buildServerQuote(request, NOW, opts);
    // Both should be PRICE_CHANGED given the deliberately-wrong expectedTotal, but both still
    // carry a serverQuote we can build a row from.
    const srcQuote = srcResult.ok === true ? srcResult.quote : srcResult.serverQuote!;
    const bundledQuote = bundledResult.ok === true ? bundledResult.quote : bundledResult.serverQuote!;

    const rowOpts = {
      orderId: 'ORDER-METRO-TEST-1',
      request,
      status: 'authorized' as const,
      stripeSessionId: 'cs_test_parity',
      stripePaymentIntentId: 'pi_test_parity',
    };
    const srcRow = src.buildMetroOrderRowFromMetadata({ ...rowOpts, serverQuote: srcQuote });
    const bundledRow = bundled.buildMetroOrderRowFromMetadata({ ...rowOpts, serverQuote: bundledQuote });
    expect(bundledRow, REGEN_HINT).toEqual(srcRow);
  });
});
