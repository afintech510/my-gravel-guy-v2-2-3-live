// Dallas–Fort Worth metro configuration.
//
// ALL prices in this metro (node material costs, zone load costs, pricing rates) are
// PLACEHOLDERS pending signed partner price sheets from a DFW yard partner. The DFW
// competitor price scrape (now 26 sellers / prices-final.csv) and its class-split
// analysis, methodology and 10-unit price comparisons are written up in
// docs/metro/research/dfw-pricing-v2.md — read that before changing any number below.
// v3 (2026-09-28, owner decision: "make at least $250/order"): node prices in
// ./data/dfwCatalog.ts are now yard/producer-class medians × 1.00 (NO assumed wholesale
// discount — see WHOLESALE_FACTOR in scripts/metro/catalog-from-proposal.mjs), a more
// conservative cost basis than the v2 pass's 0.85 assumption, used until a signed
// partner price sheet lands. Each variant now carries its own tiered `premiumRate`
// (0.25 / 0.35 / 0.45 by SKU, per docs/metro/research/dfw-margin-scenarios.md Table 8)
// instead of the flat 0.25 used through v2, AND pricing.minMarginPerOrder = 250 enforces
// a $250 gross-profit floor on top of that premium — see
// docs/metro/research/dfw-pricing-v3-floor.md for the full formula, cost-basis change,
// and per-SKU price table. (v2 history: pricing.premiumRate was cut from 0.35 to 0.25 in
// the v2 pass because the wider 26-seller dataset showed several near-commodity
// materials — #57 limestone, decomposed granite, compost — priced at or above the
// broker delivered median at 0.35; see docs/metro/research/dfw-pricing-v2.md.) Zone
// loadCost values are unchanged from v2 (still inside the $45-$200 real-fee band per the
// same doc's DFW delivery-fee benchmarks).
// Do not surface priceBookConfirmed = true, and do not treat any number here as real
// pricing, until a partner price sheet lands. Variant/material data lives in a separate
// file, ./data/dfwCatalog.ts, specifically so it can be regenerated wholesale from the
// scraped data (scripts/metro/catalog-from-proposal.mjs) without touching zones/trucks/
// pricing here.
//
// Zones below are placeholder groupings by county — real zones will be drive-time
// rings measured from signed DFW partner yards once partner contracts are in place.

import type { DeliveryZone, FulfillmentNode, Metro, Truck } from '../types';
import { DFW_CORE_ZIPS, DFW_NORTH_ZIPS, DFW_OUTER_ZIPS } from './data/dfwZips';
import { dfwCatalog } from './data/dfwCatalog';

const nodes: FulfillmentNode[] = [
  {
    id: 'dfw-partner-tbd',
    name: 'DFW partner yard (TBD)',
    publicLabel: 'Local DFW yard partners',
    cutoffHour: 12,
    deliversSaturday: true,
  },
];

const zones: DeliveryZone[] = [
  {
    slug: 'dfw-core',
    name: 'DFW Core (Dallas & Tarrant)',
    loadCost: 85,
    minUnits: 3,
    zips: DFW_CORE_ZIPS,
  },
  {
    slug: 'dfw-north',
    name: 'DFW North (Collin & Denton)',
    loadCost: 100,
    minUnits: 3,
    zips: DFW_NORTH_ZIPS,
  },
  {
    slug: 'dfw-outer',
    name: 'DFW Outer (Rockwall, Kaufman, Ellis & Johnson)',
    loadCost: 130,
    minUnits: 3,
    zips: DFW_OUTER_ZIPS,
  },
];

const trucks: Truck[] = [
  { id: 'small', name: 'Small dump', capacityTons: 7, capacityYards: 8, deliveryCostFactor: 1 },
  { id: 'medium', name: 'Tandem dump', capacityTons: 15, capacityYards: 12, deliveryCostFactor: 1.3 },
  { id: 'large', name: 'End dump', capacityTons: 24, capacityYards: 20, deliveryCostFactor: 1.8 },
];

export const dallasFortWorth: Metro = {
  slug: 'dallas-fort-worth',
  name: 'Dallas–Fort Worth',
  shortName: 'DFW',
  state: 'TX',
  timeZone: 'America/Chicago',
  status: 'coming-soon',
  headline: "Gravel, mulch, sand & soil — delivered across DFW",
  subhead: "One delivered price. Pick a day. We text you when it's on the way.",
  priceBookConfirmed: false,
  nodes,
  zones,
  towns: [],
  categories: [
    {
      slug: 'gravel',
      name: 'Gravel',
      tagline: 'Crushed stone and gravel for driveways, drainage and landscaping',
      unit: 'ton',
      tonsPerYard: 1.4,
      defaultDepthIn: 3,
      variants: dfwCatalog.gravel,
    },
    {
      slug: 'sand',
      name: 'Sand',
      tagline: 'Washed and bank sand for concrete, masonry and fill',
      unit: 'ton',
      tonsPerYard: 1.35,
      defaultDepthIn: 2,
      variants: dfwCatalog.sand,
    },
    {
      slug: 'mulch',
      name: 'Mulch',
      tagline: 'Shredded and dyed mulch for garden beds and landscaping',
      unit: 'yd',
      tonsPerYard: 0.3,
      defaultDepthIn: 3,
      variants: dfwCatalog.mulch,
    },
    {
      slug: 'soil',
      name: 'Soil',
      tagline: 'Topsoil, garden mix and fill dirt for planting and grading',
      unit: 'yd',
      tonsPerYard: 1.1,
      defaultDepthIn: 4,
      variants: dfwCatalog.soil,
    },
  ],
  trucks,
  pricing: {
    // premiumRate here is the fallback for any variant without its own tiered override
    // (see ./data/dfwCatalog.ts) — every current DFW variant sets premiumRate, so this
    // value is effectively unused today, kept as a safe default for future SKUs.
    premiumRate: 0.25,
    additionalLoadDiscount: 0.25,
    saturdayFeeRate: 0.15,
    rushFeeRate: 0.15,
    roundTo: 5,
    // Owner decision (2026-09-28): "make at least $250 per order" on DFW (partner-
    // fulfilled) — see docs/metro/research/dfw-pricing-v3-floor.md. Long Island (ELM's
    // own yard, different economics, typical order ~$300) intentionally has none of
    // these three fields set, so quote() applies no floor there.
    minMarginPerOrder: 250,
    paymentFeeRate: 0.029,
    paymentFeeFixed: 0.3,
  },
  phone: '(844) 624-0400',
  phoneHref: 'tel:+18446240400',
};
