#!/usr/bin/env node
/**
 * Build-time static prerender pass.
 *
 * Run after `vite build`. Serves dist/ locally with an SPA fallback, launches
 * headless Chromium (Playwright), visits every route from
 * generate-prerender-routes.mjs, waits for the page to settle, and writes the
 * fully-rendered HTML to dist/<route>/index.html (dist/index.html for "/").
 * nginx's `try_files $uri $uri/index.html /index.html;` then serves these
 * static files directly to any client — including non-JS crawlers — instead
 * of the empty SPA shell.
 *
 * Background: docs/metro/research/seo-technical-audit.md §3. The
 * `prerender-ready` custom event convention already exists on two pages
 * (NotFound.tsx, MarketMaterialPage.tsx) but isn't used everywhere yet — see
 * the READY-SIGNAL STRATEGY note below for how this script copes with that.
 *
 * Usage: node scripts/prerender/prerender.mjs
 * (invoked via `npm run build:prerender`, after `vite build`)
 */

import http from 'node:http';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { generateRoutes } from '../generate-prerender-routes.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..', '..');
const DIST_DIR = path.join(ROOT, 'dist');

const CONCURRENCY = 4;
const NAV_TIMEOUT_MS = 20_000; // hard cap on page.goto + networkidle wait
const READY_GRACE_MS = 2_000; // extra grace window for a late prerender-ready event
const ROUTE_TIMEOUT_MS = 30_000; // hard cap on the whole per-route job

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

// Third-party analytics/ads/chat scripts we don't want firing (and skewing
// real traffic numbers / slowing down / hanging) during a headless snapshot
// pass. Matched by substring against the request URL.
const BLOCKED_URL_SUBSTRINGS = [
  'googletagmanager.com',
  'google-analytics.com',
  'analytics.google.com',
  'assets.apollo.io',
  'apollo.io',
  'chatbase.co',
  'doubleclick.net',
  'googlesyndication.com',
];

// ---------------------------------------------------------------------------
// Tiny static file server with SPA fallback, mirroring nginx's
// `try_files $uri $uri/index.html /index.html;` behavior so what Playwright
// sees locally matches what production will serve.
// ---------------------------------------------------------------------------
async function resolveFile(urlPath) {
  const cleanPath = decodeURIComponent(urlPath.split('?')[0]);
  const candidates = [
    path.join(DIST_DIR, cleanPath),
    path.join(DIST_DIR, cleanPath, 'index.html'),
    path.join(DIST_DIR, 'index.html'),
  ];
  for (const candidate of candidates) {
    try {
      const s = await stat(candidate);
      if (s.isFile()) return candidate;
    } catch {
      // not found, try next candidate
    }
  }
  return null;
}

function startServer() {
  const server = http.createServer(async (req, res) => {
    const filePath = await resolveFile(req.url || '/');
    if (!filePath) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    try {
      const body = await readFile(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(body);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Server error');
    }
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

// ---------------------------------------------------------------------------
// Route -> output file path. "/" -> dist/index.html (overwrites the Vite
// shell on purpose — that's the whole point, see prerender-implementation.md
// for the tradeoff this creates for the SPA-fallback case).
// ---------------------------------------------------------------------------
function outputPathForRoute(route) {
  if (route === '/') return path.join(DIST_DIR, 'index.html');
  const segments = route.split('/').filter(Boolean);
  return path.join(DIST_DIR, ...segments, 'index.html');
}

// ---------------------------------------------------------------------------
// READY-SIGNAL STRATEGY
// Most pages have no explicit "data has loaded" signal — only NotFound.tsx and
// MarketMaterialPage.tsx dispatch `prerender-ready` today, and this agent
// can't add it elsewhere (src/pages/** is owned by other in-flight agents).
// So the primary readiness signal is Playwright's own `networkidle` load
// state (all the marketing/product/metro pages fetch their data on mount and
// then go quiet — none of them poll). `prerender-ready` is layered on top as
// an accelerator/extra-confidence signal via an init script that flips
// window.__PRERENDER_READY__, with a short grace window after networkidle in
// case a late-arriving fetch is about to update the DOM.
// ---------------------------------------------------------------------------
async function snapshotRoute(context, baseUrl, route) {
  const page = await context.newPage();
  await page.addInitScript(blockedSubstrings => {
    window.__PRERENDER_READY__ = false;
    document.addEventListener('prerender-ready', () => {
      window.__PRERENDER_READY__ = true;
    });

    // Network-layer route blocking (see context.route below) stops the actual
    // HTTP request, but it does NOT stop a tracker's inline bootstrap script
    // from still running and mutating the DOM — e.g. index.html's Apollo
    // snippet calls `document.head.appendChild(scriptEl)` unconditionally.
    // If that DOM node makes it into page.content(), it gets permanently
    // baked into the static file: a real visitor's browser would then parse
    // BOTH that leftover node AND get a second one from the same inline
    // script running again client-side — double-firing the tracker forever.
    // So also neutralize the DOM-insertion methods for blocked-domain
    // <script> elements, not just their network requests.
    const isBlockedScript = node =>
      node &&
      node.tagName === 'SCRIPT' &&
      typeof node.src === 'string' &&
      blockedSubstrings.some(s => node.src.includes(s));

    const origAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function (node) {
      if (isBlockedScript(node)) return node;
      return origAppendChild.call(this, node);
    };

    const origInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (node, ref) {
      if (isBlockedScript(node)) return node;
      return origInsertBefore.call(this, node, ref);
    };
  }, BLOCKED_URL_SUBSTRINGS);

  try {
    await page.goto(`${baseUrl}${route}`, {
      waitUntil: 'networkidle',
      timeout: NAV_TIMEOUT_MS,
    }).catch(() => {
      // Some pages (e.g. /delivery-map's Mapbox tiles) never truly go idle.
      // That's fine — we still capture whatever's rendered after the timeout.
    });

    // Short grace window: resolve early if prerender-ready already fired,
    // otherwise just wait it out so late-settling DOM updates land.
    await Promise.race([
      page.waitForFunction(() => window.__PRERENDER_READY__ === true, {
        timeout: READY_GRACE_MS,
      }),
      page.waitForTimeout(READY_GRACE_MS),
    ]).catch(() => {});

    // De-dupe head tags before capture. index.html ships static
    // <meta name="description">/<meta property="og:*">/<meta name="twitter:*">
    // tags for the pre-hydration/no-JS case; react-helmet-async only ever
    // manages tags it created itself (marked `data-rh`) and has no way to
    // know about or remove that static one, so most routes end up with BOTH
    // the generic static tag and Helmet's page-specific one in the DOM —
    // confirmed via local verification (every route had two
    // <meta name="description"> tags). That's a pre-existing runtime
    // behavior (same thing happens in a live browser after hydration, not
    // something this pass introduced), but it directly undercuts the point
    // of prerendering: most crawlers/parsers take the *first* matching tag
    // when duplicates exist, which in DOM order is the generic static one,
    // not Helmet's page-specific one. Fix at capture time rather than
    // touching index.html/src/** (outside this agent's ownership): keep the
    // data-rh (Helmet-managed) tag when one exists in a name/property group,
    // drop the rest. Doesn't touch <title> (Helmet sets document.title,
    // which the spec routes into the existing single <title> node rather
    // than creating a second one — already verified as exactly 1 per route)
    // or JSON-LD (multiple <script type="application/ld+json"> blocks per
    // page are intentional, one per schema type, not duplicates).
    await page.evaluate(() => {
      const groups = new Map();
      for (const el of Array.from(document.head.querySelectorAll('meta'))) {
        const key = el.getAttribute('name')
          ? `name:${el.getAttribute('name')}`
          : el.getAttribute('property')
          ? `property:${el.getAttribute('property')}`
          : null;
        if (!key) continue; // e.g. <meta charset> has neither attribute
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(el);
      }
      for (const els of groups.values()) {
        if (els.length < 2) continue;
        const rhTags = els.filter(el => el.hasAttribute('data-rh'));
        const keep = rhTags.length > 0 ? rhTags[rhTags.length - 1] : els[els.length - 1];
        for (const el of els) {
          if (el !== keep) el.remove();
        }
      }
    });

    const html = await page.content();
    return { html };
  } finally {
    await page.close().catch(() => {});
  }
}

async function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms: ${label}`)), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
  return results;
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    console.error(`dist/ not found at ${DIST_DIR} — run "vite build" before this script.`);
    process.exit(1);
  }

  console.log('Generating route list...');
  const routes = await generateRoutes();
  console.log(`\nPrerendering ${routes.length} routes (concurrency ${CONCURRENCY})...\n`);

  const { server, baseUrl } = await startServer();
  const browser = await chromium.launch();
  const context = await browser.newContext();

  // Block analytics/ads/chat so they don't fire against real accounts during
  // the snapshot pass and don't slow down/hang the networkidle wait.
  await context.route('**/*', route => {
    const url = route.request().url();
    if (BLOCKED_URL_SUBSTRINGS.some(s => url.includes(s))) {
      return route.abort();
    }
    return route.continue();
  });

  const startedAt = Date.now();
  const results = await runPool(routes, CONCURRENCY, async route => {
    const routeStart = Date.now();
    try {
      const { html } = await withTimeout(
        snapshotRoute(context, baseUrl, route),
        ROUTE_TIMEOUT_MS,
        route
      );
      const outPath = outputPathForRoute(route);
      await mkdir(path.dirname(outPath), { recursive: true });
      await writeFile(outPath, html);
      const ms = Date.now() - routeStart;
      console.log(`  ok    ${route} (${ms}ms)`);
      return { route, ok: true, ms };
    } catch (err) {
      const ms = Date.now() - routeStart;
      console.warn(`  FAIL  ${route} (${ms}ms): ${err.message}`);
      return { route, ok: false, ms, error: err.message };
    }
  });

  await context.close().catch(() => {});
  await browser.close().catch(() => {});
  await new Promise(resolve => server.close(resolve));

  const totalMs = Date.now() - startedAt;
  const ok = results.filter(r => r.ok);
  const failed = results.filter(r => !r.ok);

  console.log('\n--- Prerender summary ---');
  console.log(`Routes attempted: ${results.length}`);
  console.log(`Succeeded:        ${ok.length}`);
  console.log(`Failed:           ${failed.length}`);
  console.log(`Total time:       ${(totalMs / 1000).toFixed(1)}s`);
  if (failed.length) {
    console.log('\nFailed routes:');
    for (const f of failed) console.log(`  - ${f.route}: ${f.error}`);
  }

  // Non-fatal by design (per task brief): a handful of slow/broken routes
  // shouldn't fail the whole production build. Route list + verification
  // greps in prerender-implementation.md are how this gets caught in review.
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
