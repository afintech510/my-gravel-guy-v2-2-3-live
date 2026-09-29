#!/usr/bin/env node
/**
 * Regenerate src/metro/config/data/dfwCatalog.ts from the DFW competitor-scrape
 * catalog proposal produced by the scraper agent.
 *
 * Input:  docs/metro/research/data/dfw/catalog-proposal-v2.json (default; pass a
 *         path argument to use a different proposal file)
 *   Array<{
 *     category: 'gravel' | 'mulch' | 'sand' | 'soil',
 *     slug: string,
 *     name: string,
 *     unit: 'ton' | 'yd',
 *     medianPricePerUnit: number,        // yard-class median, the true cost basis
 *     suggestedNodePricePerUnit: number, // = medianPricePerUnit x WHOLESALE_FACTOR (regenerated here)
 *     shortDescription: string,
 *     bestFor: string[],
 *     swatch: string,
 *     popular?: boolean,
 *   }>
 *
 * Output: src/metro/config/data/dfwCatalog.ts — same shape/export name as today
 *   (`export const dfwCatalog: Record<CategorySlug, MaterialVariant[]>`), so
 *   dallasFortWorth.ts and everything downstream keeps working untouched. Each variant
 *   also carries a `premiumRate` field (tiered per-SKU override, see PREMIUM_RATE_TIERS
 *   below) — new in the v3 ($250 floor) pass.
 *
 * `unit` in the proposal is a sanity check against each category's declared
 * unit in dallasFortWorth.ts (gravel/sand = ton, mulch/soil = yd) — MaterialVariant
 * itself has no per-variant unit field, so it is not written to the output file.
 *
 * --- Wholesale factor (v3, 2026-09-28 owner decision: "make at least $250/order") ---
 * The v2 pass applied an unverified, assumed 0.85 wholesale-discount factor to yard
 * medians to derive the node (MGG) cost basis. Until a signed DFW partner price sheet
 * exists, that factor is unverified in either direction, so the conservative choice is
 * to assume NO discount: WHOLESALE_FACTOR defaults to 1.00 (yard median as-is). The
 * factor is explicit and overridable — pass `--factor=0.85` to reproduce the old v2
 * numbers, or any other value once a real partner rate is known.
 * `suggestedNodePricePerUnit` in the input JSON is treated as a cached derived value,
 * not a source of truth — this script always recomputes it from `medianPricePerUnit`
 * (falling back to the input's `suggestedNodePricePerUnit` / 0.85 if `medianPricePerUnit`
 * is absent, e.g. for older proposal files) and rewrites it back into the input JSON file
 * so `catalog-proposal-v2.json` and `dfwCatalog.ts` stay in sync. See
 * docs/metro/research/dfw-pricing-v3-floor.md for the full writeup.
 *
 * Run: node scripts/metro/catalog-from-proposal.mjs [path/to/catalog-proposal.json] [--factor=1.00]
 * Defaults to docs/metro/research/data/dfw/catalog-proposal-v2.json (the
 * class-split, LLM-verified proposal) when no path is given.
 * Does nothing (exits 0) if the input JSON doesn't exist yet.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, isAbsolute, join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..', '..');

const DEFAULT_WHOLESALE_FACTOR = 1.0;

const rawArgs = process.argv.slice(2);
const factorArg = rawArgs.find((a) => a.startsWith('--factor='));
const WHOLESALE_FACTOR = factorArg ? Number(factorArg.slice('--factor='.length)) : DEFAULT_WHOLESALE_FACTOR;
if (!Number.isFinite(WHOLESALE_FACTOR) || WHOLESALE_FACTOR <= 0) {
  throw new Error(`[catalog-from-proposal] Invalid --factor value: ${factorArg}`);
}
const inputArg = rawArgs.find((a) => !a.startsWith('--'));
const INPUT_PATH = inputArg
  ? (isAbsolute(inputArg) ? inputArg : resolve(process.cwd(), inputArg))
  : join(repoRoot, 'docs/metro/research/data/dfw/catalog-proposal-v2.json');
const OUTPUT_PATH = join(repoRoot, 'src/metro/config/data/dfwCatalog.ts');

const CATEGORY_SLUGS = ['gravel', 'sand', 'mulch', 'soil'];
const EXPECTED_UNIT = { gravel: 'ton', sand: 'ton', mulch: 'yd', soil: 'yd' };

const round2 = (value) => Math.round(Number(value) * 100) / 100;

// Tiered per-SKU premiumRate, per docs/metro/research/dfw-margin-scenarios.md Table 8's
// exact headroom-based recommendation (<35% headroom -> 0.25, 35-70% -> 0.35 (+
// brown-dyed conservatively), >70% -> 0.45). Keep in sync with TIERED_PREMIUM in
// scripts/metro/margin-scenarios.ts (same source table, two consumers).
const PREMIUM_RATE_TIERS = {
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

const main = () => {
  if (!existsSync(INPUT_PATH)) {
    console.log(`[catalog-from-proposal] No proposal JSON at ${INPUT_PATH} — nothing to do.`);
    return;
  }

  const raw = readFileSync(INPUT_PATH, 'utf8');
  /** @type {Array<Record<string, unknown>>} */
  const proposal = JSON.parse(raw);
  if (!Array.isArray(proposal)) {
    throw new Error('[catalog-from-proposal] Expected the proposal JSON to be an array.');
  }

  /** @type {Record<string, unknown[]>} */
  const byCategory = { gravel: [], sand: [], mulch: [], soil: [] };
  let proposalChanged = false;

  for (const entry of proposal) {
    const category = entry.category;
    if (!CATEGORY_SLUGS.includes(category)) {
      throw new Error(`[catalog-from-proposal] Unknown category "${category}" on variant "${entry.slug}".`);
    }
    if (entry.unit && entry.unit !== EXPECTED_UNIT[category]) {
      console.warn(
        `[catalog-from-proposal] Warning: "${entry.slug}" (${category}) has unit "${entry.unit}", ` +
          `expected "${EXPECTED_UNIT[category]}" — check the proposal data.`,
      );
    }

    // Recompute the node price from the yard median + explicit wholesale factor, rather
    // than trusting a possibly-stale cached suggestedNodePricePerUnit. Older proposal
    // files without medianPricePerUnit fall back to backing it out of the cached 0.85x
    // value (best-effort; real proposals always carry medianPricePerUnit).
    const yardMedian = entry.medianPricePerUnit != null
      ? Number(entry.medianPricePerUnit)
      : Number(entry.suggestedNodePricePerUnit) / 0.85;
    const nodePricePerUnit = round2(yardMedian * WHOLESALE_FACTOR);
    if (entry.suggestedNodePricePerUnit !== nodePricePerUnit) {
      entry.suggestedNodePricePerUnit = nodePricePerUnit;
      proposalChanged = true;
    }

    const premiumRate = PREMIUM_RATE_TIERS[entry.slug];
    if (premiumRate == null) {
      console.warn(`[catalog-from-proposal] Warning: "${entry.slug}" has no premiumRate tier assignment — falling back to metro.pricing.premiumRate.`);
    }

    const variant = {
      slug: entry.slug,
      name: entry.name,
      shortDescription: entry.shortDescription,
      bestFor: Array.isArray(entry.bestFor) ? entry.bestFor : [],
      nodePricePerUnit,
      swatch: entry.swatch,
      popular: Boolean(entry.popular),
      premiumRate,
    };
    byCategory[category].push(variant);
  }

  // Keep catalog-proposal-v2.json's cached suggestedNodePricePerUnit in sync with the
  // factor actually used, so the JSON and dfwCatalog.ts never drift apart.
  if (proposalChanged) {
    writeFileSync(INPUT_PATH, JSON.stringify(proposal, null, 2) + '\n', 'utf8');
    console.log(`[catalog-from-proposal] Regenerated suggestedNodePricePerUnit (factor ${WHOLESALE_FACTOR}) in ${INPUT_PATH}`);
  }

  const jsStringLiteral = (value) => JSON.stringify(String(value));

  const renderVariant = (v) => {
    const lines = [
      '    {',
      `      slug: ${jsStringLiteral(v.slug)},`,
      `      name: ${jsStringLiteral(v.name)},`,
      `      shortDescription: ${jsStringLiteral(v.shortDescription)},`,
      `      bestFor: [${v.bestFor.map(jsStringLiteral).join(', ')}],`,
      `      nodePricePerUnit: ${Number(v.nodePricePerUnit)},`,
      `      swatch: ${jsStringLiteral(v.swatch)},`,
    ];
    if (v.popular) lines.push('      popular: true,');
    if (v.premiumRate != null) lines.push(`      premiumRate: ${Number(v.premiumRate)},`);
    lines.push('    },');
    return lines.join('\n');
  };

  const renderCategory = (slug) =>
    `  ${slug}: [\n${byCategory[slug].map(renderVariant).join('\n')}\n  ],`;

  const output = `// DFW material variant catalog — kept separate from dallasFortWorth.ts so it can be
// regenerated wholesale once we have (a) signed partner price sheets and (b) the
// competitor price scrape another agent is producing at docs/metro/research/data/dfw/.
//
// GENERATED by scripts/metro/catalog-from-proposal.mjs (wholesale factor ${WHOLESALE_FACTOR}) from
// docs/metro/research/data/dfw/catalog-proposal-v2.json — do not hand-edit; re-run the
// script instead. nodePricePerUnit = yard/producer-class median x ${WHOLESALE_FACTOR} (see
// docs/metro/research/dfw-pricing-v3-floor.md) — still PLACEHOLDERS pending a signed DFW
// partner price sheet — see the header comment in ../dallasFortWorth.ts. premiumRate is
// the tiered per-SKU override from docs/metro/research/dfw-margin-scenarios.md Table 8.

import type { CategorySlug, MaterialVariant } from '../../types';

export const dfwCatalog: Record<CategorySlug, MaterialVariant[]> = {
${CATEGORY_SLUGS.map(renderCategory).join('\n')}
};
`;

  writeFileSync(OUTPUT_PATH, output, 'utf8');
  const total = CATEGORY_SLUGS.reduce((sum, slug) => sum + byCategory[slug].length, 0);
  console.log(`[catalog-from-proposal] Wrote ${total} variants across ${CATEGORY_SLUGS.length} categories to ${OUTPUT_PATH}`);
};

main();
