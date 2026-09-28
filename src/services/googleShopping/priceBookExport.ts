// Price-book export logic for the Google Merchant API sync pipeline.
//
// Pure, side-effect-free TS module (no React, no browser/Deno APIs) so it can be:
//  (a) unit tested directly with vitest (see priceBookExport.test.ts), and
//  (b) bundled + run standalone by scripts/metro/export-price-book.mjs, which writes
//      the JSON this produces to supabase/functions/google-merchant-sync/price-book.json
//      for the edge function to read at sync time.
//
// Source of truth for metro/zone/pricing data is src/metro/** (owned by METRO-CORE —
// this file only reads from it via the public quote()/METROS exports, never duplicates
// zone/ZIP/price data). See docs/metro/research/ai-ads-and-google-shopping.md Part B3
// for why this "metro -> zone (ZIP set) -> regional price" shape mirrors Google's own
// Merchant API `regions` + `regionalInventories` primitive.
//
// Relative imports (not the `@/` alias) on purpose: this module is bundled standalone
// by esbuild from the .mjs export script, outside Vite's resolver.
import type { CategorySlug, Metro, MaterialCategory, MaterialVariant, SellUnit } from '../../metro/types';
import { METROS } from '../../metro/config';
import { formatUnit, quote } from '../../metro/lib/pricing';

export const MGG_BRAND = 'MyGravelGuy';
export const DEFAULT_SITE_BASE_URL = 'https://mygravelguy.com';
/** Reference bundle size used for the Shopping-feed "fixed bundle" price (see B2 in the
 * research doc: unit_pricing_measure can't express ton/cubic-yard, so we sell a fixed
 * "N-unit load" bundle instead of a per-unit price). */
export const DEFAULT_REFERENCE_QUANTITY = 10;

/**
 * Best-effort Google product taxonomy paths for our four material categories.
 * [NEEDS_REAL_NUMBER / unverified] These are our best-effort mapping based on general
 * familiarity with Google's public product taxonomy, sourced by category *name*
 * pattern-matching, NOT fetched from the live taxonomy file in this session (per the
 * "never call live Google APIs" operating constraint for this agent). The research doc
 * (B4 #7) already flagged the repo's old numeric IDs (1279/1278) as unverified.
 *
 * Before the first live sync, download the current taxonomy file
 * (https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt) and grep
 * for "Rocks & Stones", "Mulch", and "Soil" (or their nearest current equivalents) to
 * confirm the exact path text / numeric ID, then update this map. Using the full path
 * *string* (rather than only a numeric ID) is deliberate: Merchant API's
 * googleProductCategory attribute accepts the human-readable path, and a stale-but-close
 * string degrades more gracefully at review time than a wrong numeric ID.
 */
export const GOOGLE_PRODUCT_CATEGORY: Record<CategorySlug, string> = {
  gravel: 'Home & Garden > Lawn & Garden > Landscape & Garden Rocks & Stones',
  sand: 'Home & Garden > Lawn & Garden > Landscape & Garden Rocks & Stones',
  mulch: 'Home & Garden > Lawn & Garden > Mulch',
  soil: 'Home & Garden > Lawn & Garden > Compost & Soil',
};

export interface PriceBookZone {
  slug: string;
  name: string;
  zips: string[];
  minUnits: number;
}

export interface PriceBookZonePrice {
  zoneSlug: string;
  zoneName: string;
  /** Delivered price (USD) for `referenceQuantity` units in this zone, per quote() */
  referenceQuantityPrice: number;
  /** This zone's minimum order, in the category's sell unit */
  minOrderQuantity: number;
  /** Delivered price (USD) for exactly `minOrderQuantity` units in this zone */
  minOrderPrice: number;
  /** referenceQuantityPrice / referenceQuantity, for "starting at $X/ton" copy */
  pricePerUnit: number;
}

export interface PriceBookProduct {
  /** Stable id: mgg-{metroSlug}-{categorySlug}-{variantSlug} */
  id: string;
  metroSlug: string;
  metroName: string;
  categorySlug: CategorySlug;
  categoryName: string;
  variantSlug: string;
  variantName: string;
  unit: SellUnit;
  referenceQuantity: number;
  title: string;
  description: string;
  link: string;
  /** Placeholder until real product photography exists per variant (see MaterialVariant.swatch) */
  imageLink: string;
  brand: string;
  condition: 'new';
  availability: 'in_stock' | 'out_of_stock';
  /** Best-effort taxonomy path — see GOOGLE_PRODUCT_CATEGORY doc comment */
  googleProductCategory: string;
  shippingNote: string;
  /** Metro-wide "starting at" reference price = the lowest zone's referenceQuantityPrice.
   * This is what the base Merchant API Product/ProductInput carries; each zone's real
   * price is layered on top via a regionalInventories override (RAAP — see B2/B3). */
  basePrice: number;
  zonePrices: PriceBookZonePrice[];
}

export interface PriceBookMetro {
  slug: string;
  name: string;
  status: Metro['status'];
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

export interface BuildPriceBookOptions {
  metros?: Metro[];
  referenceQuantity?: number;
  siteBaseUrl?: string;
  brand?: string;
  /** Injectable for deterministic tests; defaults to `new Date()` */
  now?: Date;
}

const buildTitle = (variant: MaterialVariant, category: MaterialCategory, quantity: number, metro: Metro): string =>
  `${variant.name} — ${quantity} ${formatUnit(category.unit, quantity)} delivered in ${metro.name}`;

const buildDescription = (
  variant: MaterialVariant,
  category: MaterialCategory,
  quantity: number,
  metro: Metro,
  minOrderQuantity: number,
): string => {
  const parts: string[] = [];
  parts.push(variant.shortDescription);
  if (variant.bestFor.length) {
    parts.push(`Best for: ${variant.bestFor.join(', ')}.`);
  }
  const singularUnit = category.unit === 'ton' ? 'ton' : 'yard';
  parts.push(
    `Priced as a fixed ${quantity}-${singularUnit} delivered load for ${metro.name}; ` +
      `delivery is included in the price shown. Minimum order is ${minOrderQuantity} ${formatUnit(category.unit, minOrderQuantity)} ` +
      `and varies by delivery zone; the price shown reflects this metro's lowest-cost zone — see the zone-specific ` +
      `listing for the exact delivered price to your ZIP code.`,
  );
  return parts.join(' ');
};

const buildLink = (metro: Metro, category: MaterialCategory, categorySlug: CategorySlug, variant: MaterialVariant, baseUrl: string): string =>
  `${baseUrl}/${metro.slug}/${categorySlug}-delivery?variant=${encodeURIComponent(variant.slug)}`;

/** Placeholder image path — swap for real per-variant photography once available. */
const buildImageLink = (categorySlug: CategorySlug, baseUrl: string): string =>
  `${baseUrl}/images/placeholder/${categorySlug}.jpg`;

const buildZonePrice = (
  metro: Metro,
  categorySlug: CategorySlug,
  variantSlug: string,
  zoneSlug: string,
  zoneName: string,
  minOrderQuantity: number,
  referenceQuantity: number,
): PriceBookZonePrice | null => {
  const refQuote = quote({ metro, categorySlug, variantSlug, zoneSlug, quantity: referenceQuantity });
  const minQuote = quote({ metro, categorySlug, variantSlug, zoneSlug, quantity: minOrderQuantity });
  if (!refQuote || !minQuote) return null;
  return {
    zoneSlug,
    zoneName,
    referenceQuantityPrice: refQuote.total,
    minOrderQuantity,
    minOrderPrice: minQuote.total,
    pricePerUnit: refQuote.pricePerUnit,
  };
};

/** Builds the full price book from METROS (or an injected metro list) for the Merchant sync pipeline. */
export const buildPriceBook = (options: BuildPriceBookOptions = {}): PriceBook => {
  const {
    metros = METROS,
    referenceQuantity = DEFAULT_REFERENCE_QUANTITY,
    siteBaseUrl = DEFAULT_SITE_BASE_URL,
    brand = MGG_BRAND,
    now = new Date(),
  } = options;

  const metroEntries: PriceBookMetro[] = metros.map(metro => {
    const zones: PriceBookZone[] = metro.zones.map(zone => ({
      slug: zone.slug,
      name: zone.name,
      zips: zone.zips,
      minUnits: zone.minUnits,
    }));

    const products: PriceBookProduct[] = [];
    for (const category of metro.categories) {
      for (const variant of category.variants) {
        const zonePrices: PriceBookZonePrice[] = [];
        for (const zone of metro.zones) {
          const zp = buildZonePrice(
            metro,
            category.slug,
            variant.slug,
            zone.slug,
            zone.name,
            zone.minUnits,
            referenceQuantity,
          );
          if (zp) zonePrices.push(zp);
        }
        if (zonePrices.length === 0) continue; // no valid zones for this variant/quantity — skip rather than emit a broken product

        const basePrice = Math.min(...zonePrices.map(zp => zp.referenceQuantityPrice));
        // Availability is nation/metro-status-gated: a metro whose price book isn't yet
        // confirmed by a signed partner (priceBookConfirmed === false) should not be
        // advertised as purchasable — mark out_of_stock rather than publish a placeholder
        // price as if it were real.
        const availability: PriceBookProduct['availability'] =
          metro.status === 'live' && metro.priceBookConfirmed ? 'in_stock' : 'out_of_stock';

        products.push({
          id: `mgg-${metro.slug}-${category.slug}-${variant.slug}`,
          metroSlug: metro.slug,
          metroName: metro.name,
          categorySlug: category.slug,
          categoryName: category.name,
          variantSlug: variant.slug,
          variantName: variant.name,
          unit: category.unit,
          referenceQuantity,
          title: buildTitle(variant, category, referenceQuantity, metro),
          description: buildDescription(
            variant,
            category,
            referenceQuantity,
            metro,
            Math.min(...metro.zones.map(z => z.minUnits)),
          ),
          link: buildLink(metro, category, category.slug, variant, siteBaseUrl),
          imageLink: buildImageLink(category.slug, siteBaseUrl),
          brand,
          condition: 'new',
          availability,
          googleProductCategory: GOOGLE_PRODUCT_CATEGORY[category.slug],
          shippingNote: 'Delivery included in the price shown for each zone; no separate shipping charge.',
          basePrice,
          zonePrices,
        });
      }
    }

    return {
      slug: metro.slug,
      name: metro.name,
      status: metro.status,
      priceBookConfirmed: metro.priceBookConfirmed,
      zones,
      products,
    };
  });

  return {
    generatedAt: now.toISOString(),
    siteBaseUrl,
    brand,
    referenceQuantity,
    metros: metroEntries,
  };
};
