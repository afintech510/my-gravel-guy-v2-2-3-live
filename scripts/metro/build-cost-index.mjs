#!/usr/bin/env node
/**
 * Build the "Gravel Driveway Cost Index" data asset from the DFW competitor price
 * research (docs/metro/research/data/dfw/) — a market price index, independent of
 * MGG's own (still-placeholder) price book. See docs/metro/research/dfw-pricing-v2.md
 * for the full methodology this script summarizes, and docs/metro/research/cost-index.md
 * for the report on how this asset is generated and refreshed.
 *
 * Inputs (read-only):
 *   - docs/metro/research/data/dfw/slug-stats.json      — per-slug yard/broker n/min/median/max
 *   - docs/metro/research/data/dfw/catalog-proposal-v2.json — per-slug name/category/unit/description
 *   - docs/metro/research/data/dfw/prices-final.csv     — used only to derive the sample date range
 *     and the total distinct-seller count for the methodology section; no seller-level
 *     row data is copied into the outputs below (aggregates only).
 *
 * Outputs (written):
 *   - src/content/guides/costIndex/costIndexData.ts — typed, committed data module
 *   - public/data/gravel-driveway-cost-index-dfw-2026-q3.csv — aggregated-stats CSV,
 *     the file the page's Dataset JSON-LD `distribution.contentUrl` points to
 *
 * Deterministic: given the same input files, this script produces byte-identical
 * output (row order follows catalog-proposal-v2.json's own order, numbers are read
 * directly from slug-stats.json with no randomness or wall-clock values baked into the
 * data itself — only the `generatedAt` header comment records when the script last ran).
 *
 * Regenerate quarterly (or whenever the underlying DFW research data changes) with:
 *   node scripts/metro/build-cost-index.mjs
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..', '..');

const SLUG_STATS_PATH = join(repoRoot, 'docs/metro/research/data/dfw/slug-stats.json');
const CATALOG_PROPOSAL_PATH = join(repoRoot, 'docs/metro/research/data/dfw/catalog-proposal-v2.json');
const PRICES_FINAL_CSV_PATH = join(repoRoot, 'docs/metro/research/data/dfw/prices-final.csv');
const DATA_MODULE_OUTPUT_PATH = join(repoRoot, 'src/content/guides/costIndex/costIndexData.ts');
const CSV_OUTPUT_PATH = join(repoRoot, 'public/data/gravel-driveway-cost-index-dfw-2026-q3.csv');
const CSV_PUBLIC_URL = '/data/gravel-driveway-cost-index-dfw-2026-q3.csv';

// Slugs with a documented caveat in dfw-pricing-v2.md worth surfacing per-row on the
// index page (thin samples, mapping notes, missing comparison data). Keep these in sync
// with the "Caveats" section of that doc — do not invent new caveats here.
const ROW_NOTES = {
  'concrete-sand':
    "Broker-delivered sample is thin (2 sellers) and sits close to the yard median — this is the one slug where MGG's proposed delivered price does not clear the broker-delivered median at the current premium rate.",
  'brown-dyed': 'No broker-delivered sellers found for this material — broker column is not comparable, yard-class only.',
  'bank-sand':
    'No DFW yard-class rows found in the current dataset; the yard figure is carried over from an earlier single-seller scrape and is the lowest-confidence number in this index.',
  'river-rock':
    'Wide yard-class spread ($49–$375/ton) reflects real size-grade variance (native river rock vs. 3-5" decorative blends), not a data error — treat the median as a blended average across grades.',
  'decomposed-granite':
    "Wide yard-class spread includes at least one colored/\"black\" DG variant pooled with natural DG — treat the median as a rougher estimate than the seller count alone suggests.",
};

const CATEGORY_ORDER = ['gravel', 'sand', 'mulch', 'soil'];

function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c === '\r') {
      // skip
    } else {
      field += c;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function deriveSampleMeta(csvPath) {
  const raw = readFileSync(csvPath, 'utf8');
  const rows = parseCSV(raw);
  const header = rows[0];
  const idx = Object.fromEntries(header.map((h, i) => [h, i]));
  const dataRows = rows.slice(1).filter(r => r.length === header.length);

  const dates = new Set();
  const sellers = new Set();
  const yardSellers = new Set();
  const brokerSellers = new Set();
  for (const r of dataRows) {
    const dateChecked = r[idx.date_checked];
    if (dateChecked) dates.add(dateChecked.slice(0, 10));
    const seller = r[idx.seller];
    if (seller) sellers.add(seller);
    if (r[idx.seller_class] === 'yard') yardSellers.add(seller);
    if (r[idx.seller_class] === 'broker') brokerSellers.add(seller);
  }
  const sortedDates = [...dates].sort();
  return {
    sampleStartDate: sortedDates[0],
    sampleEndDate: sortedDates[sortedDates.length - 1],
    totalSellers: sellers.size,
    totalYardSellers: yardSellers.size,
    totalBrokerSellers: brokerSellers.size,
  };
}

function buildRows(slugStats, catalogProposal) {
  const rows = catalogProposal.map(entry => {
    const stats = slugStats[entry.slug];
    if (!stats) {
      throw new Error(`[build-cost-index] No slug-stats.json entry for catalog slug "${entry.slug}".`);
    }
    const yard =
      stats.yard_n_sellers > 0
        ? { n: stats.yard_n_sellers, min: stats.yard_min, median: stats.yard_median, max: stats.yard_max }
        : null;
    const brokerDelivered =
      stats.broker_delivered_n_sellers > 0
        ? {
            n: stats.broker_delivered_n_sellers,
            min: stats.broker_delivered_min,
            median: stats.broker_delivered_median,
            max: stats.broker_delivered_max,
          }
        : null;

    return {
      slug: entry.slug,
      name: entry.name,
      category: entry.category,
      unit: entry.unit,
      yard,
      brokerDelivered,
      note: ROW_NOTES[entry.slug] ?? null,
    };
  });

  return rows.sort((a, b) => {
    const catDiff = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (catDiff !== 0) return catDiff;
    return catalogProposal.findIndex(e => e.slug === a.slug) - catalogProposal.findIndex(e => e.slug === b.slug);
  });
}

const jsStringLiteral = value => JSON.stringify(String(value));
const round2 = value => Math.round(Number(value) * 100) / 100;
const numOrNull = value => (value === null || value === undefined ? 'null' : round2(value));

function renderStatBlock(stat, indent) {
  if (!stat) return 'null';
  return (
    `{ n: ${stat.n}, min: ${numOrNull(stat.min)}, median: ${numOrNull(stat.median)}, max: ${numOrNull(stat.max)} }`
  );
}

function renderRow(row) {
  const lines = [
    '  {',
    `    slug: ${jsStringLiteral(row.slug)},`,
    `    name: ${jsStringLiteral(row.name)},`,
    `    category: ${jsStringLiteral(row.category)},`,
    `    unit: ${jsStringLiteral(row.unit)},`,
    `    yard: ${renderStatBlock(row.yard)},`,
    `    brokerDelivered: ${renderStatBlock(row.brokerDelivered)},`,
    `    note: ${row.note ? jsStringLiteral(row.note) : 'null'},`,
    '  },',
  ];
  return lines.join('\n');
}

function renderDataModule({ rows, sampleMeta, generatedAt }) {
  return `// Gravel Driveway Cost Index — DFW market price data.
//
// GENERATED by scripts/metro/build-cost-index.mjs from:
//   - docs/metro/research/data/dfw/slug-stats.json (per-slug yard/broker n/min/median/max)
//   - docs/metro/research/data/dfw/catalog-proposal-v2.json (name/category/unit)
//   - docs/metro/research/data/dfw/prices-final.csv (sample date range + seller counts)
// Do not hand-edit — re-run the script instead:
//   node scripts/metro/build-cost-index.mjs
//
// This is a MARKET price index sourced from a September 2026 survey of ${sampleMeta.totalSellers}
// DFW-area sellers (${sampleMeta.totalYardSellers} physical yards/producers, ${sampleMeta.totalBrokerSellers} online
// brokers/marketplaces) — independent of MyGravelGuy's own (still-placeholder) price
// book. See docs/metro/research/dfw-pricing-v2.md for full methodology, exclusions and
// caveats (thin samples, excluded rows, unit-conversion notes) and
// docs/metro/research/cost-index.md for the refresh procedure.
//
// Generated: ${generatedAt}

export interface CostIndexStat {
  /** Distinct sellers contributing to this figure */
  n: number;
  min: number;
  median: number;
  max: number;
}

export interface CostIndexRow {
  /** Matches the DFW catalog slug in src/metro/config/data/dfwCatalog.ts (same material) */
  slug: string;
  name: string;
  category: 'gravel' | 'sand' | 'mulch' | 'soil';
  /** Sell unit these prices are per-unit of */
  unit: 'ton' | 'yd';
  /** Physical DFW yard/producer counter price (material only — delivery is separate, if any) */
  yard: CostIndexStat | null;
  /** Online broker/marketplace price with delivery included in the quoted price */
  brokerDelivered: CostIndexStat | null;
  /** Per-row caveat surfaced from dfw-pricing-v2.md, if any */
  note: string | null;
}

export interface CostIndexMeta {
  /** ISO date this data module was last generated */
  generatedAt: string;
  sampleStartDate: string;
  sampleEndDate: string;
  totalSellers: number;
  totalYardSellers: number;
  totalBrokerSellers: number;
  /** Path to the build script that produced this file, for the "how to regenerate" note */
  regenerateCommand: string;
  /** Public URL of the downloadable CSV distribution of this same data */
  csvUrl: string;
}

export const costIndexMeta: CostIndexMeta = {
  generatedAt: ${jsStringLiteral(generatedAt)},
  sampleStartDate: ${jsStringLiteral(sampleMeta.sampleStartDate)},
  sampleEndDate: ${jsStringLiteral(sampleMeta.sampleEndDate)},
  totalSellers: ${sampleMeta.totalSellers},
  totalYardSellers: ${sampleMeta.totalYardSellers},
  totalBrokerSellers: ${sampleMeta.totalBrokerSellers},
  regenerateCommand: 'node scripts/metro/build-cost-index.mjs',
  csvUrl: ${jsStringLiteral(CSV_PUBLIC_URL)},
};

export const costIndexRows: CostIndexRow[] = [
${rows.map(renderRow).join('\n')}
];
`;
}

function renderCSV(rows, sampleMeta) {
  const header = [
    'slug',
    'name',
    'category',
    'unit',
    'yard_n_sellers',
    'yard_min',
    'yard_median',
    'yard_max',
    'broker_delivered_n_sellers',
    'broker_delivered_min',
    'broker_delivered_median',
    'broker_delivered_max',
    'sample_start_date',
    'sample_end_date',
    'source_note',
  ];

  const csvField = value => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const lines = [header.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.slug,
        row.name,
        row.category,
        row.unit,
        row.yard?.n ?? '',
        row.yard ? round2(row.yard.min) : '',
        row.yard ? round2(row.yard.median) : '',
        row.yard ? round2(row.yard.max) : '',
        row.brokerDelivered?.n ?? '',
        row.brokerDelivered ? round2(row.brokerDelivered.min) : '',
        row.brokerDelivered ? round2(row.brokerDelivered.median) : '',
        row.brokerDelivered ? round2(row.brokerDelivered.max) : '',
        sampleMeta.sampleStartDate,
        sampleMeta.sampleEndDate,
        row.note ?? '',
      ]
        .map(csvField)
        .join(','),
    );
  }
  return lines.join('\n') + '\n';
}

function main() {
  for (const path of [SLUG_STATS_PATH, CATALOG_PROPOSAL_PATH, PRICES_FINAL_CSV_PATH]) {
    if (!existsSync(path)) {
      throw new Error(`[build-cost-index] Missing required input: ${path}`);
    }
  }

  const slugStats = JSON.parse(readFileSync(SLUG_STATS_PATH, 'utf8'));
  const catalogProposal = JSON.parse(readFileSync(CATALOG_PROPOSAL_PATH, 'utf8'));
  const sampleMeta = deriveSampleMeta(PRICES_FINAL_CSV_PATH);
  const rows = buildRows(slugStats, catalogProposal);
  const generatedAt = new Date().toISOString().slice(0, 10);

  writeFileSync(DATA_MODULE_OUTPUT_PATH, renderDataModule({ rows, sampleMeta, generatedAt }), 'utf8');
  writeFileSync(CSV_OUTPUT_PATH, renderCSV(rows, sampleMeta), 'utf8');

  console.log(`[build-cost-index] Wrote ${rows.length} materials to ${DATA_MODULE_OUTPUT_PATH}`);
  console.log(`[build-cost-index] Wrote CSV distribution to ${CSV_OUTPUT_PATH}`);
  console.log(
    `[build-cost-index] Sample: ${sampleMeta.sampleStartDate} to ${sampleMeta.sampleEndDate}, ${sampleMeta.totalSellers} sellers`,
  );
}

main();
