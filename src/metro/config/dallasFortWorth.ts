// Dallas–Fort Worth metro configuration.
//
// ALL prices in this metro (node material costs, zone load costs, pricing rates) are
// PLACEHOLDERS pending signed partner price sheets from a DFW yard partner. The DFW
// competitor price scrape (now 26 sellers / prices-final.csv) and its class-split
// analysis, methodology and 10-unit price comparisons are written up in
// docs/metro/research/dfw-pricing-v2.md — read that before changing any number below.
// Node prices in ./data/dfwCatalog.ts are yard/producer-class medians × a 0.85
// wholesale-discount assumption (never broker medians, which run higher for
// small-minimum online-delivery resellers, and are reported separately in the doc).
// pricing.premiumRate was cut from 0.35 to 0.25 in the v2 pass: the wider 26-seller
// dataset shows a narrower yard-vs-broker-delivered spread than the original scrape for
// several near-commodity materials (#57 limestone, decomposed granite, compost) — 0.35
// would have priced those at or above the broker delivered median for a 10-unit order,
// violating the one hard requirement (MGG must land below broker). Zone loadCost values
// were re-checked against the same doc's DFW delivery-fee benchmarks and left unchanged
// (still inside the $45-$200 real-fee band). See "premiumRate & zone loadCost
// recommendation" in the doc for the full rationale and the one flagged exception
// (concrete-sand, thin broker sample, does not clear broker even at 0.25).
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
    premiumRate: 0.25,
    additionalLoadDiscount: 0.25,
    saturdayFeeRate: 0.15,
    rushFeeRate: 0.15,
    roundTo: 5,
  },
  phone: '(844) 624-0400',
  phoneHref: 'tel:+18446240400',
};
