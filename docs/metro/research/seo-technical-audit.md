# SEO-Technical Audit — mygravelguy.com (SEO-TECH agent)

Status: COMPLETE. Read-only on repo code; this file + one HANDOFF-LOG row are the only writes.

Date: 2026-09-27/28
Scope: technical SEO foundations to support the metro-first pivot (DFW #1, Long Island pilot) and the AEO goal (be citeable by Google AI Overviews/AI Mode/Gemini/ChatGPT). Content/keyword strategy is owned by the AEO agent — this doc is technical only.

Prior audit on file: `docs/05-seo-audit.md` (dated March 3, 2026). Where a March finding has since been fixed in code, it's called out as **RESOLVED**. Where it's still open, it's re-confirmed live.

Legend: **FACT** [evidence: URL or file:line, live-checked 2026-09-28] vs **RECOMMENDATION** (needs a decision/build work).

---

## 1. Live checks

All checks run live against production 2026-09-28 via direct HTTP (`curl`) — not through a rendering browser — because that's what non-JS crawlers (most AI answer-engine bots, many social-share bots, Bing/Ahrefs-style crawlers without JS rendering, and Googlebot's first HTML-only pass) actually see.

### Headline finding: every route serves byte-identical HTML

**FACT**: `/`, `/shop`, `/products/pea-gravel`, `/locations/dallas-tx`, and `/blog` all return HTTP 200 with the **exact same** `<title>`, the **exact same** meta description, **no** `<link rel="canonical">`, **zero** `application/ld+json` scripts, and an empty `<div id="root"></div>` body [evidence: live curl, 2026-09-28]:

| URL | Status | `<title>` returned |
|---|---|---|
| `/` | 200 | "My Gravel Guy \| Bulk Gravel, Sand & Mulch Delivery Nationwide" |
| `/shop` | 200 | *(same, identical string)* |
| `/products/pea-gravel` | 200 | *(same)* |
| `/locations/dallas-tx` | 200 | *(same)* |
| `/blog` | 200 | *(same)* |

This is the site's real, current state for anything that reads raw HTML instead of executing JavaScript — including react-helmet-async's per-page `<title>`/meta/canonical/JSON-LD, which never reach the wire because the app is 100% client-rendered (confirmed in Section 2).

**FACT — this is already visible in the wild, not just theoretical**: a live Google search for `site:mygravelguy.com/locations` returns `https://mygravelguy.com/locations/kansas-city-mo` with the title **"My Gravel Guy | Bulk Gravel, Sand & Mulch Delivery Nationwide"** — the generic homepage title, not "Gravel Delivery in Kansas City, MO" [evidence: WebSearch `site:mygravelguy.com/locations`, 2026-09-28]. Google has indexed the un-rendered shell for at least this inner page. A `site:mygravelguy.com` sample similarly returned mostly homepage-title snippets for product URLs.

### robots.txt — live-verified byte-identical to repo

**FACT** [evidence: `https://mygravelguy.com/robots.txt`, matches `public/robots.txt:1-21` exactly]: `Allow: /` for Googlebot/Bingbot/Twitterbot/facebookexternalhit and for `*`, blocking only `/dashboard`, `/dashboard/*`, `/stripe-test`, `/checkout`, `/payment-success`. Sitemap reference present and correct.

There is **no** explicit rule for GPTBot, ClaudeBot, Google-Extended, PerplexityBot, OAI-SearchBot, anthropic-ai, cohere-ai, or Applebot-Extended. Under the current `*`/`Allow: /` block these are **implicitly allowed** — which is what the AEO objective wants — but see P0-4 below: this directly contradicts a claim in the prior audit.

### sitemap.xml — live-verified byte-identical to repo

**FACT**: live `sitemap.xml` = 273 `<url>` entries, identical to `public/sitemap.xml` in this repo: 17 static pages, 46 `/products/*`, 196 `/locations/*`, 11 `/blog/*`, 3 `/markets/.../materials/...`. Valid XML, all HTTPS, no params.

### 20-URL sample: HTTP status vs. actual resolvable content

**FACT**: all 20 sampled URLs (spread across the sitemap) return **HTTP 200** — no hard 404s, no redirect chains [evidence: live curl, 2026-09-28]. But HTTP 200 does not mean real content. Cross-referencing the sample against `LocationPage.tsx`'s actual data sources (Section 2) shows only 1 of the 15 sampled `/locations/*` slugs (`seattle-wa`) is guaranteed to resolve to real, location-specific content; the rest depend entirely on an external, unauditable Google Sheet:

| URL | HTTP | Resolves via `src/data/locations` (28 slugs)? | Resolves via `LocationPage.tsx` `fallbackLocationData` (10 slugs)? | Verdict |
|---|---|---|---|---|
| `/` | 200 | — | — | real |
| `/delivery` | 200 | — | — | real |
| `/products/clean-fill-dirt`, `/products/crushed-stone-1-12in`, `/products/crushed-stone-57` | 200 | — | — | real (DB-backed) |
| `/markets/boston-ma/materials/driveway-gravel-1-12in` | 200 | — | — | real (DB-backed) |
| `/locations/seattle-wa` | 200 | **yes** | — | real |
| `/locations/detroit-mi`, `spokane-wa`, `tulsa-ok`, `knoxville-tn`, `las-vegas-nv`, `amarillo-tx`, `jersey-city-nj`, `portland-me`, `elmira-ny`, `york-pa`, `roanoke-va`, `florence-sc`, `west-palm-beach-fl`, `dothan-al` (14 of 15) | 200 | no | no | **soft 404 unless the Google Sheet happens to contain the slug** (unauditable from repo) |

### site: index sample

**FACT** [WebSearch, 2026-09-28]: `site:mygravelguy.com` returns real MyGravelGuy product pages (e.g. `/products/road-base`, `/products/driveway-gravel-34in`) mixed with unrelated Wikipedia noise (weak site authority / thin index). `site:mygravelguy.com/locations` returns only **one** location page in the visible sample (`kansas-city-mo`), and its title is the generic homepage title, not location-specific — consistent with the soft-404/no-unique-title problem above suppressing indexation of the other 195 location URLs.

---

## 2. Code review

### 2.1 Rendering: 100% client-side, no SSR/SSG in the pipeline

**FACT**: `index.html:80-81` — the entire document body is `<div id="root"></div>` + `<script type="module" src="/src/main.tsx">`. `vite.config.ts:1-23` has no SSR/prerender plugin. `package.json:8` build script is `"node scripts/generate-sitemap.mjs && vite build"` — no prerender step. `scripts/generate-prerender-routes.mjs` exists (writes `prebuild/routes.json`) but is **not referenced anywhere in `package.json`** — confirmed unwired/dead code, as the task brief flagged.

### 2.2 Helmet / canonical / OG consistency — page-by-page (re-verified against March audit)

**RESOLVED since March** (good — verified in current code, not just claimed):
- `NotFound.tsx:27-30` now has `<title>` + `<meta name="robots" content="noindex, follow">` (March audit said this was missing).
- `LandingPage.tsx:74` canonical now `https://mygravelguy.com/landing` (no more `www.` mismatch).
- `ProductDetail.tsx` (full file read) and `MarketMaterialPage.tsx:98-148` — **no `aggregateRating` node present at all** in either file's JSON-LD. The March-audit-flagged fake `"ratingValue": "4.8"` hardcoded rating is gone.
- `Contractors.tsx`, `ContractorsAggregateLanding.tsx`, `Reviews.tsx`, `Blog.tsx` all now have `<Helmet>` + canonical + OG tags (grep-verified: `helmet=1 canonical=1 og=1`).
- `Cart.tsx` / `Checkout.tsx` now carry `<meta name="robots">` (noindex), as recommended.

**Still open / newly confirmed**:

| Page | Helmet | canonical | OG | JSON-LD | Note |
|---|---|---|---|---|---|
| `Calculator.tsx` | **0** | 0 | 0 | 0 | src/pages/Calculator.tsx — no Helmet at all; inherits generic index.html title |
| `CalculatorShop.tsx` | **0** | 0 | 0 | 0 | src/pages/CalculatorShop.tsx — same |
| `BlogCategory.tsx` | **0** | 0 | 0 | 0 | src/pages/BlogCategory.tsx — same |
| `ProductCalculator.tsx` | 1 | 0 | 0 | 0 | has Helmet, no canonical |
| `LocationsIndex.tsx` | 1 | 0 | 0 | 0 | no canonical |
| `DeliveryInfo.tsx` | 1 | 0 | 0 | 0 | no canonical (also the llms.txt broken-link target, see 2.5) |
| `legal/PrivacyPolicy.tsx`, `TermsOfService.tsx`, `RefundPolicy.tsx` | 1 | 0 | 0 | 0 | low priority |
| `Products.tsx:52` | 1 | **1, but points to `/shop`** | partial | **0** | self-canonicalizes away from itself — see 2.3 |

None of this matters for crawlers that don't run JS (Section 1) — react-helmet-async tags never reach the wire regardless. It matters for (a) Googlebot's eventual JS-render pass, (b) any tool/AI crawler that does render JS, and (c) once prerendering ships (Section 3), these become the actual served `<head>`.

### 2.3 `/products` vs `/shop` — only half-fixed

**FACT**: `Products.tsx:52` sets `<link rel="canonical" href="https://mygravelguy.com/shop" />` — i.e., the page tells search engines "don't index me, index `/shop` instead." But:
- `/products` is still a live, fully separate route (`App.tsx:130`) with its own component, its own `ProductSearch`/`ProductGrid`, and **no JSON-LD** (unlike `Shop.tsx:63-76`, which has `CollectionPage` schema) — a clear "loser" page kept alive.
- It's still in the sitemap generator as a first-class static page at priority 0.9, same as `/shop` (`scripts/generate-sitemap.mjs:32-33`), which contradicts the canonical tag's "this page doesn't count" signal.
- Internal nav sends users to *different* pages for the same intent: `Footer.tsx:44` — label "Shop" → `href: '/products'`; `Navbar.tsx:24,30` — label "Order Now" → `href: '/shop'`. Half the site's internal links point at the page whose own canonical says "don't index me."

**RECOMMENDATION**: pick one (Section 4 redirect map picks `/shop`, since it has the richer schema and is what the primary nav CTA already uses) and 301 `/products` (exact match only — leave `/products/:slug` untouched, those are real product detail pages referenced everywhere).

### 2.4 Location pages: three disconnected data sources

**FACT** — `LocationPage.tsx` resolves a `/locations/:slug` request in this order:
1. `src/data/locations/*.ts` (`deliveryLocations`, 28 hardcoded slugs, matches Texas/west-coast/midwest-east/southeast/central files) — checked first, `LocationPage.tsx:180-205`.
2. A public Google Sheet (`sheetId '1f-9eFHdoSETcV79k1lkEFTNSZ9ZXCDJqPbRWquiZByI'`, `LocationPage.tsx:208-217`) — contents not auditable from this repo.
3. `fallbackLocationData`, a 10-entry hardcoded object inline in the same file (`LocationPage.tsx:31-162`).
4. Else: renders "Location Not Found" (no `noindex` meta on this state), toasts an error, and **client-side `navigate('/locations')` after a 2-second `setTimeout`** (`LocationPage.tsx:236-238`, `285-287`) — classic soft 404: HTTP 200, generic content, redirect only fires for clients that execute JS and wait 2 seconds.

Meanwhile, **the sitemap's 196 `/locations/*` URLs come from a fourth, different source**: the Supabase `delivery_locations` table (`scripts/generate-sitemap.mjs:114-142`), which `LocationPage.tsx` **never queries**. So the set of URLs Google is told to crawl (delivery_locations table) and the set of slugs the page can actually render (data files + Sheet + fallback object) are two independently-maintained lists that nothing in the codebase keeps in sync.

**RECOMMENDATION**: this is likely moot once the metro pivot replaces `/locations/:slug` with `/dallas-fort-worth/...` and `/long-island/...` — but until that ships, either point `LocationPage.tsx` at `delivery_locations` directly, or prune the sitemap/DB table to match what actually renders.

### 2.5 llms.txt broken link

**FACT**: `public/llms.txt:53` — `"Delivery Info: https://mygravelguy.com/delivery-info"`. The actual route is `/delivery` (`src/App.tsx:151`, `DeliveryInfo` component). `/delivery-info` is not a route; it falls through to the SPA catch-all (`App.tsx:180`) and renders `NotFound` (HTTP 200 SPA-fallback, not a real 404 — see 2.6). Any LLM/agent that trusts llms.txt and requests that exact URL gets a 404 page, not delivery info.

### 2.6 nginx / Dockerfile / Cloudflare worker

**FACT** — `nginx/default.conf:32-38`: SPA fallback `try_files $uri $uri/ /index.html` for `location /`, with `Cache-Control: no-cache, no-store, must-revalidate` on both `/index.html` and the fallback. This means **every unknown path returns HTTP 200** (not 404) with the app shell — the textbook "soft 404s" pattern the March audit flagged, still true today, and it's what makes `/delivery-info`, unrecognized `/locations/:slug`, and any typo'd URL all return 200.

Good news, also confirmed: `nginx/default.conf:14-23` correctly does aggressive immutable caching on `/assets/` (1y) and other static extensions (30d), and gzip is on (`default.conf:7-11`) for text/JS/JSON/XML/SVG (no brotli, minor).

**FACT** — `cloudflare-worker/wrangler.toml:6-10`: the worker's route is commented out — **not deployed**. This matches the live curl results in Section 1 exactly (no meta-tag rewriting is happening in production).

**FACT** — even if enabled, `cloudflare-worker/src/index.ts` only rewrites `<title>`/meta/canonical **for a hardcoded bot user-agent allowlist** (`BOT_USER_AGENTS`, lines 13-33, includes `Googlebot` itself) using `HTMLRewriter` on the *same unrendered origin response* — it never touches `<body>`. It has a static `ROUTE_META` map (lines 64-146) with **zero entries for `/markets/...` or any future `/dallas-fort-worth`/`/long-island` metro routes**, and its dynamic-route handling (lines 155-186) only covers `/products/`, `/blog/`, `/locations/` prefixes with generic per-prefix templates (no real price, no real location facts). This worker, even fully wired, would improve social-share preview cards; it would **not** solve crawlability of actual content for AI answer engines, nor put a real price into the HTML for Google Merchant Center landing-page price match.

**FACT** — `Dockerfile:1-25` two-stage build: stage 1 (`node:20-alpine`) runs `npm run build`, stage 2 (`nginx:alpine`) copies only `dist/` + `nginx/default.conf`. This split is exactly what a build-time prerender step needs (headless-browser tooling stays in stage 1 and never reaches the runtime image) — see Section 3.

### 2.7 JSON-LD validity spot-check

Where present, JSON-LD is well-formed and mostly matches the right schema.org type per page (`Product` on `ProductDetail.tsx`/`MarketMaterialPage.tsx`, `CollectionPage` on `Shop.tsx`, `LocalBusiness` on `Index.tsx`/`LocationPage.tsx`, `BlogPosting` on `BlogPost.tsx`). No fake ratings anywhere (confirmed fixed, 2.2). Gaps: `Products.tsx` has none; `/products` (bare route), `/blog` index, `/locations` index still lack `ItemList`/`Blog`/`CollectionPage` markup (unchanged from March audit).

### 2.8 Internal linking

`Footer.tsx:44` vs `Navbar.tsx:24,30` split on `/products` vs `/shop` (2.3). `Products.tsx`/`Shop.tsx` both still exist as parallel nav targets. `/blog` is in the Footer (per March audit) — not re-verified line-by-line here since it wasn't the focus, but the Products/Shop split is the material internal-linking issue.

### 2.9 Duplicate blog posts (confirmed live in sitemap)

**FACT** [live sitemap, 2026-09-28] — three near-duplicate topic pairs are both published and both listed:
- `/blog/gravel-vs-crushed-stone` and `/blog/gravel-vs-crushed-stone-differences`
- `/blog/10-driveway-ideas-using-gravel` and `/blog/10-gravel-driveway-ideas`
- `/blog/5-gravel-types-and-when-to-use-them` and `/blog/5-gravel-types-guide`

These are separate rows in the (out-of-repo) Supabase `blog_posts` table, so which one has more historical traffic/backlinks can't be determined from code — flagged for the AEO/content agent to pick a winner before redirecting (Section 4 gives a placeholder direction).

### 2.10 Images / Core Web Vitals risk

**FACT, still open (same as March audit)**: `src/pages/Index.tsx:53-57` — the homepage hero is a full-viewport (`min-h-screen`) CSS `background-image` (`url('.../loader-with-driveway-gravel.png')`), not an `<img>`. No `fetchpriority="high"`, no `<link rel="preload" as="image">`, no responsive sizes, PNG (not WebP/AVIF), served straight from Supabase Storage with no CDN image transform. This is almost certainly the page's LCP element and is invisible to Google Images / AI image search (no `alt`).

`index.html:36-59` — two inline `<script>` blocks in `<head>` (GA4 loader, Apollo tracker IIFE). Both load their actual payload `async`/`defer`, so they are not classically render-blocking, but the Apollo IIFE runs synchronously on every request before first paint. Not a major CWV item, worth a mention only.

---

## 3. Prerender/SSR recommendation

**RECOMMENDATION: build-time static prerendering (SSG) of the CSR bundle via a headless-browser pass in the Docker build stage.** Not the Cloudflare Worker (2.6 shows it can't render body content or bake in prices), not a full Next.js/Astro/Remix migration (too much risk/effort to justify on a live revenue-generating site with Stripe checkout, auth dashboard, and cart state, for a near-term metro-pivot deadline).

### Why this option
- It solves the actual, confirmed problem (Section 1): non-JS crawlers see the SPA shell. Static prerendering makes every route's served HTML contain the real title, canonical, OG tags, JSON-LD, **and rendered body text** — which is what both Googlebot's first pass and non-JS AI/answer-engine crawlers read.
- It's the only option of the three that can bake a **real, default-zone price directly into the HTML** for Google Merchant Center landing-page price match on metro category pages — Cloudflare-Worker meta-rewriting can't touch body content, and today's client-side ZIP-gated pricing means Merchant's crawler currently sees no price at all in the raw HTML.
- The two-stage Dockerfile (2.6) already isolates build tooling from the runtime image, so adding headless-Chromium to stage 1 doesn't bloat the deployed nginx image.
- Two of the needed building blocks already exist, just unwired: `scripts/generate-prerender-routes.mjs` (route-list generator) and a `document.dispatchEvent(new Event('prerender-ready'))` convention already used in `NotFound.tsx:19-22` and `MarketMaterialPage.tsx:57-65` — this just needs to be adopted on every page instead of two.

### Concrete plan

1. **Route list** — fix and re-wire `scripts/generate-prerender-routes.mjs`: add `/shop` (drop `/products` per Section 4), add the new metro routes once `METRO-UI` lands them in `App.tsx` (`/dallas-fort-worth`, `/dallas-fort-worth/:category-delivery`, `/long-island`, `/long-island/towns/:town`), and source `/locations/*` from whichever data store is authoritative after the 2.4 fix (don't prerender slugs that can't resolve to content — that just bakes the "Location Not Found" text into a static file instead of fixing anything).

2. **Ready signal** — generalize the existing `prerender-ready` custom event: add a small `usePrerenderReady()` hook that every page's top-level component calls once its async data (product/location/metro-market fetch) has settled, instead of the ad hoc placement in just `NotFound.tsx` and `MarketMaterialPage.tsx` today.

3. **New script `scripts/prerender.mjs`**: after `vite build`, serve `dist/` locally (e.g. `vite preview` or `sirv`), launch headless Chromium (Playwright, `chromium` only — no Firefox/WebKit needed), and for each route in `prebuild/routes.json`: navigate, wait for the `prerender-ready` event, capture `page.content()`, write it to `dist/<route>/index.html` (e.g. `dist/dallas-fort-worth/pea-gravel-delivery/index.html`). Leave `dist/index.html` and `dist/assets/**` as Vite produced them.

4. **`package.json:8`** build script becomes: `node scripts/generate-sitemap.mjs && vite build && node scripts/generate-prerender-routes.mjs && node scripts/prerender.mjs`.

5. **`Dockerfile`** (stage 1 only, `Dockerfile:1-12`): add `RUN npx playwright install --with-deps chromium` before `RUN npm run build`. Stage 2 (nginx) is untouched — final image size unaffected, since only `dist/` crosses the stage boundary (`Dockerfile:21`).

6. **`nginx/default.conf`** needs almost no change: `try_files $uri $uri/ /index.html` (line 33) already resolves `/locations/dallas-tx` → `dist/locations/dallas-tx/index.html` automatically via the `$uri/` fallback, before ever reaching the SPA shell. Only the redirect-map additions (Section 4) and a real `error_page 404` for genuinely retired paths are needed.

7. **Hydration**: check `src/main.tsx`'s render call — if it's `createRoot(...).render(...)` (typical CRA/Vite default), a full client remount over the static markup is fine for a CSR app this size (briefly discards then rebuilds the DOM — no visible flash in practice, and far simpler than debugging `hydrateRoot` mismatch warnings against server-rendered ZIP-based pricing state). Switching to `hydrateRoot` is a stretch goal, not required for the SEO/AEO win, since the win comes entirely from what crawlers read in the initial response, not from avoiding a client remount.

8. **Merchant Center price-in-HTML**: for metro category/product pages, render the metro's default/lowest-zone price into both the visible page text and the JSON-LD `Offer.price` *before* the `prerender-ready` event fires, so the Playwright snapshot captures a real number instead of an empty ZIP-gated placeholder.

9. **404 handling**: routes that should be real 404s (discontinued/never-existed location slugs) should not be in the prerender route list or the sitemap at all; for anything nginx still can't map to a static file, add `error_page 404 /404.html;` pointing at a prerendered, `noindex`-tagged 404 page, so those paths finally return an honest HTTP 404 instead of a 200 SPA shell.

**Effort**: medium — most of the scaffolding (route list, ready-event convention, two-stage Docker split) already exists in some form; the net-new work is the Playwright harness plus per-page verification that data fetches complete before the ready event fires.

---

## 4. Redirect map (nginx)

Two things below are code-verifiable facts (the /products↔/shop split, the llms.txt path); the exact final `/locations/*` → metro mapping and which blog post "wins" each duplicate pair are **recommendations** pending confirmation from the AEO/content agent and the METRO-UI agent's final town list — don't deploy the location-map section verbatim without cross-checking it against the finished metro town list first.

```nginx
# ============================================================
# MyGravelGuy — redirect map, add inside the mygravelguy.com
# server{} block in nginx/vps-nginx-addition.conf, before the
# generic `location /` proxy_pass block.
# ============================================================

# --- /products vs /shop: /shop wins (richer JSON-LD, primary nav CTA) ---
# Exact match only — /products/:slug (product detail pages) is untouched.
location = /products {
  return 301 https://mygravelguy.com/shop;
}

# --- llms.txt references a path that was never a real route ---
location = /delivery-info {
  return 301 https://mygravelguy.com/delivery;
}

# --- Calculator consolidation (RECOMMENDATION: confirm canonical calculator
#     with product before deploying — /calculator has the shortest URL and
#     is what /calculator-shop and /product-calculator both overlap with) ---
location = /product-calculator {
  return 301 https://mygravelguy.com/calculator;
}
location = /calculator-shop {
  return 301 https://mygravelguy.com/calculator;
}

# --- Duplicate blog posts (RECOMMENDATION: AEO agent to confirm which of
#     each pair has more existing traffic/backlinks before finalizing
#     direction — arrows below are a placeholder, not a verified decision) ---
location = /blog/gravel-vs-crushed-stone-differences {
  return 301 https://mygravelguy.com/blog/gravel-vs-crushed-stone;
}
location = /blog/10-gravel-driveway-ideas {
  return 301 https://mygravelguy.com/blog/10-driveway-ideas-using-gravel;
}
location = /blog/5-gravel-types-guide {
  return 301 https://mygravelguy.com/blog/5-gravel-types-and-when-to-use-them;
}

# --- Old /locations/:slug → new metro pages, once metro routes ship.
#     RECOMMENDATION — template only. Fill in real mappings from the
#     METRO-UI agent's final DFW/Long Island town list before deploying.
#     Pattern: known metro-area slugs redirect into the metro page;
#     everything else in /locations/ that isn't in the ~30-slug
#     "real content" set (Section 2.4) should 410, not silently 200. ---
location = /locations/dallas-tx {
  return 301 https://mygravelguy.com/dallas-fort-worth;
}
location = /locations/fort-worth-tx {
  return 301 https://mygravelguy.com/dallas-fort-worth;
}
# ... repeat for each confirmed DFW-metro slug, and the Long Island
# equivalents once /long-island/towns/{town} ships ...

# Anything else under /locations/ that the metro pivot doesn't replace
# and that LocationPage.tsx can't actually resolve today (Section 2.4)
# should be pruned from the sitemap/DB and return a real 410, e.g.:
#   location ~ ^/locations/(detroit-mi|spokane-wa|tulsa-ok|...)$ {
#     return 410;
#   }
# Do NOT blanket-410 all of /locations/ — the 28 slugs in
# src/data/locations/*.ts and the 10 in LocationPage.tsx's
# fallbackLocationData render real content today and should keep working
# (or get an explicit 301 to their metro replacement) until the pivot
# page is confirmed live.
```

---

## 5. Prioritized fix list (P0/P1/P2)

### P0 — blocks the stated top objective (AI Overviews/Gemini/ChatGPT citations) and is already visibly hurting production

| # | Issue | Evidence | Fix |
|---|---|---|---|
| 1 | Every route serves byte-identical, unrendered HTML — no page-specific title/meta/canonical/JSON-LD/body content ever reaches a non-JS client | Live curl, 2026-09-28 (Section 1); `index.html:80-81`; `vite.config.ts` (no SSR/prerender plugin); `package.json:8` (no prerender step) | Ship the build-time prerender pipeline (Section 3) |
| 2 | This is already visible in Google's live index (generic homepage title indexed for an inner page) | `site:mygravelguy.com/locations/kansas-city-mo` → generic title (Section 1) | Same fix as #1; re-request indexing after prerendering ships |
| 3 | ~195 of 196 sitemap `/locations/*` URLs are unverifiable/soft-404 — sitemap sources from Supabase `delivery_locations`, but `LocationPage.tsx` never queries that table, only 28 hardcoded slugs + a 10-entry fallback + an unauditable Google Sheet | `scripts/generate-sitemap.mjs:114-142` vs `LocationPage.tsx:180-243, 384-396`; sample table Section 1 | Align data source (2.4) or prune sitemap before/alongside the metro pivot replacing this page |
| 4 | `llms.txt` advertises `/delivery-info`, which is not a route (falls to SPA 200 shell, not real content) | `public/llms.txt:53` vs `src/App.tsx:151` | nginx redirect (Section 4) + fix the llms.txt text (not done here — out of this agent's write scope) |

### P1 — high impact, moderate effort

| # | Issue | Evidence | Fix |
|---|---|---|---|
| 5 | `/products` vs `/shop`: canonical tag points away from `/products`, but the page is still fully routed, still in the sitemap at priority 0.9, has no JSON-LD, and internal nav is split (Footer→`/products`, Navbar→`/shop`) | `Products.tsx:52`; `App.tsx:130`; `scripts/generate-sitemap.mjs:32-33`; `Footer.tsx:44`; `Navbar.tsx:24,30` | 301 `/products` → `/shop` (Section 4), remove `/products` from sitemap `STATIC_PAGES`, fix `Footer.tsx:44` href |
| 6 | 3 duplicate blog post pairs, all published and sitemapped | Live sitemap, 2026-09-28 (Section 2.9) | 301 + canonical merge (Section 4), then unpublish the loser row in `blog_posts` |
| 7 | Calculator route sprawl — `Calculator.tsx` and `CalculatorShop.tsx` have **zero** Helmet at all (not even a title override); `ProductCalculator.tsx` has Helmet but no canonical | grep table, Section 2.2 | Add Helmet+canonical to all three at minimum; consolidate per Section 4 pending product confirmation |
| 8 | Homepage hero is a CSS background-image, not an `<img>` — likely LCP element, invisible to Google Images, no alt text | `src/pages/Index.tsx:53-57` | Convert to `<img fetchpriority="high">` + preload, serve WebP |
| 9 | robots.txt has no explicit AI-crawler rules; prior audit claims a Cloudflare-level AI-scraper block that can't be verified from this repo and, if real, would defeat the stated top objective | `public/robots.txt:1-21` (live-verified) vs `docs/05-seo-audit.md:40` | Verify in Cloudflare dashboard (Security → Bots) that GPTBot/ClaudeBot/PerplexityBot/Google-Extended/OAI-SearchBot are not challenged — cannot be confirmed from code |
| 10 | Cloudflare prerender worker is unwired (route commented out) and, even enabled, can't render body content or metro prices — don't rely on it as the crawlability fix | `cloudflare-worker/wrangler.toml:6-10`; `cloudflare-worker/src/index.ts:13-33,64-146` | Keep only as a cheap secondary layer for social-share OG once metro routes are added to `ROUTE_META`; primary fix is Section 3 |

### P2 — polish / lower urgency

| # | Issue | Evidence | Fix |
|---|---|---|---|
| 11 | Missing canonical on `LocationsIndex.tsx`, `DeliveryInfo.tsx`, `ProductCalculator.tsx`, legal pages, and zero Helmet on `BlogCategory.tsx` | grep table, Section 2.2 | Add canonical/Helmet |
| 12 | og:image inconsistency — `index.html:29` uses a Supabase Storage URL, several pages use `https://mygravelguy.com/og-image.png` | `index.html:29` vs `Shop.tsx:62` | Standardize on one URL |
| 13 | Twitter Card tags only in `index.html` + a couple of pages | `index.html:31-33` | Add per-page where OG exists |
| 14 | `scripts/generate-prerender-routes.mjs` is dead code today | Not referenced in `package.json` | Delete, or adopt as the base for Section 3 (recommended) |
| 15 | gzip only, no brotli in nginx | `nginx/default.conf:7-11` | Low-value; add brotli module if the base image supports it |

---

## Summary of what's fixed vs. still open since the March 2026 audit

**Fixed** (verified in current code): fake `aggregateRating` removed from Product/MarketMaterial JSON-LD; `NotFound.tsx` now has noindex; `LandingPage.tsx` canonical fixed to non-www; `Contractors`/`ContractorsAggregateLanding`/`Reviews`/`Blog` now have canonical+OG; `Cart`/`Checkout` now noindex.

**Still open**: no SSR/prerendering (the single biggest lever, and now confirmed live-visible in Google's index, not just theoretical); `/products` vs `/shop` split (canonical-only fix is incomplete); homepage hero still a CSS background; several pages still missing Helmet/canonical entirely (two calculator routes have *zero* Helmet, worse than "missing canonical").

**New since March** (found this pass): the `/locations/*` sitemap-vs-render-data mismatch (four disconnected data sources); 3 duplicate blog post pairs now live in the sitemap; the llms.txt `/delivery-info` broken link; the robots.txt-vs-Cloudflare-WAF AI-crawler contradiction that needs dashboard verification.
