// Builds Merchant API payloads from the price book and (when dryRun is false) pushes them
// to Google. See docs/metro/research/merchant-api-implementation.md for the full
// architecture writeup; this file is the mechanical half of it.
//
// [VERIFICATION STATUS] This agent's operating constraints for this task included "never
// call live Google APIs" — every request shape below is built from the Merchant API guides
// the AI-ADS+SHOPPING research agent fetched directly (regions, products/ProductInput vs
// Product, accounts.products.regionalInventories — see the research doc's Appendix sources
// log), but the exact JSON field names/paths were NOT re-verified against a live call or the
// current REST reference page in this session. Treat every payload shape here as
// "best-effort, structurally-plausible, unverified" until a human runs one real call with
// dryRun=false against a sandbox/test Merchant Center account and confirms the response.
//
// Resource base paths (per developers.google.com/merchant/api, as organized in the research
// doc's B3): accounts_v1 (regions live under accounts), products_v1 (productInputs),
// inventories_v1 (regionalInventories).
import type {
  PriceBook,
  PriceBookMetro,
  PriceBookProduct,
  ProductInputPayload,
  RegionalInventoryPayload,
  RegionPayload,
  SyncItemResult,
} from './types.ts';

export const MERCHANT_API_ROOT = 'https://merchantapi.googleapis.com';

const usdToAmountMicros = (usd: number): string => String(Math.round(usd * 1_000_000));

const availabilityToMerchantString = (availability: 'in_stock' | 'out_of_stock'): 'in stock' | 'out of stock' =>
  availability === 'in_stock' ? 'in stock' : 'out of stock';

export const regionId = (metroSlug: string, zoneSlug: string): string => `mgg-${metroSlug}-${zoneSlug}`;

export function buildRegions(metro: PriceBookMetro): RegionPayload[] {
  return metro.zones.map(zone => ({
    regionId: regionId(metro.slug, zone.slug),
    displayName: `${metro.name} — ${zone.name}`,
    postalCodeArea: {
      regionCode: 'US',
      postalCodes: zone.zips.map(zip => ({ begin: zip })),
    },
  }));
}

export function buildProductInput(product: PriceBookProduct): ProductInputPayload {
  return {
    offerId: product.id,
    contentLanguage: 'en',
    feedLabel: 'US',
    channel: 'ONLINE',
    attributes: {
      title: product.title,
      description: product.description,
      link: product.link,
      imageLink: product.imageLink,
      brand: product.brand,
      condition: product.condition,
      availability: availabilityToMerchantString(product.availability),
      price: { amountMicros: usdToAmountMicros(product.basePrice), currencyCode: 'USD' },
      googleProductCategory: product.googleProductCategory,
      shippingLabel: product.shippingNote,
      // [unverified attribute name] Merchant Center's product data spec documents
      // min_order_quantity as a feed attribute (see research doc B2); its exact Merchant
      // API JSON attribute name was not confirmed live. Omit this key entirely rather than
      // guess further if it turns out not to exist under this name — Google will simply
      // ignore an unrecognized attribute name rather than error, but don't rely on that.
      minimumOrderQuantity: { minOrderQuantity: Math.min(...product.zonePrices.map(zp => zp.minOrderQuantity)) },
    },
  };
}

export function buildRegionalInventories(metroSlug: string, product: PriceBookProduct): RegionalInventoryPayload[] {
  return product.zonePrices.map(zp => ({
    productId: product.id,
    regionId: regionId(metroSlug, zp.zoneSlug),
    price: { amountMicros: usdToAmountMicros(zp.referenceQuantityPrice), currencyCode: 'USD' },
    availability: availabilityToMerchantString(product.availability),
  }));
}

export interface BuiltPayloads {
  regions: RegionPayload[];
  productInputs: ProductInputPayload[];
  regionalInventories: RegionalInventoryPayload[];
}

export function buildPayloadsForPriceBook(priceBook: PriceBook, metroFilter: string | null): BuiltPayloads {
  const metros = metroFilter ? priceBook.metros.filter(m => m.slug === metroFilter) : priceBook.metros;

  const regions: RegionPayload[] = [];
  const productInputs: ProductInputPayload[] = [];
  const regionalInventories: RegionalInventoryPayload[] = [];

  for (const metro of metros) {
    regions.push(...buildRegions(metro));
    for (const product of metro.products) {
      productInputs.push(buildProductInput(product));
      regionalInventories.push(...buildRegionalInventories(metro.slug, product));
    }
  }

  return { regions, productInputs, regionalInventories };
}

// --- Live-call helpers (only exercised when dryRun === false) ---

interface CallOptions {
  accessToken: string;
  merchantAccountId: string;
  dataSourceId?: string;
}

async function callWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 3,
): Promise<{ ok: boolean; status: number; body?: unknown; error?: string }> {
  let attempt = 0;
  let lastError = '';
  while (attempt <= maxRetries) {
    try {
      const response = await fetch(url, init);
      if (response.status === 429 || response.status >= 500) {
        lastError = `HTTP ${response.status}`;
        attempt += 1;
        if (attempt > maxRetries) break;
        // Exponential backoff: 300ms, 900ms, 2700ms
        await new Promise(resolve => setTimeout(resolve, 300 * 3 ** (attempt - 1)));
        continue;
      }
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        return { ok: false, status: response.status, error: text || response.statusText };
      }
      const body = await response.json().catch(() => undefined);
      return { ok: true, status: response.status, body };
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      attempt += 1;
      if (attempt > maxRetries) break;
      await new Promise(resolve => setTimeout(resolve, 300 * 3 ** (attempt - 1)));
    }
  }
  return { ok: false, status: 0, error: lastError || 'unknown error after retries' };
}

const authHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

export async function pushRegion(payload: RegionPayload, opts: CallOptions): Promise<SyncItemResult> {
  const parent = `accounts/${opts.merchantAccountId}`;
  const url = `${MERCHANT_API_ROOT}/accounts/v1/${parent}/regions?regionId=${encodeURIComponent(payload.regionId)}`;
  const result = await callWithRetry(url, {
    method: 'POST',
    headers: authHeaders(opts.accessToken),
    body: JSON.stringify({ displayName: payload.displayName, postalCodeArea: payload.postalCodeArea }),
  });
  return { kind: 'region', key: payload.regionId, ok: result.ok, status: result.status, error: result.error };
}

export async function pushProductInput(payload: ProductInputPayload, opts: CallOptions): Promise<SyncItemResult> {
  if (!opts.dataSourceId) {
    return { kind: 'productInput', key: payload.offerId, ok: false, error: 'missing dataSourceId' };
  }
  const parent = `accounts/${opts.merchantAccountId}`;
  const dataSource = `accounts/${opts.merchantAccountId}/dataSources/${opts.dataSourceId}`;
  const url =
    `${MERCHANT_API_ROOT}/products/v1/${parent}/productInputs:insert` +
    `?dataSource=${encodeURIComponent(dataSource)}`;
  const result = await callWithRetry(url, {
    method: 'POST',
    headers: authHeaders(opts.accessToken),
    body: JSON.stringify(payload),
  });
  return { kind: 'productInput', key: payload.offerId, ok: result.ok, status: result.status, error: result.error };
}

export async function pushRegionalInventory(
  payload: RegionalInventoryPayload,
  opts: CallOptions,
): Promise<SyncItemResult> {
  const parent = `accounts/${opts.merchantAccountId}/products/${payload.productId}`;
  const url = `${MERCHANT_API_ROOT}/inventories/v1/${parent}/regionalInventories:insert`;
  const result = await callWithRetry(url, {
    method: 'POST',
    headers: authHeaders(opts.accessToken),
    body: JSON.stringify({ regionId: payload.regionId, price: payload.price, availability: payload.availability }),
  });
  const key = `${payload.productId}/${payload.regionId}`;
  return { kind: 'regionalInventory', key, ok: result.ok, status: result.status, error: result.error };
}

/**
 * Push all payloads sequentially with a small delay between calls (Merchant API is
 * batch-capable per the research doc, but a from-scratch batch implementation without a
 * live call to verify request/response batching semantics is riskier than a slow, correct
 * sequential loop — revisit once step 1 below has been live-verified).
 */
export async function pushAll(
  payloads: BuiltPayloads,
  opts: CallOptions,
  delayMs = 150,
): Promise<{ succeeded: number; failed: number; failures: SyncItemResult[] }> {
  const results: SyncItemResult[] = [];
  const sleep = () => new Promise(resolve => setTimeout(resolve, delayMs));

  for (const region of payloads.regions) {
    results.push(await pushRegion(region, opts));
    await sleep();
  }
  for (const productInput of payloads.productInputs) {
    results.push(await pushProductInput(productInput, opts));
    await sleep();
  }
  for (const inventory of payloads.regionalInventories) {
    results.push(await pushRegionalInventory(inventory, opts));
    await sleep();
  }

  const failures = results.filter(r => !r.ok);
  return { succeeded: results.length - failures.length, failed: failures.length, failures };
}
