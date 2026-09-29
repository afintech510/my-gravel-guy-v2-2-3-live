#!/usr/bin/env node
/**
 * Merge every DFW price source into one seller-classed, slug-mapped dataset.
 *
 * Sources (in order of precedence for de-duping, earliest wins):
 *  1. docs/metro/research/data/dfw/products.csv        (our own scrape)
 *  2. docs/metro/research/data/dfw/external-llm-prices.csv, verified=y only
 *  3. DFW_bulk-materials-pricing.csv (repo root)        (owner-supplied, external-LLM-agent
 *     sourced, 438 rows / 26 sellers — the "NEW INPUT" for the v2 pricing pass)
 *
 * Adds, for every row:
 *  - seller_class: yard | broker | bigbox | unknown  (see SELLER_CLASS below, evidence
 *    in docs/metro/research/dfw-pricing-v2.md "Seller classification" section)
 *  - pickup_only: true for municipal/pickup-only sellers — excluded from delivered
 *    medians (both yard and broker) but kept in the file as material-cost context.
 *  - delivered_flag: true if delivery_fee_model text indicates delivery is baked into
 *    the price; false if material-only (delivery quoted/charged separately) or unknown.
 *  - catalog_slug: best-effort mapping to the ~22-slug catalog in
 *    catalog-proposal-v2.json / dfwCatalog.ts, by normalized_material + product_name
 *    keyword match. Left blank when no confident 1:1 mapping exists (e.g. #67/#89/#3-5
 *    limestone gradations, railroad ballast, asphalt millings) — those rows stay in the
 *    file as market context but are not pooled into any catalog SKU's median (mixing
 *    different gradations/products into one median would be inventing an equivalence,
 *    not observing one).
 *  - verified: 'y' for our own scrape + already-verified external-LLM rows; 'spot-check'
 *    for the ~15 owner-CSV rows independently checked this pass (see doc scorecard);
 *    'unverified' for the remaining owner-CSV rows (not independently re-fetched, but
 *    the owner-CSV's own methodology already cites a source_url + date_checked per row).
 *
 * Output: docs/metro/research/data/dfw/prices-final.csv
 * Run: node scripts/competitors/merge-prices.mjs
 *
 * NOTE on the wholesale factor: this script's per-slug stats (slug-stats.json, below)
 * report the raw yard/broker medians with NO wholesale-discount factor applied — that
 * factor (WHOLESALE_FACTOR, default 1.00 as of the 2026-09-28 "$250/order" owner
 * decision, was 0.85 in the v2 pass) is applied downstream, as an explicit named
 * constant/CLI arg, in scripts/metro/catalog-from-proposal.mjs when it derives
 * dfwCatalog.ts's nodePricePerUnit from catalog-proposal-v2.json's medianPricePerUnit.
 * See docs/metro/research/dfw-pricing-v3-floor.md.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '..', '..');

const PRODUCTS_PATH = join(repoRoot, 'docs/metro/research/data/dfw/products.csv');
const EXTERNAL_PATH = join(repoRoot, 'docs/metro/research/data/dfw/external-llm-prices.csv');
const OWNER_CSV_PATH = join(repoRoot, 'DFW_bulk-materials-pricing.csv');
const OUTPUT_PATH = join(repoRoot, 'docs/metro/research/data/dfw/prices-final.csv');

// ---------------------------------------------------------------------------
// Seller classification (evidence: docs/metro/research/external-llm-competitor-
// synthesis.md + delivery_fee_model text in DFW_bulk-materials-pricing.csv itself).
// ---------------------------------------------------------------------------
const SELLER_CLASS = {
  // yard / producer — physical yard, pit, or producer; delivery (if any) is a
  // separate line item quoted/charged apart from the material price.
  'Mulch Mound': 'yard',
  'Outdoor Warehouse Supply': 'yard',
  'Fort Worth Grass & Stone': 'yard',
  'Soil Building Systems': 'yard', // manufacturer since 1972; real productdelivery order page, delivery quoted separately
  'Silver Creek Materials': 'yard', // vertically integrated mine/producer, most cross-confirmed partner candidate
  'Noles Enterprises': 'yard',
  'Redhawk Earthworks': 'yard',
  'Texas Pure Products': 'yard', // membership yard; explicit flat/per-mile delivery fee separate from material price
  'Dallas Sod & Fence': 'yard',
  'The Organic Recycler': 'yard', // compost producer/facility
  'Sod & Surplus Supply': 'yard',
  'Whiz-Q Stone': 'yard',
  'Amigos Compost': 'yard',
  'RC Sand & Gravel (pickup only)': 'yard', // pickup-only — see pickup_only flag
  'Trophy Trucking': 'yard', // "pit pickup price, hauling quoted separately" — pit/material price, not a broker's delivered price
  'City of Denton – Dyno Dirt': 'yard', // municipal producer — pickup_only
  'City of Mesquite Compost Facility (pickup only)': 'yard', // municipal — pickup_only

  // broker / online — small-minimum, online/marketplace, delivery baked into or
  // sold alongside a national-ish per-unit rate; not a physical DFW counter price.
  'Hello Gravel': 'broker',
  'Gravel Monkey': 'broker',
  'MyGravelBuddy': 'broker',
  'My Gravel Buddy': 'broker',
  'Fill Dirt Near Me': 'broker',
  'EarthMove': 'broker', // "dispatched not brokered" marketing, but functionally a delivery aggregator, not a yard counter; material-only price + separate $175/load delivery
  'Gravelshop': 'broker', // multi-state directory/marketplace layer (per synthesis §3), delivered "from" price to ZIP
  'Aggregate Markets': 'broker', // marketplace aggregating multiple producers' bid-tab pricing; delivery quoted separately at checkout, not a single physical yard's retail price
  'Milestone Trucks (online broker)': 'broker', // self-declared in seller name
  'Luna Trucking': 'broker', // delivery-only dispatcher (no yard pickup), delivered price but per-load size unpublished — numerically unusable (see notes), kept for context only

  // bigbox
  'Home Depot (online bulk)': 'bigbox',
};

const isPickupOnly = (seller, deliveryFeeModel) =>
  /pickup only/i.test(seller) ||
  /PICKUP ONLY/i.test(String(deliveryFeeModel)) ||
  seller === 'City of Denton – Dyno Dirt'; // pickup price tier; delivery "arranged separately" with no published rate

const isDelivered = (deliveryFeeModel) => {
  const s = String(deliveryFeeModel).toLowerCase();
  if (!s || s === 'not stated') return null; // unknown
  if (s.startsWith('not included')) return false;
  if (s.includes('pickup only')) return false;
  if (s.includes('included')) return true;
  return null;
};

// ---------------------------------------------------------------------------
// catalog_slug mapping — normalized_material + product_name/material_detail
// keyword match against the 22-slug catalog. Returns '' when no confident
// mapping exists (row is kept in the file but excluded from catalog medians).
// ---------------------------------------------------------------------------
const mapToSlug = (normalizedMaterial, productName, materialDetail) => {
  const nm = String(normalizedMaterial).trim().toLowerCase();
  const pn = String(productName).toLowerCase();
  const md = String(materialDetail).toLowerCase();
  const text = `${pn} ${md}`;

  switch (nm) {
    case 'pea gravel': return 'pea-gravel';
    case '#57 limestone': return '57-limestone';
    case 'flex base': return 'flex-base';
    case 'decomposed granite': return 'decomposed-granite';
    case 'river rock':
      // Source CSV's own "river rock" normalized_material bucket over-includes premium
      // decorative stone (cobble, black star, marble, lava rock, bull rock, etc.) at
      // 2-5x genuine river-rock pricing — keep only names that are actually river rock.
      if (/cobble|bull rock|black\s*star|marble|lava|mesa gray|salt\s*(and|&)?\s*pepper|brindle|farm creek|coal miners|egg rock|west texas black/.test(text)) return '';
      return 'river-rock';
    case 'sandy loam': return 'sandy-loam';
    case 'select fill':
      // Source CSV's "select fill" bucket also catches literal "Bank Sand" listings —
      // the catalog already has a distinct bank-sand slug, so route those there instead.
      if (/bank sand/.test(text)) return 'bank-sand';
      return 'select-fill';
    case 'compost': return 'compost';
    case 'native hardwood mulch': return 'native-hardwood';
    case 'cedar mulch': return 'cedar';
    case 'mason sand': return 'mason-sand';
    case 'garden mix': return 'garden-mix';
    case 'dyed mulch':
      if (/black/.test(text)) return 'black-dyed';
      if (/brown/.test(text)) return 'brown-dyed';
      if (/red/.test(text)) return 'dyed-red';
      return ''; // ambiguous color ("Colored Mulch") — don't guess a specific dyed SKU
    case 'washed sand':
      if (/concrete/.test(text)) return 'concrete-sand';
      if (/play/.test(text)) return 'play-sand';
      if (/mason|mortar/.test(text)) return 'mason-sand';
      return 'washed-sand';
    case 'other':
      if (/rip\s*-?\s*rap|riprap/.test(text)) return 'rip-rap';
      if (/playground/.test(text)) return 'playground-mulch';
      if (/pine bark/.test(text)) return 'pine-bark';
      // Black Star / marble / lava / cobble decorative rock deliberately NOT folded into
      // river-rock here — see the 'river rock' case above for why (different, far more
      // expensive product family). #67/#89/#3-5 limestone, expanded shale, asphalt
      // millings, ballast, screenings, etc. are also left unmapped (distinct gradations
      // / products — pooling them would invent an equivalence, not observe one).
      return '';
    default:
      return '';
  }
};

const parseCsv = (text) => {
  const lines = text.trim().split(/\r?\n/);
  const header = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row = {};
    header.forEach((key, i) => { row[key] = cells[i] ?? ''; });
    return row;
  });
};

const splitCsvLine = (line) => {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cur += c; }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      out.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
};

const csvField = (value) => {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Spot-checked owner-CSV rows this pass (WebFetch, 2026-09-28) — seller, product_name.
// See docs/metro/research/dfw-pricing-v2.md "CSV spot-check scorecard" for verdicts.
// Spot-check (2026-09-28, WebFetch) found EarthMove's live Fill Dirt price is $12.50/cy
// (~$9-11/ton at select-fill's density) vs. this CSV's $4.2/ton for the same product —
// a ~2-2.5x contradiction. EarthMove's other three select-fill-bucket rows (Utility Sand,
// Bedding Sand, Select Fill) share the same seller and the same suspiciously-low pattern,
// so all four are excluded from the select-fill broker median as unreliable pending
// re-verification, not just the one row directly checked. Kept in prices-final.csv
// (contradicted, not deleted) — see the CSV spot-check scorecard in dfw-pricing-v2.md.
const CONTRADICTED_EXCLUDE = new Set([
  'EarthMove|Utility Sand',
  'EarthMove|Bedding Sand',
  'EarthMove|Fill Dirt',
  'EarthMove|Select Fill',
]);

const SPOT_CHECKED = new Set([
  'Gravel Monkey|#57 Crushed Stone',
  'Gravel Monkey|Pea Gravel',
  'Soil Building Systems|pH Balanced Compost',
  'Outdoor Warehouse Supply|Mason Sand',
  'EarthMove|Fill Dirt',
  'Silver Creek Materials|Premium Native Tree Mulch',
  'Aggregate Markets|Flex Base',
  'Noles Enterprises|Select Fill',
  'Gravelshop|Mason Sand',
  'Texas Pure Products|Compost',
  'Dallas Sod & Fence|Topsoil (screened)',
  'Redhawk Earthworks|Common Fill',
  'RC Sand & Gravel (pickup only)|Top Soil',
  'Trophy Trucking|Select Fill',
  'Home Depot (online bulk)|10 cu. yd. Brown Landscape Bulk Mulch (BKDMBR10)',
]);

const OUT_COLUMNS = [
  'seller', 'seller_class', 'pickup_only', 'delivered_flag', 'category', 'normalized_material',
  'catalog_slug', 'product_name', 'material_detail', 'price', 'unit', 'price_per_yd',
  'price_per_ton', 'delivery_fee_model', 'delivery_minimum', 'source_url', 'date_checked',
  'density_class', 'notes', 'data_source', 'verified',
];

const main = () => {
  const rows = [];

  // -- 1 & 2: own scrape + verified external LLM rows (existing prices-merged.csv logic) --
  if (existsSync(PRODUCTS_PATH) && existsSync(EXTERNAL_PATH)) {
    const products = parseCsv(readFileSync(PRODUCTS_PATH, 'utf8'));
    const external = parseCsv(readFileSync(EXTERNAL_PATH, 'utf8'));

    const OLD_SELLER_CLASS = {
      'Mulch Mound': 'yard',
      'Outdoor Warehouse Supply': 'yard',
      'Fort Worth Grass & Stone': 'yard',
      'MyGravelBuddy': 'broker',
      'Gravel Monkey': 'broker',
      'Fill Dirt Near Me': 'broker',
    };

    for (const p of products) {
      rows.push({
        seller: p.competitor,
        seller_class: OLD_SELLER_CLASS[p.competitor] ?? 'unknown',
        pickup_only: false,
        delivered_flag: p.delivery_included === 'true' ? true : (p.delivery_included === 'false' ? false : ''),
        category: p.category,
        normalized_material: p.normalized_material,
        catalog_slug: '', // own-scrape rows already fed the v1/v2 catalog directly; not re-mapped here
        product_name: p.product_name,
        material_detail: p.size_variant,
        price: p.price,
        unit: p.unit,
        price_per_yd: p.price_per_yd,
        price_per_ton: p.price_per_ton,
        delivery_fee_model: p.delivery_included,
        delivery_minimum: '',
        source_url: p.source_url,
        date_checked: p.scraped_at,
        density_class: p.category,
        notes: '',
        data_source: 'own_scrape',
        verified: 'y',
      });
    }

    const isDuplicateOfOwnScrape = (e) => products.some((p) =>
      p.competitor === e.competitor &&
      Number(p.price) === Number(e.price) &&
      p.unit === e.unit &&
      p.source_url === e.source_url,
    );

    for (const e of external) {
      if (e.verified !== 'y') continue;
      if (isDuplicateOfOwnScrape(e)) continue;
      rows.push({
        seller: e.competitor,
        seller_class: OLD_SELLER_CLASS[e.competitor] ?? e.seller_class ?? 'unknown',
        pickup_only: false,
        delivered_flag: '',
        category: e.category,
        normalized_material: e.normalized_material,
        catalog_slug: '',
        product_name: e.product_name,
        material_detail: e.size_variant,
        price: e.price,
        unit: e.unit,
        price_per_yd: e.price_per_yd,
        price_per_ton: e.price_per_ton,
        delivery_fee_model: '',
        delivery_minimum: '',
        source_url: e.source_url,
        date_checked: e.scraped_at,
        density_class: e.category,
        notes: `llm_source=${e.llm_source}`,
        data_source: 'external_llm_verified',
        verified: 'y',
      });
    }
  } else {
    console.log('[merge-prices] products.csv / external-llm-prices.csv missing — skipping legacy sources.');
  }

  // -- 3: owner-supplied CSV (the v2 NEW INPUT) --
  if (existsSync(OWNER_CSV_PATH)) {
    const owner = parseCsv(readFileSync(OWNER_CSV_PATH, 'utf8'));
    for (const r of owner) {
      const seller = r.seller;
      const pickupOnly = isPickupOnly(seller, r.delivery_fee_model);
      const delivered = isDelivered(r.delivery_fee_model);
      const slug = mapToSlug(r.normalized_material, r.product_name, r.material_detail);
      const key = `${seller}|${r.product_name}`;
      const verified = CONTRADICTED_EXCLUDE.has(key)
        ? 'contradicted'
        : (SPOT_CHECKED.has(key) ? 'spot-check' : 'unverified');
      rows.push({
        seller,
        seller_class: SELLER_CLASS[seller] ?? 'unknown',
        pickup_only: pickupOnly,
        delivered_flag: delivered === null ? '' : delivered,
        category: r.density_class,
        normalized_material: r.normalized_material,
        catalog_slug: slug,
        product_name: r.product_name,
        material_detail: r.material_detail,
        price: r.price,
        unit: r.unit,
        price_per_yd: r.price_per_yd,
        price_per_ton: r.price_per_ton,
        delivery_fee_model: r.delivery_fee_model,
        delivery_minimum: r.delivery_minimum,
        source_url: r.source_url,
        date_checked: r.date_checked,
        density_class: r.density_class,
        notes: r.notes,
        data_source: 'owner_csv',
        verified,
      });
    }
  } else {
    console.log('[merge-prices] DFW_bulk-materials-pricing.csv not found at repo root — skipping owner CSV.');
  }

  const lines = [OUT_COLUMNS.join(',')];
  for (const r of rows) {
    lines.push(OUT_COLUMNS.map((c) => csvField(r[c])).join(','));
  }
  writeFileSync(OUTPUT_PATH, lines.join('\n') + '\n', 'utf8');
  console.log(`[merge-prices] Wrote ${rows.length} rows to ${OUTPUT_PATH}`);

  // -- per-slug stats (yard vs broker, excluding pickup-only) for the pricing doc --
  const numeric = (v) => { const n = Number(v); return Number.isFinite(n) && v !== '' ? n : null; };
  const bySlug = {};
  for (const r of rows) {
    if (!r.catalog_slug) continue;
    if (r.pickup_only) continue; // excluded from delivered medians per task rules
    if (r.verified === 'contradicted') continue; // spot-check found the price doesn't match the live site
    if (r.seller_class !== 'yard' && r.seller_class !== 'broker') continue;
    // density_class/category values differ by source: owner CSV uses 'stone'/'sand'/
    // 'soil'/'mulch' (density_class); legacy sources use 'gravel'/'sand'/'soil'/'mulch'
    // (category). Either 'stone' or 'gravel' means "sells by the ton" here.
    const sellsByTon = r.density_class === 'stone' || r.density_class === 'sand' ||
      r.category === 'gravel' || r.category === 'sand';
    const unit = sellsByTon ? r.price_per_ton : r.price_per_yd;
    const val = numeric(unit);
    if (val === null) continue;
    bySlug[r.catalog_slug] ??= { yard: [], brokerDelivered: [], brokerMaterialOnly: [] };
    if (r.seller_class === 'yard') {
      bySlug[r.catalog_slug].yard.push({ seller: r.seller, val });
    } else if (r.seller_class === 'broker') {
      // Only a *delivered* broker price is a fair comparison for "broker delivered
      // median" — material-only broker rows (EarthMove, Aggregate Markets: delivery
      // charged separately) are reported alongside for context but excluded from the
      // headline broker-delivered figure, since blending them in would understate what
      // a broker actually costs once delivery is added.
      (r.delivered_flag === true ? bySlug[r.catalog_slug].brokerDelivered : bySlug[r.catalog_slug].brokerMaterialOnly)
        .push({ seller: r.seller, val });
    }
  }
  const median = (arr) => {
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };
  const summary = {};
  for (const [slug, { yard, brokerDelivered, brokerMaterialOnly }] of Object.entries(bySlug)) {
    const yv = yard.map((x) => x.val);
    const bv = brokerDelivered.map((x) => x.val);
    const bmv = brokerMaterialOnly.map((x) => x.val);
    summary[slug] = {
      yard_n_sellers: new Set(yard.map((x) => x.seller)).size,
      yard_n_rows: yv.length,
      yard_min: yv.length ? Math.min(...yv) : null,
      yard_median: yv.length ? median(yv) : null,
      yard_max: yv.length ? Math.max(...yv) : null,
      broker_delivered_n_sellers: new Set(brokerDelivered.map((x) => x.seller)).size,
      broker_delivered_n_rows: bv.length,
      broker_delivered_min: bv.length ? Math.min(...bv) : null,
      broker_delivered_median: bv.length ? median(bv) : null,
      broker_delivered_max: bv.length ? Math.max(...bv) : null,
      broker_material_only_n_sellers: new Set(brokerMaterialOnly.map((x) => x.seller)).size,
      broker_material_only_n_rows: bmv.length,
      broker_material_only_median: bmv.length ? median(bmv) : null,
    };
  }
  writeFileSync(
    join(repoRoot, 'docs/metro/research/data/dfw/slug-stats.json'),
    JSON.stringify(summary, null, 2) + '\n',
    'utf8',
  );
  console.log(`[merge-prices] Wrote per-slug stats to docs/metro/research/data/dfw/slug-stats.json`);
};

main();
