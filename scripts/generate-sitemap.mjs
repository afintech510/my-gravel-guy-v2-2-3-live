#!/usr/bin/env node
/**
 * Generate Sitemap for MyGravelGuy
 *
 * Fetches all dynamic pages from Supabase (products, blog posts, market
 * materials) and combines with static routes, metro routes, and (once the
 * prerender agent ships it) the /gravel-driveways hub to generate
 * sitemap.xml.
 *
 * Run: node scripts/generate-sitemap.mjs
 * Integrated into build: "build": "node scripts/generate-sitemap.mjs && vite build"
 *
 * To test without touching the live public/sitemap.xml, pass an output
 * path as the first CLI arg, e.g.:
 *   node scripts/generate-sitemap.mjs /tmp/sitemap-test.xml
 */

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { existsSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

// Supabase configuration
const SUPABASE_URL = 'https://losrkjvrcambvgijfism.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc3JranZyY2FtYnZnaWpmaXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTI0NjIsImV4cCI6MjA2MTQ2ODQ2Mn0.LdtyGNA5PmayO9VYcNRsO12DCAg0iS460rtTsDsS5B8';

const BASE_URL = 'https://mygravelguy.com';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Static pages with their priorities, change frequencies, and the source
// file whose real git-commit date drives <lastmod> (see gitLastCommitDate
// below). Never hardcode a single "today" date across every static page —
// that reads as a build-script default, not a real freshness signal, and
// AI-answer retrieval layers plausibly use lastmod/dateModified as a cheap
// freshness check (docs/metro/research/aeo-plan.md §1.6.4).
//
// Removed vs. the old list (see docs/metro/research/aeo-foundations-changes.md
// for the full rationale):
//   - /products   — canonicalizes to /shop (Products.tsx:52) and is 301'd
//                    to /shop in nginx/redirects.conf; listing a URL in the
//                    sitemap that immediately redirects elsewhere is bad
//                    hygiene (seo-technical-audit.md P1 #5).
//   - /product-calculator — 301'd to /calculator in nginx/redirects.conf
//                    (calculator consolidation, same audit, §4).
//   - /locations  — dropped entirely; see DROP_LOCATIONS note below.
const STATIC_PAGES = [
  { path: '/', priority: 1.0, changefreq: 'weekly', sourceFile: 'src/pages/Index.tsx' },
  { path: '/shop', priority: 0.9, changefreq: 'weekly', sourceFile: 'src/pages/Shop.tsx' },
  { path: '/bulk-landscape-materials', priority: 0.8, changefreq: 'weekly', sourceFile: 'src/pages/BulkLandscapeMaterials.tsx' },
  { path: '/calculator', priority: 0.8, changefreq: 'monthly', sourceFile: 'src/pages/Calculator.tsx' },
  { path: '/blog', priority: 0.7, changefreq: 'weekly', sourceFile: 'src/pages/Blog.tsx' },
  { path: '/about', priority: 0.7, changefreq: 'monthly', sourceFile: 'src/pages/About.tsx' },
  { path: '/contact', priority: 0.7, changefreq: 'monthly', sourceFile: 'src/pages/Contact.tsx' },
  { path: '/faq', priority: 0.6, changefreq: 'monthly', sourceFile: 'src/pages/FAQ.tsx' },
  { path: '/reviews', priority: 0.6, changefreq: 'weekly', sourceFile: 'src/pages/Reviews.tsx' },
  { path: '/delivery-map', priority: 0.6, changefreq: 'weekly', sourceFile: 'src/pages/DeliveryMap.tsx' },
  { path: '/delivery', priority: 0.6, changefreq: 'monthly', sourceFile: 'src/pages/DeliveryInfo.tsx' },
  { path: '/privacy', priority: 0.3, changefreq: 'yearly', sourceFile: 'src/pages/legal/PrivacyPolicy.tsx' },
  { path: '/terms', priority: 0.3, changefreq: 'yearly', sourceFile: 'src/pages/legal/TermsOfService.tsx' },
  { path: '/refund', priority: 0.3, changefreq: 'yearly', sourceFile: 'src/pages/legal/RefundPolicy.tsx' },
];

// DROP_LOCATIONS: per docs/metro/research/seo-technical-audit.md §2.4, the
// sitemap's ~196 /locations/* URLs came from the Supabase `delivery_locations`
// table, but LocationPage.tsx never queries that table — it resolves through
// three *other*, disconnected sources (28 hardcoded slugs, an unauditable
// Google Sheet, a 10-entry fallback object). At sitemap-generation time there
// is no reliable way to tell which delivery_locations rows will actually
// render real content vs. soft-404 (client-side redirect after 2s). Rather
// than guess, /locations is dropped from the sitemap entirely until the
// metro pivot's nginx redirect map (nginx/redirects.conf) and/or a fixed
// LocationPage data source ships. This is a call made by AEO-FOUNDATIONS,
// documented in docs/metro/research/aeo-foundations-changes.md — flag to the
// METRO-UI/owner if /locations should be reinstated before that lands.

// Duplicate blog posts confirmed live in the sitemap (seo-technical-audit.md
// §2.9) — both halves of each pair are still published in Supabase, so we
// exclude the loser slug here (nginx/redirects.conf 301s it to the winner)
// until the content/AEO owner unpublishes the loser row in `blog_posts`.
const DUPLICATE_BLOG_SLUGS_TO_DROP = new Set([
  'gravel-vs-crushed-stone-differences', // canonical: gravel-vs-crushed-stone
  '10-gravel-driveway-ideas',            // canonical: 10-driveway-ideas-using-gravel
  '5-gravel-types-guide',                // canonical: 5-gravel-types-and-when-to-use-them
]);

function formatDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

/** Real per-file lastmod: git's last-commit date for the file, falling back
 *  to the file's mtime (e.g. new/uncommitted files on this branch), falling
 *  back to today only if neither is available. Never a single constant
 *  across every page. */
function gitLastCommitDate(relPath) {
  try {
    const out = execSync(`git log -1 --format=%cI -- "${relPath}"`, {
      cwd: ROOT_DIR,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    if (out) return formatDate(out);
  } catch {
    // git not available or not a repo — fall through
  }
  try {
    const stat = statSync(join(ROOT_DIR, relPath));
    return formatDate(stat.mtime);
  } catch {
    console.warn(`  Warning: no git history or file for ${relPath}; using today's date`);
    return formatDate(new Date());
  }
}

function createUrlEntry(path, lastmod, priority = 0.5, changefreq = 'weekly') {
  return `  <url>
    <loc>${BASE_URL}${path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchMarketMaterialPages() {
  console.log('Fetching active market material pages...');

  const { data, error } = await supabase
    .from('market_materials')
    .select('slug_path, updated_at')
    .eq('status', 'active')
    .not('slug_path', 'is', null);

  if (error) {
    console.warn('  Warning: Could not fetch market materials:', error.message);
    return [];
  }

  return (data || []).map(row => ({
    path: `/${row.slug_path}`,
    lastmod: formatDate(row.updated_at),
    priority: 0.9,
    changefreq: 'weekly'
  }));
}

async function fetchBlogPosts() {
  console.log('Fetching blog posts...');

  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, published_at, created_at')
    .not('published_at', 'is', null);

  if (error) {
    console.warn('  Warning: Could not fetch blog posts:', error.message);
    return [];
  }

  const rows = (data || []).filter(row => !DUPLICATE_BLOG_SLUGS_TO_DROP.has(row.slug));
  const droppedCount = (data || []).length - rows.length;
  if (droppedCount > 0) {
    console.log(`  Dropped ${droppedCount} duplicate blog slug(s) (see DUPLICATE_BLOG_SLUGS_TO_DROP)`);
  }

  return rows.map(row => ({
    path: `/blog/${row.slug}`,
    lastmod: formatDate(row.published_at || row.created_at),
    priority: 0.6,
    changefreq: 'monthly'
  }));
}

async function fetchProducts() {
  console.log('Fetching products...');

  const { data, error } = await supabase
    .from('products')
    .select('slug, created_at')
    .not('slug', 'is', null);

  if (error) {
    console.warn('  Warning: Could not fetch products:', error.message);
    return [];
  }

  return (data || []).map(row => ({
    path: `/products/${row.slug}`,
    lastmod: formatDate(row.created_at),
    priority: 0.8,
    changefreq: 'weekly'
  }));
}

/** Metro routes (metro home / metro x category / town pages) — read-only
 *  from src/metro/config/** via the tsx-based exporter in
 *  scripts/metro/generate-metro-routes.ts. If tsx or the exporter isn't
 *  available, fall back to a small hardcoded metro-home list rather than
 *  failing the whole sitemap build. */
function fetchMetroRoutes() {
  console.log('Generating metro routes...');

  const exporterPath = join(ROOT_DIR, 'scripts', 'metro', 'generate-metro-routes.ts');
  const routesJsonPath = join(ROOT_DIR, 'scripts', 'metro', 'metro-routes.json');

  if (existsSync(exporterPath)) {
    try {
      execSync(`npx tsx "${exporterPath}"`, { cwd: ROOT_DIR, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (err) {
      console.warn('  Warning: metro route exporter failed, falling back to hardcoded metro homes:', err.message);
    }
  }

  if (existsSync(routesJsonPath)) {
    try {
      const raw = JSON.parse(readFileSync(routesJsonPath, 'utf8'));
      return raw.map(route => {
        const priority = route.kind === 'metro-home' ? 0.9 : route.kind === 'metro-category' ? 0.85 : 0.6;
        return {
          path: route.path,
          lastmod: gitLastCommitDate(route.sourceFile),
          priority,
          changefreq: 'weekly',
        };
      });
    } catch (err) {
      console.warn('  Warning: could not parse scripts/metro/metro-routes.json:', err.message);
    }
  }

  // Last-resort fallback so a broken exporter never drops the metro pages
  // entirely — keep in sync with src/metro/config's METRO slugs if this
  // ever fires in practice.
  console.warn('  Falling back to hardcoded metro-home routes (dallas-fort-worth, long-island)');
  return ['dallas-fort-worth', 'long-island'].map(slug => ({
    path: `/${slug}`,
    lastmod: formatDate(new Date()),
    priority: 0.9,
    changefreq: 'weekly',
  }));
}

/** /gravel-driveways hub + spokes — owned by the prerender agent, which
 *  drops a route manifest at scripts/prerender/extra-routes.json once the
 *  hub is actually built and prerendered. Per aeo-plan.md: "do not publish
 *  [a reference] until the ... content ... is live — a URL pointing at a
 *  404 is worse than not listing it," so this only contributes routes once
 *  that file exists; nothing is hardcoded here. */
function fetchExtraPrerenderRoutes() {
  const extraRoutesPath = join(ROOT_DIR, 'scripts', 'prerender', 'extra-routes.json');
  if (!existsSync(extraRoutesPath)) {
    console.log('  scripts/prerender/extra-routes.json not present yet (hub not built) — skipping /gravel-driveways');
    return [];
  }

  try {
    const raw = JSON.parse(readFileSync(extraRoutesPath, 'utf8'));
    const entries = Array.isArray(raw) ? raw : [];
    console.log(`  Found ${entries.length} extra prerender route(s) in scripts/prerender/extra-routes.json`);
    return entries.map(entry => {
      const route = typeof entry === 'string' ? { path: entry } : entry;
      return {
        path: route.path,
        lastmod: route.lastmod ? formatDate(route.lastmod) : route.sourceFile ? gitLastCommitDate(route.sourceFile) : formatDate(new Date()),
        priority: route.priority ?? 0.8,
        changefreq: route.changefreq ?? 'weekly',
      };
    });
  } catch (err) {
    console.warn('  Warning: could not parse scripts/prerender/extra-routes.json:', err.message);
    return [];
  }
}

async function main() {
  console.log('Generating sitemap...\n');

  // Fetch all dynamic pages in parallel
  const [marketPages, blogPosts, products] = await Promise.all([
    fetchMarketMaterialPages(),
    fetchBlogPosts(),
    fetchProducts(),
  ]);
  const metroRoutes = fetchMetroRoutes();
  const extraRoutes = fetchExtraPrerenderRoutes();

  // Build URL entries
  const urlEntries = [];

  // Add static pages, each with its own real lastmod
  for (const page of STATIC_PAGES) {
    urlEntries.push(createUrlEntry(page.path, gitLastCommitDate(page.sourceFile), page.priority, page.changefreq));
  }

  // Add dynamic + metro + extra pages (deduplicate by path)
  const seen = new Set(STATIC_PAGES.map(p => p.path));
  for (const page of [...products, ...marketPages, ...blogPosts, ...metroRoutes, ...extraRoutes]) {
    if (!seen.has(page.path)) {
      seen.add(page.path);
      urlEntries.push(createUrlEntry(page.path, page.lastmod, page.priority, page.changefreq));
    }
  }

  // Generate sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;

  console.log(`\nSitemap Summary:`);
  console.log(`  Static pages: ${STATIC_PAGES.length}`);
  console.log(`  Products: ${products.length}`);
  console.log(`  Market material pages: ${marketPages.length}`);
  console.log(`  Blog posts: ${blogPosts.length}`);
  console.log(`  Metro routes: ${metroRoutes.length}`);
  console.log(`  Extra prerender routes: ${extraRoutes.length}`);
  console.log(`  Total URLs: ${urlEntries.length}\n`);

  // Write to public/sitemap.xml by default, or to a CLI-supplied path
  // (e.g. `node scripts/generate-sitemap.mjs /tmp/sitemap-test.xml`) so this
  // script can be smoke-tested without touching the live file.
  const outputPath = process.argv[2] ? process.argv[2] : join(__dirname, '..', 'public', 'sitemap.xml');
  writeFileSync(outputPath, sitemap);
  console.log(`Sitemap written to: ${outputPath}`);

  return urlEntries.length;
}

main().catch(console.error);
