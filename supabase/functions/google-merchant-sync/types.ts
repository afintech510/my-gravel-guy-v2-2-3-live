// Local type mirrors of the price-book JSON shape (see
// src/services/googleShopping/priceBookExport.ts on the frontend side) plus the Merchant
// API request/response shapes this function builds.
//
// Deliberately NOT imported from src/metro/** or src/services/googleShopping/** across the
// Deno/Node boundary: the price-book.json file *is* the contract between the two runtimes.
// Duplicating the shape here keeps this function deployable standalone (Supabase CLI only
// needs to bundle this directory + its Deno-graph imports) and keeps a hard boundary so a
// future change to src/metro's internal types can't silently break this function without a
// price-book.json regeneration + review step in between.

export interface PriceBookZone {
  slug: string;
  name: string;
  zips: string[];
  minUnits: number;
}

export interface PriceBookZonePrice {
  zoneSlug: string;
  zoneName: string;
  referenceQuantityPrice: number;
  minOrderQuantity: number;
  minOrderPrice: number;
  pricePerUnit: number;
}

export interface PriceBookProduct {
  id: string;
  metroSlug: string;
  metroName: string;
  categorySlug: string;
  categoryName: string;
  variantSlug: string;
  variantName: string;
  unit: string;
  referenceQuantity: number;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  brand: string;
  condition: 'new';
  availability: 'in_stock' | 'out_of_stock';
  googleProductCategory: string;
  shippingNote: string;
  basePrice: number;
  zonePrices: PriceBookZonePrice[];
}

export interface PriceBookMetro {
  slug: string;
  name: string;
  status: string;
  priceBookConfirmed: boolean;
  zones: PriceBookZone[];
  products: PriceBookProduct[];
}

export interface PriceBook {
  generatedAt: string;
  siteBaseUrl: string;
  brand: string;
  referenceQuantity: number;
  metros: PriceBookMetro[];
}

// --- Merchant API payload shapes (best-effort — see merchantApi.ts header comment on
// verification status before flipping dryRun off) ---

export interface RegionPayload {
  /** Merchant API region resource name once created: accounts/{account}/regions/{regionId} */
  regionId: string;
  displayName: string;
  postalCodeArea: {
    regionCode: 'US';
    postalCodes: Array<{ begin: string }>;
  };
}

export interface ProductInputPayload {
  offerId: string;
  contentLanguage: 'en';
  feedLabel: 'US';
  channel: 'ONLINE';
  attributes: {
    title: string;
    description: string;
    link: string;
    imageLink: string;
    brand: string;
    condition: 'new';
    availability: 'in stock' | 'out of stock';
    price: { amountMicros: string; currencyCode: 'USD' };
    googleProductCategory: string;
    shippingLabel: string;
    /** [unverified attribute name — see merchantApi.ts] */
    minimumOrderQuantity?: { minOrderQuantity: number };
  };
}

export interface RegionalInventoryPayload {
  productId: string;
  regionId: string;
  price: { amountMicros: string; currencyCode: 'USD' };
  availability: 'in stock' | 'out of stock';
}

export interface SyncItemResult {
  kind: 'region' | 'productInput' | 'regionalInventory';
  key: string;
  ok: boolean;
  status?: number;
  error?: string;
}

export interface SyncSummary {
  dryRun: boolean;
  metroFilter: string | null;
  generatedAt: string;
  priceBookGeneratedAt: string;
  counts: {
    regions: number;
    productInputs: number;
    regionalInventories: number;
  };
  /** Present in dryRun mode: full payload previews. Trimmed in live mode to keep the response small. */
  payloads?: {
    regions: RegionPayload[];
    productInputs: ProductInputPayload[];
    regionalInventories: RegionalInventoryPayload[];
  };
  /** Present in live mode: per-item outcomes (only failures kept in full; successes summarized as a count). */
  results?: {
    succeeded: number;
    failed: number;
    failures: SyncItemResult[];
  };
}
