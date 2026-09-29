// Page copy for the Gravel Driveway Cost Index — the headline numbers below are
// COMPUTED from src/metro/lib/pricing.ts + costIndexData.ts at module load, never typed
// in by hand, so they stay correct if the DFW catalog or pricing.premiumRate change.
import { dallasFortWorth, longIsland } from '@/metro/config';
import { getCategory, quantityForArea } from '@/metro/lib/pricing';
import { cheapestZoneForVariant } from '@/metro/components/shared/priceHelpers';
import type { CategorySlug } from '@/metro/types';
import { costIndexMeta, costIndexRows } from './costIndexData';

export const PATH = '/gravel-driveways/cost-index';
export const LAST_UPDATED = '2026-09-28';

/** The worked example used across the direct answer + calculator section: a common
 * single-car driveway, matching the same reference dimensions used elsewhere in the
 * Gravel Driveway Hub (src/content/guides/drivewayEstimate.ts). */
export const REFERENCE_SQFT = 600; // 12 x 50 ft
export const REFERENCE_DEPTH_IN = 4;
const REFERENCE_CATEGORY: CategorySlug = 'gravel';
const REFERENCE_SLUG = '57-limestone';

function computeReferenceExample() {
  const category = getCategory(dallasFortWorth, REFERENCE_CATEGORY);
  const marketRow = costIndexRows.find(row => row.slug === REFERENCE_SLUG);
  if (!category || !marketRow?.yard || !marketRow.brokerDelivered) {
    throw new Error('[costIndex/content] Reference material data missing — check costIndexData.ts.');
  }
  const variant = category.variants.find(v => v.slug === REFERENCE_SLUG);
  if (!variant) throw new Error('[costIndex/content] Reference variant not found in DFW catalog.');

  const quantity = quantityForArea(REFERENCE_SQFT, REFERENCE_DEPTH_IN, category);
  const yardTotal = Math.round(marketRow.yard.median * quantity);
  const brokerTotal = Math.round(marketRow.brokerDelivered.median * quantity);
  const mgg = cheapestZoneForVariant(dallasFortWorth, category, variant, quantity);
  if (!mgg) throw new Error('[costIndex/content] Could not compute a live MGG quote for the reference example.');

  return {
    quantity,
    unit: category.unit,
    variantName: variant.name,
    yardTotal,
    brokerTotal,
    mggTotal: Math.round(mgg.total),
  };
}

export const referenceExample = computeReferenceExample();

export const title = 'DFW Gravel Driveway Cost Index (Q3 2026) | MyGravelGuy';
export const description =
  'Real DFW market pricing for 22 driveway materials from 27 local sellers: yard, broker-delivered and MyGravelGuy live estimated cost.';
export const h1 = 'Gravel Driveway Cost Index: Dallas–Fort Worth Market Pricing';

export const directAnswer =
  `A typical 12×50 ft, ${REFERENCE_DEPTH_IN}-inch ${referenceExample.variantName} driveway (about ` +
  `${referenceExample.quantity} tons) in the Dallas–Fort Worth market costs roughly $${referenceExample.yardTotal}–` +
  `$${referenceExample.brokerTotal} delivered, based on a September 2026 survey of ${costIndexMeta.totalSellers} DFW-area ` +
  `sellers: $${referenceExample.yardTotal} at the yard-class median, up to $${referenceExample.brokerTotal} at the ` +
  `broker-delivered median. MyGravelGuy's live estimated delivered price for the same job is $${referenceExample.mggTotal}, ` +
  `pending confirmed DFW pricing.`;

export const howWeKnow =
  `Market figures are pooled from ${costIndexMeta.totalSellers} DFW-area sellers (${costIndexMeta.totalYardSellers} physical ` +
  `yards/producers, ${costIndexMeta.totalBrokerSellers} online brokers) surveyed ${costIndexMeta.sampleStartDate} to ` +
  `${costIndexMeta.sampleEndDate}, independent of MyGravelGuy's own pricing; the MyGravelGuy column is a live estimate from ` +
  `our metro pricing engine, not yet a confirmed DFW price sheet.`;

export const methodology = {
  intro:
    "This index tracks real, publicly listed prices from DFW gravel, mulch, sand and soil sellers — not MyGravelGuy's own price book. It exists to give a citable, independently sourced answer to \"what does gravel delivery cost in Dallas–Fort Worth\" that isn't tied to any one seller's pricing, including ours.",
  sections: [
    {
      heading: 'How the data was collected',
      body:
        `${costIndexMeta.totalSellers} DFW-area sellers were surveyed ${costIndexMeta.sampleStartDate} to ` +
        `${costIndexMeta.sampleEndDate}: ${costIndexMeta.totalYardSellers} physical yards, pits or producers (a counter/material ` +
        'price, with delivery — if offered — charged as a separate line item) and ' +
        `${costIndexMeta.totalBrokerSellers} online brokers or marketplaces (a per-unit price with delivery already built in). ` +
        'A handful of pickup-only sellers and one big-box listing were recorded for context but excluded from every median below.',
    },
    {
      heading: 'Yard vs. broker-delivered — why both columns',
      body:
        'A DFW yard’s counter price and an online broker’s delivered price answer different questions and are never ' +
        'blended together here. "Yard" is the material-only price at a physical DFW yard or producer (delivery, if any, is a ' +
        'separate quoted line item). "Broker-delivered" is an online marketplace price with delivery already included — the ' +
        'closer market comparison to what a MyGravelGuy order includes. See dfw-pricing-v2.md for the full class-split ' +
        'methodology this index summarizes.',
    },
    {
      heading: 'Exclusions',
      body:
        'Pickup-only sellers, one municipal compost program, and one big-box online listing are excluded from every ' +
        'median. Rows that could not be independently confirmed against the seller’s own site were dropped rather than ' +
        'estimated (one EarthMove fill-dirt listing was excluded this pass after a spot-check contradicted the recorded ' +
        'price). Decorative/oversized stone (boulders, cobble) is kept separate from base-grade river rock rather than ' +
        'pooled into one median. Custom/quote-only orders are not represented.',
    },
    {
      heading: 'The MyGravelGuy column',
      body:
        "MyGravelGuy's delivered price is computed live, at page-load time, from the same pricing engine used at checkout — " +
        "material cost plus zone delivery cost plus MyGravelGuy's premium, at a 10-unit reference quantity. It is labeled " +
        "\"(estimated)\" because the DFW price book is not yet confirmed against a signed partner price sheet; it will " +
        'update automatically once real numbers land, without this page changing.',
    },
    {
      heading: 'Update cadence',
      body:
        'This index is refreshed quarterly (next scheduled refresh: Q4 2026) by re-running the DFW seller survey and ' +
        'regenerating this page’s data from scratch — see docs/metro/research/cost-index.md for the exact procedure. The ' +
        '"Last updated" date above always reflects the most recent regeneration.',
    },
  ],
};

export const faqs = [
  {
    question: 'How much does a gravel driveway cost in Dallas-Fort Worth?',
    answer:
      `A common 12×50 ft, 4-inch gravel driveway (${referenceExample.quantity} tons of #57 crushed limestone) costs roughly ` +
      `$${referenceExample.yardTotal}–$${referenceExample.brokerTotal} in the DFW market, based on this index’s ` +
      `${costIndexMeta.totalSellers}-seller survey. Larger driveways, decorative stone, or a longer delivery run will change the total.`,
  },
  {
    question: 'What’s the difference between the "yard" and "broker-delivered" prices in this table?',
    answer:
      'The yard price is what a physical DFW yard or producer charges at the counter for the material itself, with delivery ' +
      '(if offered) billed separately. The broker-delivered price is an online marketplace or broker’s per-unit price ' +
      'with delivery already included — a more direct comparison to a fully delivered order.',
  },
  {
    question: 'Why is MyGravelGuy’s price different from the DFW market range?',
    answer:
      "MyGravelGuy's price is a live estimate from our own pricing engine, not yet confirmed against a signed DFW partner " +
      'price sheet, so it is labeled "(estimated)." Our pricing formula is deliberately built to land at or below the ' +
      'broker-delivered market median for nearly every material in this index.',
  },
  {
    question: 'How often is this cost index updated?',
    answer:
      'Quarterly. The underlying seller survey is re-run and every number on this page is regenerated from that fresh data ' +
      '— see the "Last updated" date at the top of the page and the methodology section above for the exact procedure.',
  },
  {
    question: 'Where does this pricing data come from?',
    answer:
      `From a direct survey of ${costIndexMeta.totalSellers} DFW-area gravel, mulch, sand and soil sellers’ published ` +
      'prices (yard counters, producer price lists, and online broker/marketplace listings), independent of MyGravelGuy’s ' +
      'own price book. Full seller classification and exclusions are documented in dfw-pricing-v2.md.',
  },
  {
    question: 'Are these delivered prices or picked-up prices?',
    answer:
      'Both are shown, labeled separately: "yard" is a material-only counter price (delivery, if any, is extra), and ' +
      '"broker-delivered" already includes delivery. The MyGravelGuy column is always a fully delivered price.',
  },
  {
    question: 'Can I cite or reuse this data?',
    answer:
      'Yes — this index is published under a CC BY 4.0 license. You can reuse the figures with attribution to MyGravelGuy ' +
      'and a link back to this page; see the "How to cite this index" section below for a suggested citation and the ' +
      'downloadable CSV.',
  },
  {
    question: 'Does this index cover Long Island as well as DFW?',
    answer:
      'The main index and its Dataset are DFW-specific (27 surveyed sellers). A smaller Long Island reference table is ' +
      'included below, sourced from real yard prices observed at Eastern Landscape & Mason Supply, MyGravelGuy’s Long ' +
      'Island fulfillment partner — a single-yard reference, not a multi-seller market median like the DFW table.',
  },
];

export const citation = {
  text:
    `MyGravelGuy. (${LAST_UPDATED.slice(0, 4)}). Gravel Driveway Cost Index: Dallas–Fort Worth, TX (Q3 2026). ` +
    `Retrieved from https://mygravelguy.com${PATH}`,
  license: 'CC BY 4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
};

/** Long Island reference table — a single real yard (Eastern LM), not a multi-seller
 * survey like the DFW index, so it's kept visually and structurally separate. */
export const LONG_ISLAND_REFERENCE_SLUGS = ['pea-gravel-38', 'washed-gravel-34', 'bluestone-34', 'rca-state'];

export function longIslandReferenceRows() {
  const category = getCategory(longIsland, 'gravel');
  if (!category) return [];
  return LONG_ISLAND_REFERENCE_SLUGS.map(slug => {
    const variant = category.variants.find(v => v.slug === slug);
    if (!variant) return null;
    const best = cheapestZoneForVariant(longIsland, category, variant, 10);
    return variant && best
      ? {
          slug,
          name: variant.name,
          unit: category.unit,
          elmYardPrice: variant.nodePricePerUnit,
          mggPricePerUnit: best.pricePerUnit,
        }
      : null;
  }).filter((row): row is NonNullable<typeof row> => row !== null);
}
