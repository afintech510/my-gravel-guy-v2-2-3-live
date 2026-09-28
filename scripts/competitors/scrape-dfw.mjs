#!/usr/bin/env node
/**
 * DFW competitor bulk-material scraper.
 *
 * Scope: public product/price JSON and HTML only. No cart/checkout/login,
 * no personal data collection. Node 18+ built-in fetch only, no deps.
 *
 * Usage: node scripts/competitors/scrape-dfw.mjs
 *
 * Writes:
 *   docs/metro/research/data/dfw/raw/<competitor-slug>/*.json   (raw pages)
 *   docs/metro/research/data/dfw/products.csv                    (normalized, appended)
 *
 * Rate limit: <= 1 request/sec per host. Page caps below.
 */

import { writeFile, mkdir, appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const DATA_DIR = path.join(REPO_ROOT, "docs", "metro", "research", "data", "dfw");
const RAW_DIR = path.join(DATA_DIR, "raw");
const CSV_PATH = path.join(DATA_DIR, "products.csv");

const UA = "MyGravelGuy-research/1.0 (+https://mygravelguy.com)";
const MAX_PAGES = 5; // per site page cap (Shopify products.json / WC store API)
const REQ_DELAY_MS = 1100; // <= 1 req/sec/host

const CSV_HEADER =
  "competitor,product_name,category,normalized_material,size_variant,price,unit,price_per_yd,price_per_ton,delivery_included,is_bulk,source_url,scraped_at\n";

// t/yd conversion factors (owner-supplied)
const TONS_PER_YD = { gravel: 1.4, sand: 1.35, soil: 1.1, mulch: 0.3, other: null };

/** DFW metro cities/suburbs in scope for this research pass (word-boundary match). */
const DFW_CITY_RE =
  /\b(dallas|fort worth|plano|frisco|mckinney|allen|denton|lewisville|arlington|mesquite|garland|rockwall|mansfield|southlake|grapevine|keller|weatherford|wylie|prosper|forney|irving|addison|carrollton|colleyville)\b/i;

/** city-slug form of the same DFW list, used for Mulch Mound's per-city product handles. */
const DFW_CITY_SLUGS = [
  "dallas",
  "fort-worth",
  "plano",
  "frisco",
  "mckinney",
  "allen",
  "denton",
  "lewisville",
  "arlington",
  "mesquite",
  "garland",
  "rockwall",
  "mansfield",
  "southlake",
  "grapevine",
  "keller",
  "weatherford",
  "wylie",
  "prosper",
  "forney",
];

/**
 * Sites we can hit with a generic Shopify or WooCommerce Store API scrape.
 * NOTE: earthstonerock.com and chesshirstone.com were probed (products.json /
 * wc/store JSON both return 200) but their live catalogs turned out to be a
 * plant nursery and a $0/"call for price" ornamental show-stone catalog
 * respectively - no real bulk gravel/mulch/sand/soil SKUs with prices. They
 * are excluded from automated scraping; see competitors.csv notes.
 */
const TARGETS = [
  {
    slug: "mulch-mound",
    name: "Mulch Mound",
    base: "https://mulchmound.com",
    platform: "shopify",
    filterDfw: true,
    unit: "yd", // Mulch Mound sells everything by the cubic yard
  },
  {
    slug: "mygravelbuddy",
    name: "MyGravelBuddy",
    base: "https://mygravelbuddy.com",
    platform: "woocommerce",
    filterDfw: false, // single-market DFW broker, no per-city catalog split
    unit: "ton", // site states "sold by the ton"; price is ZIP-adjusted, DFW ZIP not guaranteed
  },
];

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) return { ok: false, status: res.status, url };
  try {
    const json = await res.json();
    return { ok: true, status: res.status, url, json };
  } catch (e) {
    return { ok: false, status: res.status, url, error: String(e) };
  }
}

function categorize(name) {
  const n = name.toLowerCase();
  if (/(mulch|bark)/.test(n)) return "mulch";
  if (/(sand)/.test(n)) return "sand";
  if (/(soil|dirt|compost|topsoil|loam)/.test(n)) return "soil";
  if (/(gravel|stone|rock|base|granite|rip ?rap|flex base|crusher run|riprap|cobble|aggregate)/.test(n))
    return "gravel";
  return "other";
}

function normalizeMaterial(name) {
  return name
    .replace(/\d+(\.\d+)?\s?(cu\.?\s?)?(yd|yard|ton|lb|bag)s?\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Pull a unit + size variant guess out of a variant title / product title. */
function parseUnit(text) {
  const t = text.toLowerCase();
  if (/\bton\b/.test(t)) return "ton";
  if (/\byd|yard|cubic yard\b/.test(t)) return "yd";
  if (/\bbag\b/.test(t)) return "bag";
  if (/\beach|per item\b/.test(t)) return "each";
  return "unknown";
}

function pricePerYdTon(category, unit, price) {
  const factor = TONS_PER_YD[category];
  if (price == null || Number.isNaN(price)) return { perYd: "", perTon: "" };
  if (unit === "yd") {
    const perYd = price;
    const perTon = factor ? +(price / factor).toFixed(2) : "";
    return { perYd: +perYd.toFixed(2), perTon };
  }
  if (unit === "ton") {
    const perTon = price;
    const perYd = factor ? +(price * factor).toFixed(2) : "";
    return { perYd, perTon: +perTon.toFixed(2) };
  }
  return { perYd: "", perTon: "" };
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsvRow(fields) {
  return fields.map(csvEscape).join(",") + "\n";
}

const SHOPIFY_TYPE_CATEGORY = {
  mulch: "mulch",
  sand: "sand",
  soil: "soil",
  dirt: "soil",
  compost: "soil",
  gravel: "gravel",
  stone: "gravel",
  rock: "gravel",
};

function shopifyCategoryFromType(productType) {
  const t = (productType || "").toLowerCase();
  for (const [key, cat] of Object.entries(SHOPIFY_TYPE_CATEGORY)) {
    if (t.includes(key)) return cat;
  }
  return categorize(productType || "");
}

async function scrapeShopify(target) {
  const rows = [];
  const rawPages = [];
  const cap = target.pageCap ?? MAX_PAGES;
  for (let page = 1; page <= cap; page++) {
    const url = `${target.base}/products.json?limit=250&page=${page}`;
    const res = await fetchJson(url);
    await sleep(REQ_DELAY_MS);
    if (!res.ok) break;
    const products = res.json?.products ?? [];
    rawPages.push({ url, count: products.length });
    if (products.length === 0) break;
    for (const p of products) {
      if (target.filterDfw && !DFW_CITY_RE.test(p.title)) continue;
      const category = shopifyCategoryFromType(p.product_type || p.title);
      const seen = new Set();
      for (const v of p.variants ?? []) {
        // De-dupe by material/grade so we don't emit one row per supplier-yard
        // satellite location (option3) - keep the first (lowest-index) yard's price.
        const materialKey = [v.option1, v.option2].filter(Boolean).join(" / ") || v.title;
        const price = parseFloat(v.price);
        if (seen.has(materialKey)) {
          continue;
        }
        seen.add(materialKey);
        const unit = target.unit ?? parseUnit(`${v.title} ${p.title}`);
        const { perYd, perTon } = pricePerYdTon(category, unit, price);
        rows.push({
          competitor: target.name,
          product_name: p.title,
          category,
          normalized_material: normalizeMaterial(materialKey),
          size_variant: v.option3 && v.option3 !== materialKey ? v.option3 : "",
          price: Number.isFinite(price) ? price : "",
          unit,
          price_per_yd: perYd,
          price_per_ton: perTon,
          delivery_included: "unknown",
          is_bulk: category !== "other" ? "true" : "false",
          source_url: `${target.base}/products/${p.handle}`,
          scraped_at: new Date().toISOString(),
        });
      }
    }
    if (products.length < 250) break;
  }
  await saveRaw(target.slug, "products", rawPages);
  return rows;
}

/**
 * Mulch Mound's catalog is one Shopify product per (city x material) combo,
 * e.g. /products/dallas-texas-mulch-delivery. Paginating products.json is
 * unreliable for coverage (categories are clustered, not evenly spread across
 * pages), so instead fetch each DFW city x material handle directly.
 */
const MULCH_MOUND_MATERIALS = ["mulch", "sand", "soil", "stone"];

async function scrapeMulchMoundByHandle(target) {
  const rows = [];
  const rawPages = [];
  for (const citySlug of DFW_CITY_SLUGS) {
    for (const material of MULCH_MOUND_MATERIALS) {
      const handle = `${citySlug}-texas-${material}-delivery`;
      const url = `${target.base}/products/${handle}.json`;
      const res = await fetchJson(url);
      await sleep(REQ_DELAY_MS);
      if (!res.ok) {
        rawPages.push({ url, status: res.status });
        continue;
      }
      const p = res.json?.product;
      if (!p) continue;
      rawPages.push({ url, status: res.status, count: p.variants?.length ?? 0 });
      const category = shopifyCategoryFromType(p.product_type || material);
      const seen = new Set();
      for (const v of p.variants ?? []) {
        const materialKey = [v.option1, v.option2].filter(Boolean).join(" / ") || v.title;
        if (seen.has(materialKey)) continue;
        seen.add(materialKey);
        const price = parseFloat(v.price);
        const unit = target.unit;
        const { perYd, perTon } = pricePerYdTon(category, unit, price);
        rows.push({
          competitor: target.name,
          product_name: p.title,
          category,
          normalized_material: normalizeMaterial(materialKey),
          size_variant: v.option3 && v.option3 !== materialKey ? v.option3 : "",
          price: Number.isFinite(price) ? price : "",
          unit,
          price_per_yd: perYd,
          price_per_ton: perTon,
          delivery_included: "unknown",
          is_bulk: category !== "other" ? "true" : "false",
          source_url: `${target.base}/products/${handle}`,
          scraped_at: new Date().toISOString(),
        });
      }
    }
  }
  await saveRaw(target.slug, "by-handle", rawPages);
  return rows;
}

async function scrapeWooCommerce(target) {
  const rows = [];
  const rawPages = [];
  const endpoints = [
    (p) => `${target.base}/wp-json/wc/store/v1/products?per_page=100&page=${p}`,
    (p) => `${target.base}/wp-json/wc/store/products?per_page=100&page=${p}`,
  ];
  let products = [];
  for (const ep of endpoints) {
    products = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = ep(page);
      const res = await fetchJson(url);
      await sleep(REQ_DELAY_MS);
      if (!res.ok) break;
      const batch = Array.isArray(res.json) ? res.json : [];
      rawPages.push({ url, count: batch.length });
      if (batch.length === 0) break;
      products.push(...batch);
      if (batch.length < 100) break;
    }
    if (products.length > 0) break; // first working endpoint wins
  }
  for (const p of products) {
    const name = p.name ?? "";
    const category = categorize(name);
    const priceObj = p.prices ?? {};
    const minorUnit = priceObj.currency_minor_unit ?? 2;
    const rawPrice = priceObj.price ?? priceObj.regular_price ?? null;
    const price = rawPrice != null ? Number(rawPrice) / Math.pow(10, minorUnit) : null;
    if (price == null || !Number.isFinite(price) || price <= 0) continue; // skip $0/"call for price" items
    const unit = target.unit ?? parseUnit(name);
    const { perYd, perTon } = pricePerYdTon(category, unit, price);
    rows.push({
      competitor: target.name,
      product_name: name,
      category,
      normalized_material: normalizeMaterial(name),
      size_variant: "",
      price: price != null && Number.isFinite(price) ? price : "",
      unit,
      price_per_yd: perYd,
      price_per_ton: perTon,
      delivery_included: "unknown",
      is_bulk: category !== "other" ? "true" : "false",
      source_url: p.permalink ?? target.base,
      scraped_at: new Date().toISOString(),
    });
  }
  await saveRaw(target.slug, "wc-products", rawPages);
  return rows;
}

async function saveRaw(slug, label, data) {
  const dir = path.join(RAW_DIR, slug);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, `${label}.json`), JSON.stringify(data, null, 2), "utf8");
}

async function ensureCsvHeader() {
  try {
    const existing = await readFile(CSV_PATH, "utf8");
    if (existing.trim().length > 0) return; // already has content/header
  } catch {
    // file doesn't exist yet
  }
  await writeFile(CSV_PATH, CSV_HEADER, "utf8");
}

async function appendRows(rows) {
  if (rows.length === 0) return;
  const body = rows
    .map((r) =>
      toCsvRow([
        r.competitor,
        r.product_name,
        r.category,
        r.normalized_material,
        r.size_variant,
        r.price,
        r.unit,
        r.price_per_yd,
        r.price_per_ton,
        r.delivery_included,
        r.is_bulk,
        r.source_url,
        r.scraped_at,
      ])
    )
    .join("");
  await appendFile(CSV_PATH, body, "utf8");
}

/**
 * Manually recorded published prices for sites that have no scrapable
 * product JSON (HTML-only catalogs, or block automated API access).
 * Every entry was read from the cited source_url via WebFetch on 2026-09-27/28.
 * NEVER invent a price here - only transcribe what the page publishes.
 */
const MANUAL_ENTRIES = [
  // --- Outdoor Warehouse Supply (Plano + Lewisville yards) ---
  ...manualBatch("Outdoor Warehouse Supply", "https://www.outdoorwarehousesupply.com/product-category/bulk-materials/gravel/", "yd", true, [
    ["Black Decomposed Granite", "gravel", 215],
    ["Limestone Rip Rap", "gravel", 95],
    ["Granite Chips - 1\" minus", "gravel", 140],
    ["Native Gravel - Large", "gravel", 100],
    ["Texas Black Star Gravel - Large", "gravel", 320],
    ["Texas Black Star Gravel - Small", "gravel", 320],
    ["Pea Gravel", "gravel", 100],
    ["Native Gravel - Small", "gravel", 100],
    ["Flex Base - Large", "gravel", 65],
    ["Fines Base - Small", "gravel", 65],
  ]),
  ...manualBatch("Outdoor Warehouse Supply", "https://www.outdoorwarehousesupply.com/product-category/bulk-materials/sand-soil-mulch/", "yd", true, [
    ["Black Label Mulch", "mulch", 45],
    ["White Sand", "sand", 150],
    ["Cushion Sand", "sand", 42],
    ["Enriched Top Soil", "soil", 52],
    ["Mason Sand", "sand", 65],
    ["Hardwood Mulch", "mulch", 40],
    ["Concrete Sand", "sand", 80],
  ]),
  // --- Fort Worth Grass & Stone (10379 North Fwy, Fort Worth) ---
  ...manualBatch("Fort Worth Grass & Stone", "https://fortworthgrass.com/bulk-materials", "yd", false, [
    ["Decomposed Granite", "gravel", 110],
    ["Gravel (1 in.)", "gravel", 90],
    ["Masonry Sand", "sand", 100],
    ["Premium Soil Mix", "soil", 55],
    ["Texas Native Tree Mulch", "mulch", 50],
  ]),
  ...manualBatch("Fort Worth Grass & Stone", "https://fortworthgrass.com/bulk-materials", "ton", false, [
    ["White Marble (1-2\" size)", "gravel", 310],
  ]),
  // --- Gravel Monkey (national broker; all-in delivered entry prices ÷ min
  // order = an approximate per-unit rate. NOT DFW-specific - same price
  // nationwide per the site's own coverage.json. Delivery IS included. ---
  ...manualEntryPerUnit("Gravel Monkey", "https://mygravelmonkey.com/llms.txt", [
    ["#57 Crushed Stone", "gravel", 435, 2, "ton"],
    ["Crusher Run", "gravel", 425, 2, "ton"],
    ["Road Base", "gravel", 415, 2, "ton"],
    ["Driveway Gravel", "gravel", 432, 2, "ton"],
    ["3/4\" Driveway Gravel", "gravel", 435, 2, "ton"],
    ["Walkway Gravel", "gravel", 440, 2, "ton"],
    ["Drain Rock", "gravel", 472, 3, "ton"],
    ["Decomposed Granite", "gravel", 674, 3, "ton"],
    ["3/8\" Natural Pea Gravel", "gravel", 698, 2, "ton"],
    ["River Rock (various sizes)", "gravel", 822, 2, "ton"],
    ["1\"-1 1/2\" Crushed Concrete", "gravel", 625, 3, "ton"],
    ["Fill Dirt", "soil", 336, 3, "ton"],
    ["Topsoil", "soil", 421, 2, "ton"],
    ["Mason Sand", "sand", 556, 3, "ton"],
    ["Washed Sand", "sand", 701, 3, "ton"],
    ["Playground Sand", "sand", 701, 3, "ton"],
    ["Shredded Hardwood Mulch", "mulch", 372, 3, "yd"],
  ], true),
];

function manualBatch(competitor, sourceUrl, unit, deliveryIncluded, items) {
  const scraped_at = new Date().toISOString();
  return items.map(([name, category, price]) => {
    const { perYd, perTon } = pricePerYdTon(category, unit, price);
    return {
      competitor,
      product_name: name,
      category,
      normalized_material: normalizeMaterial(name),
      size_variant: "",
      price,
      unit,
      price_per_yd: perYd,
      price_per_ton: perTon,
      delivery_included: String(deliveryIncluded),
      is_bulk: "true",
      source_url: sourceUrl,
      scraped_at,
    };
  });
}

/** entryPrice covers minQty of `unit` (e.g. $435 for 2 tons) -> derive a per-unit rate. */
function manualEntryPerUnit(competitor, sourceUrl, items, deliveryIncluded) {
  const scraped_at = new Date().toISOString();
  return items.map(([name, category, entryPrice, minQty, unit]) => {
    const perUnit = +(entryPrice / minQty).toFixed(2);
    const { perYd, perTon } = pricePerYdTon(category, unit, perUnit);
    return {
      competitor,
      product_name: name,
      category,
      normalized_material: normalizeMaterial(name),
      size_variant: `entry price $${entryPrice} for ${minQty} ${unit} minimum (national, not DFW-specific)`,
      price: perUnit,
      unit,
      price_per_yd: perYd,
      price_per_ton: perTon,
      delivery_included: String(deliveryIncluded),
      is_bulk: "true",
      source_url: sourceUrl,
      scraped_at,
    };
  });
}

async function main() {
  await mkdir(RAW_DIR, { recursive: true });
  await ensureCsvHeader();

  for (const target of TARGETS) {
    console.log(`Scraping ${target.name} (${target.platform})…`);
    try {
      const rows =
        target.slug === "mulch-mound"
          ? await scrapeMulchMoundByHandle(target)
          : target.platform === "shopify"
            ? await scrapeShopify(target)
            : await scrapeWooCommerce(target);
      console.log(`  -> ${rows.length} product/variant rows`);
      await appendRows(rows);
    } catch (err) {
      console.error(`  !! failed: ${err.message}`);
    }
  }

  console.log(`Adding ${MANUAL_ENTRIES.length} manually-recorded rows (unscrapable sites)…`);
  await appendRows(MANUAL_ENTRIES);
  await saveRaw("_manual", "manual-entries", MANUAL_ENTRIES);

  console.log(`Done. Normalized rows appended to ${path.relative(REPO_ROOT, CSV_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
