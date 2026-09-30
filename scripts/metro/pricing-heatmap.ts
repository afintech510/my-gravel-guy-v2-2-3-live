/**
 * DFW + Long Island pricing heatmap data generator — VIZ-PRICING-HEATMAP.
 *
 * Read-only visualization tooling: imports the REAL metro configs and the REAL
 * `quote()` pricing engine (src/metro/config/dallasFortWorth.ts,
 * src/metro/config/longIsland.ts, src/metro/lib/pricing.ts) and the REAL
 * broker/yard market-median stats (docs/metro/research/data/dfw/slug-stats.json).
 * Never edits pricing code or config — writes only to docs/metro/pricing/.
 *
 * The broker/yard comparison method mirrors scripts/metro/margin-scenarios.ts
 * exactly (yardMedianFor / brokerMedianFor / order-price = median * quantity) so
 * every number here matches docs/metro/research/dfw-pricing-v3-floor.md.
 *
 * Run: npx tsx scripts/metro/pricing-heatmap.ts
 * Writes: docs/metro/pricing/pricing-heatmap-data.json
 *         docs/metro/pricing/pricing-heatmap.csv
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { dallasFortWorth } from '../../src/metro/config/dallasFortWorth';
import { longIsland } from '../../src/metro/config/longIsland';
import { quote } from '../../src/metro/lib/pricing';
import type { CategorySlug, LoadPlanEntry, Metro } from '../../src/metro/types';
import slugStats from '../../docs/metro/research/data/dfw/slug-stats.json';

// ---------------------------------------------------------------------------------------
// Constants — must stay in lockstep with scripts/metro/margin-scenarios.ts
// ---------------------------------------------------------------------------------------

const QUANTITIES = [3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30] as const;
const RECOMMENDED_MIN_QUANTITIES = new Set([8, 10]);
const STRIPE_PCT = 0.029;
const STRIPE_FLAT = 0.3;
const stripeFee = (price: number) => price * STRIPE_PCT + STRIPE_FLAT;

// Must match CURRENT_WHOLESALE_FACTOR in margin-scenarios.ts / catalog-from-proposal.mjs
const CURRENT_WHOLESALE_FACTOR = 1.0;

type SlugStat = {
  yard_median: number | null;
  broker_delivered_median: number | null;
  broker_delivered_n_sellers: number;
};
const STATS = slugStats as unknown as Record<string, SlugStat>;

// ---------------------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------------------

interface CompareResult {
  available: boolean;
  reason?: string;
  orderPrice?: number; // median * quantity
  diffAbs?: number; // basePrice - orderPrice
  diffPct?: number; // diffAbs / orderPrice * 100
  label?: 'above' | 'below';
}

interface CellData {
  quantity: number;
  belowMinimum: boolean;
  total: number;
  pricePerUnit: number;
  materialCost: number;
  deliveryCost: number;
  partnerCost: number;
  grossProfit: number;
  marginPct: number;
  floorApplied: boolean;
  loadsText: string;
  loadsCount: number;
  brokerCompare: CompareResult;
  yardCompare: CompareResult;
}

interface RowData {
  categorySlug: CategorySlug;
  categoryName: string;
  variantSlug: string;
  variantName: string;
  unit: string;
  premiumRate: number;
  cellsByZone: Record<string, CellData[]>; // zoneSlug -> cells in QUANTITIES order
}

interface ZoneMeta {
  slug: string;
  name: string;
  minUnits: number;
  loadCost: number;
}

interface MetroData {
  slug: string;
  name: string;
  shortName: string;
  hasFloor: boolean;
  floorAmount: number | null;
  zones: ZoneMeta[];
  categories: { slug: CategorySlug; name: string; unit: string }[];
  rows: RowData[];
}

interface HeatmapData {
  generatedAt: string;
  quantities: number[];
  recommendedMinQuantities: number[];
  stripe: { pct: number; flat: number };
  divergingClampPct: number;
  metros: MetroData[];
}

// ---------------------------------------------------------------------------------------
// Broker / yard comparison — mirrors margin-scenarios.ts's yardMedianFor/brokerMedianFor
// ---------------------------------------------------------------------------------------

/** Yard (pickup, undelivered) median $/unit, with the same bank-sand fallback margin-scenarios.ts uses. */
function yardMedianFor(slug: string, nodePricePerUnit: number): { value: number; fallback: boolean } {
  const stat = STATS[slug];
  if (stat && stat.yard_median != null) return { value: stat.yard_median, fallback: false };
  return { value: nodePricePerUnit / CURRENT_WHOLESALE_FACTOR, fallback: true };
}

function brokerMedianFor(slug: string): number | null {
  const stat = STATS[slug];
  if (!stat || stat.broker_delivered_n_sellers === 0) return null;
  return stat.broker_delivered_median;
}

function compareVsMedian(basePrice: number, medianPerUnit: number | null, quantity: number, noDataReason: string): CompareResult {
  if (medianPerUnit == null) return { available: false, reason: noDataReason };
  const orderPrice = medianPerUnit * quantity;
  const diffAbs = basePrice - orderPrice;
  const diffPct = orderPrice > 0 ? (diffAbs / orderPrice) * 100 : 0;
  return { available: true, orderPrice, diffAbs, diffPct, label: diffAbs > 0 ? 'above' : 'below' };
}

// ---------------------------------------------------------------------------------------
// Truck plan text
// ---------------------------------------------------------------------------------------

function loadsText(loads: LoadPlanEntry[], unit: string): string {
  if (loads.length === 0) return '—';
  const parts = loads.map(l => `${l.quantity}${unit} on ${l.truck.name.toLowerCase()}`);
  return `${loads.length} load${loads.length > 1 ? 's' : ''}: ${parts.join(' + ')}`;
}

// ---------------------------------------------------------------------------------------
// Per-metro walk
// ---------------------------------------------------------------------------------------

function buildMetroData(metro: Metro, isDfw: boolean): MetroData {
  const hasFloor = metro.pricing.minMarginPerOrder != null;
  const zones: ZoneMeta[] = metro.zones.map(z => ({ slug: z.slug, name: z.name, minUnits: z.minUnits, loadCost: z.loadCost }));
  const categories = metro.categories.map(c => ({ slug: c.slug, name: c.name, unit: c.unit }));

  const rows: RowData[] = [];
  for (const category of metro.categories) {
    for (const variant of category.variants) {
      const premiumRate = variant.premiumRate ?? metro.pricing.premiumRate;
      const cellsByZone: Record<string, CellData[]> = {};
      for (const zone of metro.zones) {
        const cells: CellData[] = [];
        for (const quantity of QUANTITIES) {
          const q = quote({ metro, categorySlug: category.slug, variantSlug: variant.slug, quantity, zoneSlug: zone.slug });
          if (!q) throw new Error(`quote() null for ${metro.slug}/${zone.slug}/${variant.slug}@${quantity}`);

          const partnerCost = q.materialCost + q.deliveryCost;
          const fee = stripeFee(q.basePrice);
          // Recompute gross profit uniformly for BOTH metros (quote() only reports
          // estimatedGrossProfit when the metro configures a margin floor — DFW only —
          // so Long Island needs the same formula applied here for parity).
          const grossProfit = q.basePrice - partnerCost - fee;
          const marginPct = q.basePrice > 0 ? (grossProfit / q.basePrice) * 100 : 0;
          const floorApplied = q.marginFloorApplied ?? false;

          let brokerCompare: CompareResult;
          let yardCompare: CompareResult;
          if (isDfw) {
            const brokerMedian = brokerMedianFor(variant.slug);
            brokerCompare = compareVsMedian(q.basePrice, brokerMedian, quantity, 'no broker data');
            const { value: yardMedian } = yardMedianFor(variant.slug, variant.nodePricePerUnit);
            yardCompare = compareVsMedian(q.basePrice, yardMedian, quantity, 'no yard data');
          } else {
            brokerCompare = { available: false, reason: 'no broker data (LI market not scraped)' };
            yardCompare = { available: false, reason: 'n/a — priced directly from partner yard' };
          }

          cells.push({
            quantity,
            belowMinimum: q.belowMinimum,
            total: q.basePrice,
            pricePerUnit: q.pricePerUnit,
            materialCost: q.materialCost,
            deliveryCost: q.deliveryCost,
            partnerCost,
            grossProfit,
            marginPct,
            floorApplied,
            loadsText: loadsText(q.loads, category.unit),
            loadsCount: q.loads.length,
            brokerCompare,
            yardCompare,
          });
        }
        cellsByZone[zone.slug] = cells;
      }
      rows.push({
        categorySlug: category.slug,
        categoryName: category.name,
        variantSlug: variant.slug,
        variantName: variant.name,
        unit: category.unit,
        premiumRate,
        cellsByZone,
      });
    }
  }

  return {
    slug: metro.slug,
    name: metro.name,
    shortName: metro.shortName,
    hasFloor,
    floorAmount: metro.pricing.minMarginPerOrder ?? null,
    zones,
    categories,
    rows,
  };
}

// ---------------------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------------------

function csvEscape(v: string | number): string {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(data: HeatmapData): string {
  const header = [
    'metro', 'zone', 'category', 'variant', 'unit', 'quantity', 'belowMinimum',
    'total', 'pricePerUnit', 'materialCost', 'deliveryCost', 'partnerCost',
    'grossProfit', 'marginPct', 'floorApplied', 'loadsText',
    'brokerAvailable', 'brokerOrderPrice', 'brokerDiffAbs', 'brokerDiffPct', 'brokerLabel',
    'yardAvailable', 'yardOrderPrice', 'yardDiffAbs', 'yardDiffPct', 'yardLabel',
  ];
  const lines = [header.join(',')];
  for (const metro of data.metros) {
    for (const row of metro.rows) {
      for (const zone of metro.zones) {
        const cells = row.cellsByZone[zone.slug];
        for (const cell of cells) {
          lines.push([
            metro.shortName, zone.name, row.categoryName, row.variantName, row.unit, cell.quantity, cell.belowMinimum,
            cell.total.toFixed(2), cell.pricePerUnit.toFixed(2), cell.materialCost.toFixed(2), cell.deliveryCost.toFixed(2),
            cell.partnerCost.toFixed(2), cell.grossProfit.toFixed(2), cell.marginPct.toFixed(2), cell.floorApplied,
            cell.loadsText,
            cell.brokerCompare.available, cell.brokerCompare.orderPrice?.toFixed(2) ?? '', cell.brokerCompare.diffAbs?.toFixed(2) ?? '',
            cell.brokerCompare.diffPct?.toFixed(2) ?? '', cell.brokerCompare.label ?? cell.brokerCompare.reason ?? '',
            cell.yardCompare.available, cell.yardCompare.orderPrice?.toFixed(2) ?? '', cell.yardCompare.diffAbs?.toFixed(2) ?? '',
            cell.yardCompare.diffPct?.toFixed(2) ?? '', cell.yardCompare.label ?? cell.yardCompare.reason ?? '',
          ].map(csvEscape).join(','));
        }
      }
    }
  }
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------------------

const data: HeatmapData = {
  generatedAt: new Date().toISOString(),
  quantities: [...QUANTITIES],
  recommendedMinQuantities: [...RECOMMENDED_MIN_QUANTITIES],
  stripe: { pct: STRIPE_PCT, flat: STRIPE_FLAT },
  divergingClampPct: 60,
  metros: [buildMetroData(dallasFortWorth, true), buildMetroData(longIsland, false)],
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '../../docs/metro/pricing');
mkdirSync(outDir, { recursive: true });

const jsonPath = join(outDir, 'pricing-heatmap-data.json');
writeFileSync(jsonPath, JSON.stringify(data, null, 2));
console.log(`Wrote ${jsonPath}`);

const csvPath = join(outDir, 'pricing-heatmap.csv');
writeFileSync(csvPath, toCsv(data));
console.log(`Wrote ${csvPath}`);

// Self-contained HTML: inline the (minified) data into the template — no external requests.
const templatePath = join(__dirname, 'pricing-heatmap.template.html');
const template = readFileSync(templatePath, 'utf-8');
const html = template.replace('__HEATMAP_DATA_JSON__', () => JSON.stringify(data));
const htmlPath = join(outDir, 'pricing-heatmap.html');
writeFileSync(htmlPath, html);
console.log(`Wrote ${htmlPath}`);

let totalCells = 0;
for (const metro of data.metros) {
  for (const row of metro.rows) {
    for (const zone of metro.zones) totalCells += row.cellsByZone[zone.slug].length;
  }
}
console.log(`${data.metros.length} metros, ${data.metros.reduce((s, m) => s + m.rows.length, 0)} SKU rows, ${totalCells} total cells.`);
