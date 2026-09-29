/**
 * DFW margin-scenario model — P1-MARGIN-SCENARIOS, extended by P2-PRICING-FLOOR
 * (2026-09-28) with a `floor250` table modeling the owner's "$250/order" decision.
 *
 * Analysis-only script owned by this agent. Imports the REAL metro config and the REAL
 * `quote()` pricing engine (src/metro/config/dallasFortWorth.ts, src/metro/lib/pricing.ts)
 * so every number in docs/metro/research/dfw-margin-scenarios.md and
 * docs/metro/research/dfw-pricing-v3-floor.md traces back to running code, not hand math.
 * Read-only on src/** and every other doc — writes nothing except stdout
 * (piped/redirected by the caller into the doc's tables).
 *
 * Run: npx tsx scripts/metro/margin-scenarios.ts [table]
 *   table: main | qty | premium | delivery | matrix | tiered | cac | walkaway | floor250 | v3compare | all (default: all)
 *
 * Background (see docs/metro/partners/economics.md, docs/metro/research/dfw-pricing-v2.md):
 * - Through the v2 pass, dfwCatalog.ts's nodePricePerUnit = yard-class median x 0.85 (an
 *   ASSUMED wholesale discount that has not been negotiated with any partner).
 * - economics.md found that if a partner charges MGG its normal yard price (no 0.85
 *   discount), gross margin on a 10-unit order is only ~5-7%, and negative at +10% over
 *   median. The v2 analysis (tables below, still reproducible) generalized that finding
 *   across all 22 SKUs, 3 quantities, 2 zones, 4 partner-discount scenarios, 4
 *   partner-delivery-cost scenarios, and 8 MGG pricing structures (5 premiumRates + 3
 *   flat service-fee variants on top of 0.25).
 * - v3 (2026-09-28, "make at least $250/order" owner decision): the cost basis moved to
 *   yard-median x 1.00 (no assumed discount — see WHOLESALE_FACTOR in
 *   scripts/metro/catalog-from-proposal.mjs), each SKU got its own tiered premiumRate
 *   (baked into dfwCatalog.ts as `premiumRate`, matching TIERED_PREMIUM below), and
 *   `quote()` gained a `minMarginPerOrder` floor (dallasFortWorth.pricing, $250). The
 *   `floor250` table below re-runs the same 22-SKU walk using the REAL current config
 *   (tiered premium + $250 floor + 1.0x-yard-median cost basis) end to end, instead of
 *   the manual TIERED_PREMIUM overrides the earlier tables use.
 */
import { dallasFortWorth } from '../../src/metro/config/dallasFortWorth';
import { quote, planLoads } from '../../src/metro/lib/pricing';
import type { CategorySlug, Metro, MaterialCategory, MaterialVariant, DeliveryZone } from '../../src/metro/types';
import slugStats from '../../docs/metro/research/data/dfw/slug-stats.json';

// ---------------------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------------------

type SlugStat = {
  yard_median: number | null;
  broker_delivered_median: number | null;
  broker_delivered_n_sellers: number;
};
const STATS = slugStats as unknown as Record<string, SlugStat>;

const QUANTITIES = [5, 10, 20] as const;
const PARTNER_DISCOUNTS = [0.85, 0.9, 1.0, 1.1] as const; // x yard median
const DELIVERY_BENCHMARKS = [45, 100, 150] as const; // $/load flat benchmarks from dfw-pricing-v2.md
const PREMIUM_RATES = [0.25, 0.3, 0.35, 0.4, 0.5] as const;
const SERVICE_FEES = [49, 79, 99] as const; // on top of premiumRate 0.25
const TARGET_MARGIN_PCT = 20; // "walk-away" target gross margin %, per task brief
const LAUNCH_BUDGET = 5000; // $5,000 launch budget, dfw-90-day-gtm-v2.md
const CAC_SCENARIOS = [50, 100, 150] as const; // gtm doc's $50/order CAC target + 2 sensitivities

const STRIPE_PCT = 0.029;
const STRIPE_FLAT = 0.3;
const stripeFee = (price: number) => price * STRIPE_PCT + STRIPE_FLAT;

const ZONE_CHEAPEST = 'dfw-core'; // loadCost 85 — cheapest zone
const ZONE_FARTHEST = 'dfw-outer'; // loadCost 130 — farthest zone

// ---------------------------------------------------------------------------------------
// Catalog walk helper
// ---------------------------------------------------------------------------------------

interface SkuRow {
  categorySlug: CategorySlug;
  category: MaterialCategory;
  variant: MaterialVariant;
  unit: string;
}

function allSkus(metro: Metro): SkuRow[] {
  const rows: SkuRow[] = [];
  for (const category of metro.categories) {
    for (const variant of category.variants) {
      rows.push({ categorySlug: category.slug, category, variant, unit: category.unit });
    }
  }
  return rows;
}

// Must match the WHOLESALE_FACTOR default in scripts/metro/catalog-from-proposal.mjs —
// dfwCatalog.ts's nodePricePerUnit = yard median x this factor (1.00 as of the v3 "$250
// floor" pass; was 0.85 through v2).
const CURRENT_WHOLESALE_FACTOR = 1.0;

/** Yard median for a slug, falling back to nodePrice/CURRENT_WHOLESALE_FACTOR for bank-sand (slug-stats yard_median is null; see dfw-pricing-v2.md "bank-sand remains ... carried over from the v1 scrape"). */
function yardMedianFor(sku: SkuRow): { value: number; fallback: boolean } {
  const stat = STATS[sku.variant.slug];
  if (stat && stat.yard_median != null) return { value: stat.yard_median, fallback: false };
  return { value: sku.variant.nodePricePerUnit / CURRENT_WHOLESALE_FACTOR, fallback: true };
}

function brokerMedianFor(sku: SkuRow): number | null {
  const stat = STATS[sku.variant.slug];
  if (!stat || stat.broker_delivered_n_sellers === 0) return null;
  return stat.broker_delivered_median;
}

/** Partner's total delivery cost for the order under the "zone loadCost" scenario — reuses the
 * exact deliveryCost quote() computes for MGG (same loads, same zone.loadCost x truck factor,
 * same additional-load discount), per economics.md's "best available placeholder" method. */
function zoneLoadCostDelivery(metro: Metro, sku: SkuRow, zoneSlug: string, quantity: number): { deliveryCost: number; loads: number } {
  const q = quote({ metro, categorySlug: sku.categorySlug, variantSlug: sku.variant.slug, quantity, zoneSlug });
  if (!q) throw new Error(`quote() returned null for ${sku.variant.slug} qty=${quantity} zone=${zoneSlug}`);
  return { deliveryCost: q.deliveryCost, loads: q.loads.length };
}

function flatPerLoadDelivery(metro: Metro, sku: SkuRow, quantity: number, perLoad: number): number {
  const loads = planLoads(quantity, metro.trucks, sku.category);
  return loads.length * perLoad;
}

// ---------------------------------------------------------------------------------------
// Core per-SKU computation
// ---------------------------------------------------------------------------------------

interface ScenarioResult {
  sku: SkuRow;
  quantity: number;
  zoneSlug: string;
  yardMedian: number;
  yardMedianFallback: boolean;
  brokerMedian: number | null;
  brokerOrderPrice: number | null; // brokerMedian * quantity
  mggBasePrice025: number; // baseline MGG price at premiumRate 0.25, no fee
}

function baseline(metro: Metro, sku: SkuRow, quantity: number, zoneSlug: string): ScenarioResult {
  const q = quote({ metro, categorySlug: sku.categorySlug, variantSlug: sku.variant.slug, quantity, zoneSlug });
  if (!q) throw new Error(`quote() null for ${sku.variant.slug}`);
  const { value: yardMedian, fallback } = yardMedianFor(sku);
  const brokerMedian = brokerMedianFor(sku);
  return {
    sku,
    quantity,
    zoneSlug,
    yardMedian,
    yardMedianFallback: fallback,
    brokerMedian,
    brokerOrderPrice: brokerMedian != null ? brokerMedian * quantity : null,
    mggBasePrice025: q.basePrice,
  };
}

/** MGG delivered price at a given premiumRate (clones metro.pricing, real quote() call). */
function mggPriceAtPremium(metro: Metro, sku: SkuRow, quantity: number, zoneSlug: string, premiumRate: number): number {
  const cloned: Metro = { ...metro, pricing: { ...metro.pricing, premiumRate } };
  const q = quote({ metro: cloned, categorySlug: sku.categorySlug, variantSlug: sku.variant.slug, quantity, zoneSlug });
  if (!q) throw new Error('quote() null');
  return q.basePrice;
}

/** Partner's total cost for the order: yard median x discount x qty + delivery cost scenario. */
function partnerCost(
  metro: Metro,
  sku: SkuRow,
  quantity: number,
  zoneSlug: string,
  yardMedian: number,
  discount: number,
  deliveryScenario: 'zone' | 45 | 100 | 150,
): number {
  const material = yardMedian * discount * quantity;
  let delivery: number;
  if (deliveryScenario === 'zone') {
    delivery = zoneLoadCostDelivery(metro, sku, zoneSlug, quantity).deliveryCost;
  } else {
    delivery = flatPerLoadDelivery(metro, sku, quantity, deliveryScenario);
  }
  return material + delivery;
}

function margin(mggPrice: number, cost: number): { dollars: number; pct: number } {
  const fee = stripeFee(mggPrice);
  const dollars = mggPrice - cost - fee;
  const pct = mggPrice > 0 ? (dollars / mggPrice) * 100 : 0;
  return { dollars, pct };
}

const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : 'N/A');
const money = (n: number) => `$${n.toFixed(2)}`;
const pct = (n: number) => `${n.toFixed(1)}%`;

// ---------------------------------------------------------------------------------------
// Table: MAIN — 10-unit, all 22 SKUs, cheapest + farthest zone, 4 partner-discount cols,
// MGG price at baseline premiumRate 0.25, zone-loadCost delivery scenario.
// ---------------------------------------------------------------------------------------

function tableMain(metro: Metro) {
  console.log('\n## TABLE MAIN — 10-unit orders, zone-loadCost delivery, MGG @ premiumRate 0.25\n');
  for (const zoneSlug of [ZONE_CHEAPEST, ZONE_FARTHEST]) {
    console.log(`\n### Zone: ${zoneSlug}\n`);
    console.log(
      '| SKU | Yard median | Broker median (order) | MGG price | ' +
        PARTNER_DISCOUNTS.map(d => `Cost@${d}x`).join(' | ') +
        ' | ' +
        PARTNER_DISCOUNTS.map(d => `Margin%@${d}x`).join(' | ') +
        ' | Below broker? |',
    );
    console.log('|---|---:|---:|---:|' + PARTNER_DISCOUNTS.map(() => '---:').join('|') + '|' + PARTNER_DISCOUNTS.map(() => '---:').join('|') + '|---|');
    for (const sku of allSkus(metro)) {
      const b = baseline(metro, sku, 10, zoneSlug);
      const costs = PARTNER_DISCOUNTS.map(d => partnerCost(metro, sku, 10, zoneSlug, b.yardMedian, d, 'zone'));
      const margins = costs.map(c => margin(b.mggBasePrice025, c));
      const belowBroker = b.brokerOrderPrice == null ? 'no broker data' : b.mggBasePrice025 < b.brokerOrderPrice ? 'YES' : 'NO';
      console.log(
        `| ${sku.variant.slug}${b.yardMedianFallback ? ' (yard median fallback)' : ''} | ${money(b.yardMedian)} | ${
          b.brokerOrderPrice != null ? money(b.brokerOrderPrice) : '—'
        } | ${money(b.mggBasePrice025)} | ${costs.map(money).join(' | ')} | ${margins.map(m => pct(m.pct)).join(' | ')} | ${belowBroker} |`,
      );
    }
  }
}

// ---------------------------------------------------------------------------------------
// Table: QTY sensitivity — 5 & 20 units, cheapest zone only, discount = 1.0x (realistic
// per economics.md), zone-loadCost delivery.
// ---------------------------------------------------------------------------------------

function tableQty(metro: Metro) {
  console.log('\n## TABLE QTY — 5 & 20-unit sensitivity, dfw-core zone, partner @ 1.0x yard median, zone-loadCost delivery, MGG @ 0.25\n');
  for (const quantity of [5, 20] as const) {
    console.log(`\n### Quantity: ${quantity}\n`);
    console.log('| SKU | Yard median | Broker median (order) | MGG price | Partner cost @1.0x | Margin $ | Margin % | Below broker? |');
    console.log('|---|---:|---:|---:|---:|---:|---:|---|');
    for (const sku of allSkus(metro)) {
      const b = baseline(metro, sku, quantity, ZONE_CHEAPEST);
      const cost = partnerCost(metro, sku, quantity, ZONE_CHEAPEST, b.yardMedian, 1.0, 'zone');
      const m = margin(b.mggBasePrice025, cost);
      const belowBroker = b.brokerOrderPrice == null ? 'no broker data' : b.mggBasePrice025 < b.brokerOrderPrice ? 'YES' : 'NO';
      console.log(
        `| ${sku.variant.slug} | ${money(b.yardMedian)} | ${b.brokerOrderPrice != null ? money(b.brokerOrderPrice) : '—'} | ${money(
          b.mggBasePrice025,
        )} | ${money(cost)} | ${money(m.dollars)} | ${pct(m.pct)} | ${belowBroker} |`,
      );
    }
  }
}

// ---------------------------------------------------------------------------------------
// Table: PREMIUM — aggregate across 22 SKUs @ 10 units, dfw-core, partner @ 1.0x yard
// median + zone-loadCost delivery (the "realistic" baseline per economics.md), for every
// premiumRate and every flat-fee variant.
// ---------------------------------------------------------------------------------------

interface AggRow {
  label: string;
  belowBrokerCount: number;
  comparableCount: number;
  medianMarginPct: number;
  avgMarginDollars: number;
}

function median(nums: number[]): number {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function aggregateForPricing(metro: Metro, label: string, mggPriceFn: (sku: SkuRow, b: ScenarioResult) => number): AggRow {
  const skus = allSkus(metro);
  let belowBrokerCount = 0;
  let comparableCount = 0;
  const marginPcts: number[] = [];
  const marginDollars: number[] = [];
  for (const sku of skus) {
    const b = baseline(metro, sku, 10, ZONE_CHEAPEST);
    const mggPrice = mggPriceFn(sku, b);
    const cost = partnerCost(metro, sku, 10, ZONE_CHEAPEST, b.yardMedian, 1.0, 'zone');
    const m = margin(mggPrice, cost);
    marginPcts.push(m.pct);
    marginDollars.push(m.dollars);
    if (b.brokerOrderPrice != null) {
      comparableCount++;
      if (mggPrice < b.brokerOrderPrice) belowBrokerCount++;
    }
  }
  return {
    label,
    belowBrokerCount,
    comparableCount,
    medianMarginPct: median(marginPcts),
    avgMarginDollars: marginDollars.reduce((a, b) => a + b, 0) / marginDollars.length,
  };
}

function tablePremium(metro: Metro) {
  console.log(
    '\n## TABLE PREMIUM — MGG pricing-structure sensitivity, 22 SKUs @ 10 units, dfw-core, partner @ 1.0x yard median + zone-loadCost delivery\n',
  );
  console.log('| Structure | # SKUs below broker / comparable | Median margin % | Avg margin $/order |');
  console.log('|---|---|---:|---:|');
  const rows: AggRow[] = [];
  for (const rate of PREMIUM_RATES) {
    rows.push(
      aggregateForPricing(metro, `premiumRate ${rate}`, (sku, b) => mggPriceAtPremium(metro, sku, 10, ZONE_CHEAPEST, rate)),
    );
  }
  for (const fee of SERVICE_FEES) {
    rows.push(
      aggregateForPricing(metro, `0.25 + $${fee} fee`, (sku, b) => mggPriceAtPremium(metro, sku, 10, ZONE_CHEAPEST, 0.25) + fee),
    );
  }
  for (const r of rows) {
    console.log(`| ${r.label} | ${r.belowBrokerCount} / ${r.comparableCount} | ${pct(r.medianMarginPct)} | ${money(r.avgMarginDollars)} |`);
  }
}

// ---------------------------------------------------------------------------------------
// Table: DELIVERY — partner delivery-cost benchmark sensitivity, 22 SKUs @ 10 units,
// dfw-core, partner material @ 1.0x yard median, MGG @ premiumRate 0.25.
// ---------------------------------------------------------------------------------------

function tableDelivery(metro: Metro) {
  console.log('\n## TABLE DELIVERY — partner delivery-cost benchmark sensitivity, 22 SKUs @ 10 units, dfw-core, partner material @ 1.0x, MGG @ 0.25\n');
  console.log('| Delivery scenario | # SKUs below broker / comparable | Median margin % | Avg margin $/order |');
  console.log('|---|---|---:|---:|');
  const scenarios: Array<'zone' | 45 | 100 | 150> = ['zone', ...DELIVERY_BENCHMARKS];
  for (const scenario of scenarios) {
    const skus = allSkus(metro);
    let belowBrokerCount = 0;
    let comparableCount = 0;
    const marginPcts: number[] = [];
    const marginDollars: number[] = [];
    for (const sku of skus) {
      const b = baseline(metro, sku, 10, ZONE_CHEAPEST);
      const cost = partnerCost(metro, sku, 10, ZONE_CHEAPEST, b.yardMedian, 1.0, scenario);
      const m = margin(b.mggBasePrice025, cost);
      marginPcts.push(m.pct);
      marginDollars.push(m.dollars);
      if (b.brokerOrderPrice != null) {
        comparableCount++;
        if (b.mggBasePrice025 < b.brokerOrderPrice) belowBrokerCount++;
      }
    }
    const label = scenario === 'zone' ? 'zone loadCost (MGG-equivalent)' : `$${scenario}/load flat`;
    console.log(
      `| ${label} | ${belowBrokerCount} / ${comparableCount} | ${pct(median(marginPcts))} | ${money(
        marginDollars.reduce((a, b) => a + b, 0) / marginDollars.length,
      )} |`,
    );
  }
}

// ---------------------------------------------------------------------------------------
// Table: HEADROOM — max premiumRate per SKU before MGG price crosses the broker-delivered
// median (ignoring roundTo), to see which SKUs/categories have room for a higher premium
// and which are already thin. maxPremium = brokerOrderPrice / (materialCost+deliveryCost) - 1.
// ---------------------------------------------------------------------------------------

function tableHeadroom(metro: Metro) {
  console.log('\n## TABLE HEADROOM — max premiumRate before crossing broker-delivered median, 10-unit, dfw-core\n');
  console.log('| Category | SKU | Cost basis (material+delivery) | Broker order price | Max premiumRate before crossing broker |');
  console.log('|---|---|---:|---:|---:|');
  for (const sku of allSkus(metro)) {
    const q = quote({ metro, categorySlug: sku.categorySlug, variantSlug: sku.variant.slug, quantity: 10, zoneSlug: ZONE_CHEAPEST });
    if (!q) continue;
    const costBasis = q.materialCost + q.deliveryCost;
    const brokerMedian = brokerMedianFor(sku);
    const brokerOrderPrice = brokerMedian != null ? brokerMedian * 10 : null;
    const maxPremium = brokerOrderPrice != null ? brokerOrderPrice / costBasis - 1 : null;
    console.log(
      `| ${sku.categorySlug} | ${sku.variant.slug} | ${money(costBasis)} | ${
        brokerOrderPrice != null ? money(brokerOrderPrice) : '—'
      } | ${maxPremium != null ? pct(maxPremium * 100) : 'no broker data'} |`,
    );
  }
}

// ---------------------------------------------------------------------------------------
// Table: MATRIX — premiumRate x partner-discount cross, to find where >=20% margin and
// "most SKUs below broker" can coexist (informs the recommendation).
// ---------------------------------------------------------------------------------------

function tableMatrix(metro: Metro) {
  console.log('\n## TABLE MATRIX — premiumRate x partner-discount cross, 22 SKUs @ 10 units, dfw-core, zone-loadCost delivery\n');
  console.log('| premiumRate | Partner discount | # below broker / comparable | Median margin % | Avg margin $/order |');
  console.log('|---:|---:|---|---:|---:|');
  for (const rate of PREMIUM_RATES) {
    for (const discount of PARTNER_DISCOUNTS) {
      const skus = allSkus(metro);
      let belowBrokerCount = 0;
      let comparableCount = 0;
      const marginPcts: number[] = [];
      const marginDollars: number[] = [];
      for (const sku of skus) {
        const b = baseline(metro, sku, 10, ZONE_CHEAPEST);
        const mggPrice = mggPriceAtPremium(metro, sku, 10, ZONE_CHEAPEST, rate);
        const cost = partnerCost(metro, sku, 10, ZONE_CHEAPEST, b.yardMedian, discount, 'zone');
        const m = margin(mggPrice, cost);
        marginPcts.push(m.pct);
        marginDollars.push(m.dollars);
        if (b.brokerOrderPrice != null) {
          comparableCount++;
          if (mggPrice < b.brokerOrderPrice) belowBrokerCount++;
        }
      }
      console.log(
        `| ${rate} | ${discount}x | ${belowBrokerCount} / ${comparableCount} | ${pct(median(marginPcts))} | ${money(
          marginDollars.reduce((a, b) => a + b, 0) / marginDollars.length,
        )} |`,
      );
    }
  }
}

// ---------------------------------------------------------------------------------------
// Table: CAC — contribution margin & break-even orders on the $5,000 launch budget.
// Uses the recommended structure's avg margin $/order (computed once tablePremium's
// numbers are known — see RECOMMENDED_STRUCTURE below) at partner cost = 1.0x yard median.
// ---------------------------------------------------------------------------------------

const RECOMMENDED_PREMIUM = 0.35; // see doc's recommendation section

// Tiered per-SKU premiumRate recommendation, derived from TABLE HEADROOM: SKUs with
// <35% headroom before crossing the broker-delivered median stay near the current 0.25;
// 35-70% headroom SKUs move to 0.35; >70% headroom SKUs move to 0.45. brown-dyed (no
// broker data) is conservatively placed in the 0.35 tier. See the doc's recommendation
// section for the headroom numbers behind this split.
const TIERED_PREMIUM: Record<string, number> = {
  // Tier 1 (<35% headroom) — 0.25
  '57-limestone': 0.25,
  'decomposed-granite': 0.25,
  'concrete-sand': 0.25,
  'bank-sand': 0.25,
  'play-sand': 0.25,
  cedar: 0.25,
  compost: 0.25,
  // Tier 2 (35-70% headroom, + brown-dyed conservatively) — 0.35
  'pea-gravel': 0.35,
  'mason-sand': 0.35,
  'washed-sand': 0.35,
  'pine-bark': 0.35,
  'sandy-loam': 0.35,
  'garden-mix': 0.35,
  'select-fill': 0.35,
  'flex-base': 0.35,
  'rip-rap': 0.35,
  'brown-dyed': 0.35,
  // Tier 3 (>70% headroom) — 0.45
  'river-rock': 0.45,
  'native-hardwood': 0.45,
  'black-dyed': 0.45,
  'dyed-red': 0.45,
  'playground-mulch': 0.45,
};

function tableTiered(metro: Metro) {
  console.log('\n## TABLE TIERED — recommended per-SKU premiumRate, 10-unit, dfw-core, partner @ 1.0x yard median + zone-loadCost delivery\n');
  console.log('| SKU | Tier premiumRate | MGG price | Partner cost @1.0x | Margin $ | Margin % | Below broker? |');
  console.log('|---|---:|---:|---:|---:|---:|---|');
  let belowBrokerCount = 0;
  let comparableCount = 0;
  const marginPcts: number[] = [];
  const marginDollars: number[] = [];
  for (const sku of allSkus(metro)) {
    const rate = TIERED_PREMIUM[sku.variant.slug];
    const b = baseline(metro, sku, 10, ZONE_CHEAPEST);
    const mggPrice = mggPriceAtPremium(metro, sku, 10, ZONE_CHEAPEST, rate);
    const cost = partnerCost(metro, sku, 10, ZONE_CHEAPEST, b.yardMedian, 1.0, 'zone');
    const m = margin(mggPrice, cost);
    marginPcts.push(m.pct);
    marginDollars.push(m.dollars);
    const belowBroker = b.brokerOrderPrice == null ? 'no broker data' : mggPrice < b.brokerOrderPrice ? 'YES' : 'NO';
    if (b.brokerOrderPrice != null) {
      comparableCount++;
      if (mggPrice < b.brokerOrderPrice) belowBrokerCount++;
    }
    console.log(`| ${sku.variant.slug} | ${rate} | ${money(mggPrice)} | ${money(cost)} | ${money(m.dollars)} | ${pct(m.pct)} | ${belowBroker} |`);
  }
  console.log(
    `\n**Aggregate: ${belowBrokerCount}/${comparableCount} below broker, median margin ${pct(median(marginPcts))}, avg margin ${money(
      marginDollars.reduce((a, b) => a + b, 0) / marginDollars.length,
    )}/order.**\n`,
  );
}

function tableCac(metro: Metro) {
  console.log(`\n## TABLE CAC — break-even orders on $${LAUNCH_BUDGET} launch budget, recommended TIERED structure, partner @ 1.0x yard median, zone-loadCost delivery, dfw-core, 10-unit orders\n`);
  const agg = aggregateForPricing(metro, 'tiered', sku => mggPriceAtPremium(metro, sku, 10, ZONE_CHEAPEST, TIERED_PREMIUM[sku.variant.slug]));
  console.log(`Avg gross margin $/order across 22 SKUs: ${money(agg.avgMarginDollars)}\n`);
  console.log('| CAC/order | Contribution $/order (margin - CAC) | Orders to break even on $5,000 |');
  console.log('|---:|---:|---:|');
  for (const cac of CAC_SCENARIOS) {
    const contribution = agg.avgMarginDollars - cac;
    const breakEven = contribution > 0 ? Math.ceil(LAUNCH_BUDGET / contribution) : Infinity;
    console.log(`| $${cac} | ${money(contribution)} | ${breakEven === Infinity ? 'never (CAC exceeds margin)' : breakEven} |`);
  }
}

// ---------------------------------------------------------------------------------------
// Table: WALK-AWAY — max partner material price/unit (at 1.0x delivery placeholder) that
// still yields TARGET_MARGIN_PCT gross margin, under the recommended structure, per SKU,
// dfw-core @ 10 units. This is the number to drop into the partner price sheet.
// ---------------------------------------------------------------------------------------

function walkAwayPartnerPricePerUnit(metro: Metro, sku: SkuRow, quantity: number, zoneSlug: string, mggPrice: number, targetPct: number): number {
  const fee = stripeFee(mggPrice);
  // margin$ = mggPrice - (materialCost + deliveryCost) - fee ; margin% = margin$/mggPrice
  // => materialCost = mggPrice - fee - deliveryCost - mggPrice*(targetPct/100)
  const { deliveryCost } = zoneLoadCostDelivery(metro, sku, zoneSlug, quantity);
  const maxTotalCost = mggPrice - fee - mggPrice * (targetPct / 100);
  const maxMaterialCost = maxTotalCost - deliveryCost;
  return maxMaterialCost / quantity;
}

function tableWalkAway(metro: Metro) {
  console.log(
    `\n## TABLE WALK-AWAY — max partner material $/unit for >=${TARGET_MARGIN_PCT}% gross margin, recommended TIERED structure, dfw-core, 10-unit order\n`,
  );
  console.log(`| SKU | Tier premiumRate | Yard median $/unit | MGG price (10-unit) | Walk-away partner $/unit | Walk-away as % of yard median | Current node price $/unit (yard median x ${CURRENT_WHOLESALE_FACTOR}) |`);
  console.log('|---|---:|---:|---:|---:|---:|---:|');
  for (const sku of allSkus(metro)) {
    const rate = TIERED_PREMIUM[sku.variant.slug];
    const b = baseline(metro, sku, 10, ZONE_CHEAPEST);
    const mggPrice = mggPriceAtPremium(metro, sku, 10, ZONE_CHEAPEST, rate);
    const walkAway = walkAwayPartnerPricePerUnit(metro, sku, 10, ZONE_CHEAPEST, mggPrice, TARGET_MARGIN_PCT);
    const asPctOfYard = (walkAway / b.yardMedian) * 100;
    console.log(
      `| ${sku.variant.slug} | ${rate} | ${money(b.yardMedian)} | ${money(mggPrice)} | ${money(walkAway)} | ${pct(asPctOfYard)} | ${money(
        sku.variant.nodePricePerUnit,
      )} |`,
    );
  }
}

// ---------------------------------------------------------------------------------------
// Table: FLOOR250 — v3 "make at least $250/order" owner decision (2026-09-28). Unlike
// tableTiered (which manually applies TIERED_PREMIUM on top of the v2 metro config),
// this table runs the REAL current dallasFortWorth config end to end: each variant's own
// baked-in premiumRate (src/metro/config/data/dfwCatalog.ts) plus quote()'s
// minMarginPerOrder floor (dallasFortWorth.pricing, $250) and the 1.0x-yard-median cost
// basis, with zero cloning/overrides. Partner cost here = the SAME cost basis quote()
// itself uses (materialCost + deliveryCost, i.e. "partner charges MGG exactly its node
// cost", the best-case/no-markup partner scenario) — real partner economics depend on
// the discount/markup they actually quote, modeled separately in Table 7's matrix.
// ---------------------------------------------------------------------------------------

function tableFloor250(metro: Metro) {
  console.log(
    '\n## TABLE FLOOR250 — v3 $250/order floor, REAL current config (tiered premiumRate + minMarginPerOrder), 10-unit orders\n',
  );
  for (const zoneSlug of [ZONE_CHEAPEST, ZONE_FARTHEST]) {
    console.log(`\n### Zone: ${zoneSlug}\n`);
    console.log(
      '| SKU | Tier premiumRate | Yard median | MGG price | Gross profit (quote()) | Floor applied? | Broker median (order) | Below broker? |',
    );
    console.log('|---|---:|---:|---:|---:|---|---:|---|');
    let floorAppliedCount = 0;
    let belowBrokerCount = 0;
    let comparableCount = 0;
    const grossProfits: number[] = [];
    for (const sku of allSkus(metro)) {
      const q = quote({ metro, categorySlug: sku.categorySlug, variantSlug: sku.variant.slug, quantity: 10, zoneSlug });
      if (!q) throw new Error(`quote() null for ${sku.variant.slug}`);
      const { value: yardMedian } = yardMedianFor(sku);
      const brokerMedian = brokerMedianFor(sku);
      const brokerOrderPrice = brokerMedian != null ? brokerMedian * 10 : null;
      if (q.marginFloorApplied) floorAppliedCount++;
      grossProfits.push(q.estimatedGrossProfit ?? 0);
      if (brokerOrderPrice != null) {
        comparableCount++;
        if (q.basePrice < brokerOrderPrice) belowBrokerCount++;
      }
      console.log(
        `| ${sku.variant.slug} | ${sku.variant.premiumRate ?? metro.pricing.premiumRate} | ${money(yardMedian)} | ${money(q.basePrice)} | ${money(
          q.estimatedGrossProfit ?? 0,
        )} | ${q.marginFloorApplied ? 'YES' : 'no'} | ${brokerOrderPrice != null ? money(brokerOrderPrice) : '—'} | ${
          brokerOrderPrice == null ? 'no broker data' : q.basePrice < brokerOrderPrice ? 'YES' : 'NO'
        } |`,
      );
    }
    const minGrossProfit = Math.min(...grossProfits);
    console.log(
      `\n**${floorAppliedCount}/22 SKUs hit the $250 floor in this zone; ${belowBrokerCount}/${comparableCount} still below broker; minimum gross profit across all 22 SKUs = ${money(
        minGrossProfit,
      )} (must be >= $250).**\n`,
    );
  }
}

// ---------------------------------------------------------------------------------------
// Table: V3COMPARE — old (v2: flat premiumRate 0.25, nodePricePerUnit = yard median x
// 0.85, no floor) vs new (v3: real current config — tiered premiumRate + minMarginPerOrder
// $250 + nodePricePerUnit = yard median x 1.00) delivered price, for docs/metro/research/
// dfw-pricing-v3-floor.md's required per-SKU table (3/10/20 units, dfw-core/dfw-outer).
// The "old" metro is reconstructed here (not read from git history) by cloning the REAL
// current config and undoing exactly the two v3 changes (wholesale factor, premium
// tiering/floor) — every other field (zones, trucks, roundTo, fee rates) is untouched.
// ---------------------------------------------------------------------------------------

function buildOldMetro(metro: Metro): Metro {
  const OLD_WHOLESALE_FACTOR = 0.85; // v2 value, see docs/metro/research/dfw-pricing-v2.md
  const OLD_PREMIUM_RATE = 0.25; // flat, pre-tiering
  return {
    ...metro,
    categories: metro.categories.map(category => ({
      ...category,
      variants: category.variants.map(variant => ({
        ...variant,
        // current nodePricePerUnit === yard median x 1.00 (v3), so dividing by 1.00 and
        // re-multiplying by 0.85 recovers the exact v2 number without re-deriving it from
        // slug-stats.json (keeps this in lockstep with whatever CURRENT_WHOLESALE_FACTOR is).
        nodePricePerUnit: round2((variant.nodePricePerUnit / CURRENT_WHOLESALE_FACTOR) * OLD_WHOLESALE_FACTOR),
        premiumRate: undefined, // v2 had no per-variant override
      })),
    })),
    pricing: {
      ...metro.pricing,
      premiumRate: OLD_PREMIUM_RATE,
      minMarginPerOrder: undefined,
      paymentFeeRate: undefined,
      paymentFeeFixed: undefined,
    },
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function tableV3Compare(metro: Metro) {
  const oldMetro = buildOldMetro(metro);
  console.log('\n## TABLE V3COMPARE — old (v2, flat 0.25 premium, 0.85x cost basis, no floor) vs new (v3, tiered premium + $250 floor, 1.0x cost basis)\n');
  for (const zoneSlug of [ZONE_CHEAPEST, ZONE_FARTHEST]) {
    for (const quantity of [3, 10, 20] as const) {
      console.log(`\n### Zone: ${zoneSlug}, quantity: ${quantity}\n`);
      console.log('| SKU | Old price | New price | % change | Gross profit (new) | Broker median (order) | vs. broker |');
      console.log('|---|---:|---:|---:|---:|---:|---|');
      for (const sku of allSkus(metro)) {
        const oldQ = quote({ metro: oldMetro, categorySlug: sku.categorySlug, variantSlug: sku.variant.slug, quantity, zoneSlug });
        const newQ = quote({ metro, categorySlug: sku.categorySlug, variantSlug: sku.variant.slug, quantity, zoneSlug });
        if (!oldQ || !newQ) throw new Error(`quote() null for ${sku.variant.slug} qty=${quantity} zone=${zoneSlug}`);
        const pctChange = ((newQ.basePrice - oldQ.basePrice) / oldQ.basePrice) * 100;
        const brokerMedian = brokerMedianFor(sku);
        const brokerOrderPrice = brokerMedian != null ? brokerMedian * quantity : null;
        const vsBroker = brokerOrderPrice == null ? 'no broker data' : newQ.basePrice < brokerOrderPrice ? 'below' : 'above';
        console.log(
          `| ${sku.variant.slug} | ${money(oldQ.basePrice)} | ${money(newQ.basePrice)} | ${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(1)}% | ${money(
            newQ.estimatedGrossProfit ?? 0,
          )} | ${brokerOrderPrice != null ? money(brokerOrderPrice) : '—'} | ${vsBroker} |`,
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------

const which = process.argv[2] ?? 'all';
const metro = dallasFortWorth;

if (which === 'main' || which === 'all') tableMain(metro);
if (which === 'qty' || which === 'all') tableQty(metro);
if (which === 'premium' || which === 'all') tablePremium(metro);
if (which === 'delivery' || which === 'all') tableDelivery(metro);
if (which === 'headroom' || which === 'all') tableHeadroom(metro);
if (which === 'matrix' || which === 'all') tableMatrix(metro);
if (which === 'tiered' || which === 'all') tableTiered(metro);
if (which === 'cac' || which === 'all') tableCac(metro);
if (which === 'walkaway' || which === 'all') tableWalkAway(metro);
if (which === 'floor250' || which === 'all') tableFloor250(metro);
if (which === 'v3compare' || which === 'all') tableV3Compare(metro);
