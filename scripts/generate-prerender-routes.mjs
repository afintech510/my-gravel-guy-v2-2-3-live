#!/usr/bin/env node
/**
 * Generate Prerender Routes
 *
 * Builds the full list of routes the build-time Playwright prerender pass
 * (scripts/prerender/prerender.mjs) should visit and snapshot. Writes
 * prebuild/routes.json (array of paths, e.g. "/dallas-fort-worth/mulch-delivery").
 *
 * Sources:
 *  - STATIC_ROUTES: hand-curated marketing/informational pages that exist as
 *    plain <Route> entries in src/App.tsx. Deliberately excludes anything
 *    auth-gated, checkout/cart, or dev-only (see the exclusion list below).
 *  - Product pages (/products/:slug): read-only REST GET against the public
 *    Supabase `products` table, using the same VITE_ env vars the app itself
 *    uses (no service-role key, no writes).
 *  - Blog posts (/blog/:slug): read-only REST GET against `blog_posts`,
 *    published only.
 *  - Metro routes (home/category/town): sourced from src/metro/config via a
 *    `npx tsx` subprocess (scripts/prerender/routes/metro-routes.ts), since
 *    that config is TypeScript and this script is plain Node ESM.
 *  - Extra routes: scripts/prerender/extra-routes.json — a plain array of
 *    paths another agent can populate later (e.g. /gravel-driveways guides)
 *    without touching this file.
 *
 * Explicitly OUT of scope for now:
 *  - /locations/:slug — the SEO audit (docs/metro/research/seo-technical-audit.md
 *    §2.4) found the sitemap's /locations/* slugs come from a different data
 *    source than what LocationPage.tsx can actually render, so prerendering
 *    them today would just bake "Location Not Found" into a static file.
 *    Revisit once that's reconciled or the metro pivot fully replaces it.
 *  - /markets/:marketSlug/materials/:materialSlug — real, DB-backed content
 *    (market_materials table) that predates this pass; not in this agent's
 *    brief, flagged as a follow-up in prerender-implementation.md.
 *  - Anything auth-gated or transactional: /dashboard/**, /checkout, /cart,
 *    /payment-success, /stripe-test, /delivery-confirm, /add-to-cart,
 *    /quote-checkout.
 *
 * Run: node scripts/generate-prerender-routes.mjs
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ---------------------------------------------------------------------------
// .env loader — plain Node scripts don't get Vite's automatic .env loading,
// so read the same VITE_ vars the client app uses directly off disk. GET-only
// REST calls below use the public anon/publishable key, same as the app.
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = join(ROOT, '.env');
  const env = {};
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
  }
  return env;
}

const env = { ...loadEnv(), ...process.env };
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_KEY = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    '⚠️  VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY not found (.env or process.env) — ' +
      'product/blog routes will be skipped.'
  );
}

async function restGet(table, query) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) {
    console.warn(`  Warning: REST GET ${table} failed: ${res.status} ${res.statusText}`);
    return [];
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Static marketing/informational routes — from src/App.tsx's plain <Route>
// list. Kept as a hand-curated allowlist (not "every route not on the
// exclude list") so a future auth/admin/tool route added to App.tsx doesn't
// silently get prerendered and shipped as a static file.
// ---------------------------------------------------------------------------
const STATIC_ROUTES = [
  '/',
  '/products',
  '/shop',
  '/bulk-landscape-materials',
  '/locations',
  '/about',
  '/contact',
  '/faq',
  '/delivery',
  '/delivery-map',
  '/reviews',
  '/blog',
  '/contractors',
  '/contractors-aggregate-delivery-service',
  '/contractors-spec-materials',
  '/calculator',
  '/calculator-shop',
  '/product-calculator',
  '/57-crushed-stone',
  '/landing',
  '/privacy',
  '/terms',
  '/refund',
];

async function fetchProductRoutes() {
  console.log('Fetching products (REST, read-only)...');
  const rows = await restGet('products', 'select=slug,active&slug=not.is.null');
  // `active` isn't in generated types but is a real column — filter the same
  // way src/services/products/productFetching.ts does client-side.
  return rows.filter(row => row.active !== false).map(row => `/products/${row.slug}`);
}

async function fetchBlogRoutes() {
  console.log('Fetching published blog posts (REST, read-only)...');
  const rows = await restGet('blog_posts', 'select=slug,published_at&published_at=not.is.null');
  return rows.map(row => `/blog/${row.slug}`);
}

function fetchMetroRoutes() {
  console.log('Fetching metro routes (src/metro/config via npx tsx)...');
  const scriptPath = join(__dirname, 'prerender', 'routes', 'metro-routes.ts');
  // `npx` resolves to a .cmd shim on Windows, which Node can only spawn through
  // a shell — pass a single pre-quoted command string (not shell:true + an
  // args array) so there's no argument-escaping ambiguity for the shell to get
  // wrong (scriptPath is our own controlled path, not user input).
  const result = spawnSync(`npx tsx "${scriptPath}"`, {
    cwd: ROOT,
    encoding: 'utf8',
    shell: true,
  });
  if (result.status !== 0) {
    console.warn('  Warning: could not read metro routes via tsx:');
    console.warn(result.stderr || result.error);
    return [];
  }
  try {
    return JSON.parse(result.stdout.trim());
  } catch (err) {
    console.warn('  Warning: metro-routes.ts did not print valid JSON:', err.message);
    return [];
  }
}

function fetchExtraRoutes() {
  const extraPath = join(__dirname, 'prerender', 'extra-routes.json');
  if (!existsSync(extraPath)) return [];
  try {
    const parsed = JSON.parse(readFileSync(extraPath, 'utf8'));
    if (!Array.isArray(parsed)) {
      console.warn('  Warning: scripts/prerender/extra-routes.json is not an array, ignoring.');
      return [];
    }
    return parsed.filter(r => typeof r === 'string' && r.startsWith('/'));
  } catch (err) {
    console.warn('  Warning: could not parse scripts/prerender/extra-routes.json:', err.message);
    return [];
  }
}

export async function generateRoutes() {
  console.log('Generating prerender routes...\n');

  const [productRoutes, blogRoutes] = await Promise.all([
    fetchProductRoutes(),
    fetchBlogRoutes(),
  ]);
  const metroRoutes = fetchMetroRoutes();
  const extraRoutes = fetchExtraRoutes();

  const allRoutes = [...STATIC_ROUTES, ...productRoutes, ...blogRoutes, ...metroRoutes, ...extraRoutes];
  const uniqueRoutes = [...new Set(allRoutes)].sort();

  console.log('\nRoute summary:');
  console.log(`  Static:   ${STATIC_ROUTES.length}`);
  console.log(`  Products: ${productRoutes.length}`);
  console.log(`  Blog:     ${blogRoutes.length}`);
  console.log(`  Metro:    ${metroRoutes.length}`);
  console.log(`  Extra:    ${extraRoutes.length}`);
  console.log(`  Total unique: ${uniqueRoutes.length}\n`);

  const outputDir = join(ROOT, 'prebuild');
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });

  const outputPath = join(outputDir, 'routes.json');
  writeFileSync(outputPath, JSON.stringify(uniqueRoutes, null, 2));
  console.log(`Routes written to: ${outputPath}`);

  return uniqueRoutes;
}

// Only run when executed directly (`node scripts/generate-prerender-routes.mjs`),
// not when imported by scripts/prerender/prerender.mjs.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  generateRoutes().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
