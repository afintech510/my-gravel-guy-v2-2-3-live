# Merge-to-main runbook — `feature/metro-ui` → `main`

Status: DRAFT skeleton written early, filled in incrementally by the
F-DEPLOY-READINESS agent (2026-09-28). Covers everything needed for the
owner (adam@easternbuilding.supply) to safely merge the metro/AEO/prerender
pivot into `main`, which is the **only** branch that auto-deploys to
`mygravelguy.com` (`.github/workflows/deploy.yml`: `on: push: branches:
[main]` + `workflow_dispatch` — confirmed by reading the file; it is **not**
triggered by pushes to `feature/metro-ui` or by `pull_request` events).

mygravelguy.com is a **live production site**. Nothing in this document
should be run against production without reading the relevant section first.

---

## 0. TL;DR for the owner

1. Confirm the two gates in §1 are green.
2. Read §2 so you know exactly what changes for live users (short version:
   every page gets real prerendered HTML, two new metro sites go live in
   "coming soon" / "pilot" quote-request mode — no Stripe checkout for metro
   orders yet — and a handful of URLs 301-redirect).
3. Follow §3 to merge and watch the deploy.
4. Run the §4 smoke test (~15 min, read-only, no real orders).
5. Only after §4 passes: submit URLs to IndexNow (last step in §4).
6. Keep §5 (rollback) open in a tab until you're confident the deploy is
   good — it has copy-pasteable commands.
7. §6/§7 (edge functions, Merchant API) are **separate, owner-approved
   steps** — nothing in the `main` merge deploys them.

---

## 1. Pre-merge gates

- [ ] **CI: `docker-build-check` green.** This is the new workflow at
      `.github/workflows/docker-build-check.yml` (this agent's deliverable).
      It builds the real multi-stage `Dockerfile` (Debian + Playwright +
      `npm run build:prerender`, the untested-in-CI-until-now path), runs
      the built image, and curls `/`, `/dallas-fort-worth`,
      `/gravel-driveways/cost`, `/products/pea-gravel` for HTTP 200 + a
      route-specific `<title>` + a JSON-LD block, plus two of
      `nginx/redirects.conf`'s 301s. A second, lighter job runs the scoped
      vitest suite and a non-blocking `tsc --noEmit`. View it: GitHub repo →
      **Actions** tab → **Docker Build Check** workflow → latest run for
      `feature/metro-ui` (it also runs automatically once you open the PR,
      via the `pull_request: branches: [main]` trigger).
      It has never run yet as of this writing — **the first real signal
      on whether `npx playwright install --with-deps chromium` resolves
      cleanly under `node:20-bookworm-slim` comes from this workflow's
      first run.** Don't merge until you've seen it pass once.
- [ ] **Scoped tests pass locally too** (already verified by this agent,
      read-only, 2026-09-28): `npx vitest run src/metro src/content
      src/services/googleShopping` → **110/110 passed**, 7 test files.
- [ ] **`npx tsc --noEmit -p tsconfig.app.json`** — 19 pre-existing errors,
      none in the branch's actual work areas (`src/metro/**`,
      `src/content/**`, `src/services/googleShopping/**`). All 19 are in
      `src/components/dashboard/OrderDetailModal.tsx`,
      `src/pages/DeliveryConfirm.tsx`, `src/pages/MarketMaterialPage.tsx`,
      `src/pages/CrushedStoneLanding.tsx` — Supabase generated-types drift
      (e.g. `delivery_confirmations` missing from the generated `Database`
      type) and prop-shape mismatches, unrelated to this branch's changes.
      Not a merge blocker; tracked as pre-existing debt. The CI job runs
      this non-blocking (`continue-on-error: true`) for visibility.
- [ ] **Local `npm run build:prerender` gives 110+/110 routes.** Already
      done twice by the PRERENDER-ENGINEER agent (`docs/metro/research/
      prerender-implementation.md`) — 110/110 both times, ~110s. If you
      re-run it yourself before merging: **`git checkout -- public/sitemap.xml`
      afterward** — `build:prerender` regenerates the sitemap as a side
      effect (via `generate-sitemap.mjs`) and you don't want an
      unintentional sitemap diff riding along in your merge commit. Also
      `rm -rf prebuild/` or just leave it — `prebuild/` is gitignored
      (pure derived output).
- [ ] **Review the diff vs `main`.** Scale (`git diff main...feature/metro-ui
      --stat`, run 2026-09-28, `main` HEAD = `3c2fc42`):

      ```
      149 files changed, 26504 insertions(+), 585 deletions(-)
      ```

      By area (file counts from `git diff main...feature/metro-ui --name-only`):

      | Area | Files | What |
      |---|---|---|
      | `src/` | 79 | Metro storefront (`src/metro/**`), gravel-driveways guide hub (`src/content/guides/**`, `src/pages/guides/**`), Google Shopping/Merchant API rewrite (`src/services/googleShopping/**`, `src/components/admin/GoogleShoppingManager.tsx`), `src/App.tsx` route wiring |
      | `docs/` | 41 | Research/planning docs + QA screenshots (all markdown/csv/json/png — **none of it ships in the Docker image**, see §1a below) |
      | `scripts/` | 13 | Prerender pipeline (`scripts/prerender/**`, rewritten `scripts/generate-prerender-routes.mjs`), competitor-price scraping tools, `scripts/metro/export-price-book.mjs`, `scripts/seo/indexnow-submit.mjs` |
      | `supabase/` | 5 (all new) | `supabase/functions/google-merchant-sync/**` — new edge function, **not deployed by the `main` merge** (see §6) |
      | `public/` | 3 | `robots.txt` (rewritten, AI-crawler groups added), `llms.txt` (rewritten), one new Bing verification file |
      | `nginx/` | 2 | `default.conf` (SPA fallback + redirects include changed), `redirects.conf` (new) |
      | root | 4 | `Dockerfile` (base image + build command changed), `package.json`/`package-lock.json` (2 new scripts, `playwright`+`tsx` devDeps), `.gitignore` (`prebuild/` added), `DFW_bulk-materials-pricing.csv` (raw research scratch file, not read by any build step), `prompt-responses.md` (7,380-line agent transcript, not read by any build step) |

      This is a large diff (mostly new, additive files — 585 deletions is
      small relative to 26,504 insertions) but touches relatively few
      **existing, live-traffic-serving files**: `src/App.tsx` (route
      additions, +34/-? lines — old routes untouched), `Dockerfile`,
      `nginx/default.conf`, `public/robots.txt`, `public/llms.txt`,
      `package.json`. Everything else is net-new (`src/metro/**`,
      `src/content/guides/**`, `src/pages/guides/**`,
      `src/pages/metro/**`, `scripts/prerender/**`,
      `supabase/functions/google-merchant-sync/**`).

### 1a. Why `docs/` doesn't matter to the Docker build

Verified by grepping every `.mjs`/`.ts` file under `scripts/**`,
`src/metro/**`, and `src/services/googleShopping/**` for a filesystem read
(`readFile`/`require(`/`import(`/`fetch(`/`fs.`) of a `docs/` path — every
hit is a comment, not a real read. `.dockerignore` (this agent's edit) now
excludes `docs/` entirely (previously only `*.md` files under it were
excluded; the raw CSV/JSON scrape data in `docs/metro/research/data/**` and
the PNG QA screenshots were not) plus the root-level
`DFW_bulk-materials-pricing.csv` scratch file. Confirmed no build script
reads either.

---

## 2. What changes for live users on merge

### Ships to everyone, every route

- **Prerendered HTML for every route in the allowlist** (110 routes as of
  the last local run — 23 static marketing pages, 46 product pages, 11 blog
  posts, 23 metro routes, 8 `/gravel-driveways/*` guides). Instead of an
  empty `<div id="root">` shell with generic title/meta, non-JS
  clients (search crawlers, AI-answer-engine bots, `curl`, social-share
  unfurlers) now get the fully client-rendered HTML baked in at build time
  — real `<title>`, page-specific meta description, canonical, JSON-LD, and
  visible body text/prices. This is the P0 fix from
  `docs/metro/research/seo-technical-audit.md` §3.
- **`robots.txt` rewritten**: explicit per-crawler-group `Disallow` for
  `/dashboard`, `/dashboard/*`, `/stripe-test`, `/checkout`,
  `/payment-success` (previously only a bare `Allow: /`), plus new explicit
  groups for AI crawlers (Google-Extended, OAI-SearchBot, ChatGPT-User,
  PerplexityBot, ClaudeBot, Applebot-Extended, etc. — see the file for the
  full list). **Owner action noted in the file's own header comment**:
  verify Cloudflare "Block AI bots"/Bot Fight Mode isn't silently
  challenging these bots at the edge — not controllable from this repo.
- **`llms.txt` rewritten** (AEO-FOUNDATIONS agent) — an old broken
  `/delivery-info` reference is fixed at the source and also covered by a
  301 (see below) for anyone with the old link cached.
- **`public/sitemap.xml`** regenerated by `generate-sitemap.mjs` (part of
  `npm run build:prerender`) — drops `/locations/*` entirely (see
  `nginx/redirects.conf`'s own comment for why: the sitemap's old
  `delivery_locations` source and the page's actual render data are
  disconnected, most of ~196 URLs soft-404 today), drops the loser half of
  3 duplicate blog-post pairs, adds the new metro/guide routes.

### New, previously-nonexistent routes

- `/dallas-fort-worth` (metro home, `status: 'coming-soon'`) +
  `/dallas-fort-worth/:categorySegment` (gravel/sand/mulch/soil category
  pages) — **no town pages yet for DFW**.
- `/long-island` (metro home, `status: 'pilot'`) +
  `/long-island/:categorySegment` + `/long-island/towns/:townSlug` (13 town
  pages).
- `/gravel-driveways` hub + 7 guide pages (`/cost`, `/best-gravel`,
  `/how-much-gravel`, `/depth-and-layers`,
  `/crusher-run-vs-57-vs-flex-base`, `/maintenance`,
  `/dallas-fort-worth` under the guides path — note this is
  `/gravel-driveways/dallas-fort-worth`, a *guide* page, distinct from the
  metro home `/dallas-fort-worth`).

### 301 redirects (new, via `nginx/redirects.conf`, included into
    `nginx/default.conf` ahead of the SPA `location /` fallback)

| From | To | Why |
|---|---|---|
| `/delivery-info` | `/delivery` | Never a real route (`src/App.tsx` has no `/delivery-info`); was soft-404ing via the SPA shell |
| `/products` (exact) | `/shop` | `/shop` has richer CollectionPage JSON-LD and is what nav already links to. **Note**: `/products` is *also* in the prerender `STATIC_ROUTES` allowlist, so `dist/products/index.html` still gets built — it's just unreachable, because `location = /products` (exact match) wins over `location /` regardless of file existence. Harmless (a few seconds of wasted prerender time on one route), not a bug, but flagged here so it isn't mistaken for one during review. `/products/:slug` (product detail pages) are untouched. |
| `/product-calculator`, `/calculator-shop` | `/calculator` | Calculator consolidation — confirm with product if traffic patterns differ from the audit's assumption before treating this as final |
| `/blog/gravel-vs-crushed-stone-differences` | `/blog/gravel-vs-crushed-stone` | Duplicate blog post pair |
| `/blog/10-gravel-driveway-ideas` | `/blog/10-driveway-ideas-using-gravel` | Duplicate blog post pair |
| `/blog/5-gravel-types-guide` | `/blog/5-gravel-types-and-when-to-use-them` | Duplicate blog post pair |
| `/locations/dallas-tx`, `/locations/fort-worth-tx`, `/locations/arlington-tx` | `/dallas-fort-worth` | Confirmed DFW-metro slugs → new metro home. All other `/locations/*` slugs are **untouched** (no blanket redirect — see the file's own comment on why a catch-all would be wrong; some, e.g. `seattle-wa`, render real content today) |

### `nginx` `try_files` change

`try_files $uri $uri/ /index.html;` → `try_files $uri $uri/index.html
/index.html;`. Resolves e.g. `/dallas-fort-worth/mulch-delivery` straight to
its prerendered static file. **Does not change behavior for any route with
no prerendered file** (every dynamic/auth route below) — `$uri` and
`$uri/index.html` both fail to resolve, same as before, falls through to
`/index.html` (the SPA shell) exactly as today. One shape change: that SPA
shell is no longer Vite's empty shell — `/` gets overwritten by its own
prerendered content, so an unknown/unmapped path now serves the
prerendered **homepage's** real HTML instead of an empty shell. Arguably an
improvement for genuinely-unknown paths (a crawler now sees real content
instead of nothing) but it's still not an honest HTTP 404 — flagged as a
known tradeoff in `nginx/default.conf`'s own comment and in
`prerender-implementation.md`'s Risks section; a real `error_page 404`
pointing at a prerendered 404 page is proposed there as a follow-up, not
built in this pass.

### Merchant API admin tab

`src/components/admin/GoogleShoppingManager.tsx` (behind `/dashboard`,
admin-gated, `noindex`/not in the prerender allowlist) is rewritten: no
more client-side Merchant Center OAuth token in a `<Textarea>` (the old
security issue this replaces), new "Dry run sync" / "Sync to Merchant
Center" buttons calling the new `google-merchant-sync` edge function. **The
edge function itself is not deployed by the `main` merge** — see §6. Until
it's deployed and configured, these buttons will error when clicked (fails
loud in the admin UI, not silently) — that's expected until the owner
completes §7.

### Metro order flow — still quote-request only, Stripe checkout gated OFF

Every metro order today (DFW and Long Island) goes through
`src/metro/services/metroQuoteService.ts` — a **quote request**, not a
paid checkout. `src/metro/checkout/contract.ts` (a shared client/server
type contract for a future `create-metro-checkout` edge function + Stripe
Checkout flow) exists on disk as of this snapshot but is **not yet wired
to the UI** — no route, no button calls it, and the `create-metro-checkout`
edge function referenced in its own header comment does not exist yet in
`supabase/functions/`. This is in-progress, parallel work on this same
branch. Two independent gates keep it inert even once wired:
1. `contract.ts`'s own `PRICE_BOOK_UNCONFIRMED` error code fires whenever
   `metro.priceBookConfirmed === false` — true for **both** metros today
   (`src/metro/config/dallasFortWorth.ts` line 82,
   `src/metro/config/longIsland.ts` line 118). No real partner price sheet
   is signed for either metro yet (per both files' own header comments).
2. Per this task's brief, a `VITE_METRO_CHECKOUT_ENABLED` build-time flag is
   also planned as a kill switch. **As of this snapshot it does not yet
   exist in the codebase** (`grep -rn "METRO_CHECKOUT_ENABLED" src/` finds
   nothing) — it's being added by the parallel effort building the checkout
   flow. **Before merging, re-check this**: confirm (a) the flag exists,
   (b) it defaults to unset/false in `.env`/CI/the VPS, and (c) nothing in
   `src/App.tsx` routes to a metro checkout page unconditionally. If the
   flag still doesn't exist by merge time, the `priceBookConfirmed` gate
   alone is sufficient to keep checkout inert (§1 above), but you should
   not treat that as permanent — it's one signed price sheet away from no
   longer being true.

### Existing `/cart` → `/checkout` → Stripe flow: unaffected, and why

Traced through explicitly, because this is the part of the site that
handles real money and must not regress:

- **Routes unchanged**: `/cart`, `/checkout`, `/payment-success`,
  `/dashboard` (and all `/dashboard/*`), `/auth`-equivalent flows,
  `/add-to-cart`, `/quote-checkout/:quoteId`, `/stripe-test` are all still
  plain `<Route>` entries in `src/App.tsx`, byte-for-byte where the old
  code was (only new routes were *added*, not interleaved into the
  existing block).
- **None of them are prerendered.** `scripts/generate-prerender-routes.mjs`'s
  `STATIC_ROUTES` allowlist is a hand-curated list (not "everything not
  excluded") and does not include any of `/cart`, `/checkout`,
  `/payment-success`, `/dashboard`, `/add-to-cart`, `/quote-checkout`,
  `/stripe-test` — confirmed by reading the full `STATIC_ROUTES` array (23
  entries) and the file's own "Explicitly OUT of scope" doc comment, which
  names this exact exclusion list. So there is no `dist/cart/index.html`,
  no `dist/checkout/index.html`, etc. — a prerendered, stale/wrong static
  page for a dynamic or auth-gated route is exactly the failure mode this
  allowlist design prevents.
- **`try_files` still falls through correctly for them** (see above) —
  `$uri` fails (no static asset named `cart`), `$uri/index.html` fails (no
  prerendered file), falls to `/index.html`, the SPA shell, which then
  client-side-routes to the right React component exactly as it does on
  `main` today.
- **`/payment-success?session_id=…`**: the query string doesn't affect
  nginx's `try_files` matching (`$uri` is the path only), and there's no
  `location` block anywhere in `nginx/default.conf` or `nginx/redirects.conf`
  that matches `/payment-success` — it falls through the same
  `location /` block as every other unrecognized/dynamic path. Verified by
  reading both files in full; no `location = /payment-success` or
  `location ~ payment` pattern exists.
- **Supabase callbacks / auth**: nothing in this diff touches
  `src/integrations/supabase/**`, `src/contexts/**`, or any auth-related
  code path — `git diff main...feature/metro-ui --stat` shows zero changes
  under those directories.
- **Stripe edge functions untouched**: `create-payment`,
  `create-auth-hold`, `create-quote-checkout`, `verify-payment` (the
  existing checkout path) are absent from this branch's diff — only
  `supabase/functions/google-merchant-sync/**` is new, and (per its own
  implementation doc) `create-metro-checkout` is separately in-progress and
  explicitly modeled to reuse `create-auth-hold`'s pattern and to leave it
  untouched (`docs/metro/research/merchant-api-implementation.md` isn't the
  right doc for this — see `src/metro/checkout/contract.ts`'s header
  comment, which states this explicitly).

**Conclusion**: the live `/cart` → `/checkout` → Stripe flow should be
unaffected by this merge. Verify this yourself in the smoke test (§4) as a
final check, not just on the strength of this analysis.

---

## 3. Deploy-day steps

1. **Merge method**: standard PR merge (squash or merge commit, your call —
   `deploy.yml` triggers on any push to `main` regardless of merge method).
   Open the PR from `feature/metro-ui` → `main` if not already open; this
   makes `docker-build-check`'s `pull_request: branches: [main]` trigger
   run automatically as a merge check.
2. **Merge during a low-traffic window** if possible — first build after
   this merge is slower than usual (see timing estimate below) and the VPS
   is shared with the Host Hampton project.
3. **Watch the deploy**: GitHub repo → **Actions** → **Deploy** workflow →
   the run triggered by your merge commit. It SSHes to the VPS and runs
   `git reset --hard origin/main && docker compose up -d --build`.
4. **`command_timeout: 20m` in `deploy.yml`** — checked, this is the
   `appleboy/ssh-action` step timeout for the whole SSH session (build +
   deploy + health check), not a per-command timeout. Is 20 minutes enough?
   **Probably, but it's tighter than before this branch.** Rough budget for
   a from-scratch VPS build (no Docker layer cache — first build after the
   base-image change, `node:20-alpine` → `node:20-bookworm-slim`, has to
   pull the new base image and rebuild every layer):
   - `npm ci`: 1–3 min (network-dependent)
   - `npx playwright install --with-deps chromium`: 2–5 min (apt-get
     update + package installs + Chromium binary download, ~100–200MB per
     `prerender-implementation.md`'s own estimate — this step is
     **completely untested end-to-end** before `docker-build-check`'s first
     run, per that doc's own "not tested" flag)
   - `vite build`: ~10–30s
   - prerender pass (110 routes, concurrency 4): ~90–180s (was ~96s in
     this agent's Windows/local run of the underlying script, without
     Docker's I/O/CPU overhead — VPS containerized performance may differ
     either direction)
   - `docker compose up -d --build` overhead, image pull for the
     `nginx:alpine` runtime stage, etc.: 1–2 min

   **Estimated total: 6–12 minutes** for a cold build, likely leaving
   headroom under 20 minutes but not a lot if the VPS is under load from
   Host Hampton at the same time. **Recommendation**: watch this first
   post-merge deploy run live rather than merging and walking away. If it
   times out, the immediate fix is raising `command_timeout` in
   `deploy.yml` (not owned by this agent — file-ownership note: this
   agent's brief is read-only on `deploy.yml`, flagging the risk here
   rather than editing it).
5. **VPS RAM/disk**: **not verified by this agent** (no VPS SSH access
   permitted for this task). Chromium's prerender pass runs 4 concurrent
   headless browser pages (`CONCURRENCY = 4` in `prerender.mjs`), which can
   spike memory during the build stage — this happens *inside* the
   `docker build` process, competing for the VPS's RAM/CPU alongside
   whatever Host Hampton and the currently-running `mygravelguy` container
   are doing (the old container keeps serving traffic until the new one is
   up, per Docker Compose's default behavior, so there's a window of two
   containers' worth of resource usage). **Owner action**: before merging,
   `ssh hampton-vps` and check `free -h` / `df -h` once, so you know the
   headroom going in. If RAM is tight (< ~2GB free), consider adding swap
   or scheduling the merge for a moment when Host Hampton is quiet.
6. **After the Actions run shows green**, proceed to the smoke test (§4).

---

## 4. Smoke-test plan (post-deploy, ~15 min, read-only — no real orders)

Run these roughly in order. Everything here is read-only against
production; the one browser step explicitly stops before submitting
payment.

### 4a. curl checks (2 min)

```bash
# Status + title + canonical + JSON-LD presence for key routes
for path in / /dallas-fort-worth /long-island /gravel-driveways/cost /products/pea-gravel /long-island/towns/southampton; do
  echo "=== $path ==="
  curl -s -o /tmp/page.html -w 'status: %{http_code}\n' "https://mygravelguy.com${path}"
  grep -oE '<title>[^<]*</title>' /tmp/page.html
  grep -oE '<link rel="canonical" href="[^"]*"' /tmp/page.html
  grep -c 'application/ld+json' /tmp/page.html
done
```

Expect: `200`, a route-specific (non-generic) `<title>`, a canonical
matching the URL, and at least 1 JSON-LD block per route.

### 4b. Redirects (1 min)

```bash
for pair in "/delivery-info:/delivery" "/products:/shop" "/product-calculator:/calculator" \
            "/blog/gravel-vs-crushed-stone-differences:/blog/gravel-vs-crushed-stone" \
            "/locations/dallas-tx:/dallas-fort-worth"; do
  from="${pair%%:*}"; to="${pair##*:}"
  code=$(curl -s -o /dev/null -w '%{http_code}' "https://mygravelguy.com${from}")
  loc=$(curl -s -o /dev/null -w '%{redirect_url}' "https://mygravelguy.com${from}")
  echo "$from -> $code $loc (expect 301, https://mygravelguy.com${to})"
done
```

### 4c. robots / llms / sitemap (1 min)

```bash
curl -s https://mygravelguy.com/robots.txt | grep -A3 "User-agent: Googlebot"
curl -s https://mygravelguy.com/llms.txt | head -20
curl -s https://mygravelguy.com/sitemap.xml | grep -c '<loc>'
curl -s https://mygravelguy.com/sitemap.xml | grep -c '/locations/'   # expect 0
curl -s https://mygravelguy.com/sitemap.xml | grep -c 'dallas-fort-worth\|long-island'
```

### 4d. Browser pass — home / shop / product / cart (~5 min)

Do this in an actual browser, not curl:

1. Load `https://mygravelguy.com/` — confirm it renders normally (no flash
   of unstyled/duplicate content — see the hydration note in
   `prerender-implementation.md`'s Risks section for what a regression here
   would look like).
2. `/shop` → open a product → **Add to cart**.
3. Go to `/cart` → confirm the item is there, quantities work.
4. Click through to `/checkout` → confirm the Stripe Checkout page/form
   loads. **Do not submit payment / do not complete a real charge.**
   Navigate away or close the tab once the checkout page has visibly
   loaded — that's sufficient to prove the flow isn't broken.
5. Open dev tools console — confirm no new JS errors on any of the above
   pages that weren't there before this merge.

### 4e. Metro pages on mobile (~3 min)

Using a real phone or responsive dev-tools view:

1. `/dallas-fort-worth` and `/long-island` — confirm hero, category cards,
   FAQ render correctly.
2. `/long-island/towns/southampton` (or any town) — confirm town-specific
   copy/pricing shows.
3. Start the order flow (ZIP → category → variant → quantity → day →
   details) far enough to see the price summary — **do not submit** (it's
   a quote request, not a charge, but there's no reason to create test
   leads in the real inbox during a smoke test; stop before the final
   submit button).

### 4f. Google Rich Results Test (3 URLs)

Manually run https://search.google.com/test/rich-results against:
- `https://mygravelguy.com/dallas-fort-worth`
- `https://mygravelguy.com/products/pea-gravel`
- `https://mygravelguy.com/gravel-driveways/cost`

Confirm the JSON-LD parses with no errors and the expected schema types
are detected.

### 4g. Google Search Console — URL inspection

Manually inspect 2–3 of the new URLs (`/dallas-fort-worth`, `/long-island`,
one guide page) in GSC's URL Inspection tool. Request indexing if GSC shows
them as not-yet-crawled. This is a manual GSC UI action, not scriptable
here.

### 4h. IndexNow submission — only after 4a–4g all pass

```bash
node scripts/seo/indexnow-submit.mjs
```

Read the script first to confirm what URL list it submits and to which
search engines before running it against production — this notifies search
engines of the new/changed URLs, so it should be the **last** step, after
you've confirmed the content being submitted is actually correct (4a–4g).

---

## 5. Rollback plan

### Fastest path: revert the merge commit on `main`

```bash
git checkout main
git pull
git log --oneline -5            # find the merge commit SHA
git revert -m 1 <merge-commit-sha>
git push origin main
```

Pushing the revert to `main` triggers `deploy.yml` again automatically —
same auto-deploy path as the original merge, just deploying the reverted
state. This is the recommended rollback path: it goes through the same
tested pipeline as forward deploys, rather than a manual VPS command.

### Previous good `main` SHA

`3c2fc42` (`ci: add auto-deploy workflow (SSH to VPS; advisory bounded
health)`) — confirmed via `git log main` — is `main`'s HEAD as of this
writing, immediately before this merge. If a revert commit is awkward for
any reason, `git reset --hard 3c2fc42 && git push --force origin main` is
the nuclear alternative — **avoid force-pushing `main` unless the revert
path is somehow blocked**; it rewrites history other people/CI may have
already built on.

### VPS-only rollback — and why it doesn't stick

```bash
ssh hampton-vps
cd /opt/mygravelguy
git reset --hard 3c2fc42
docker compose up -d --build
```

**This does not survive the next deploy.** `deploy.yml`'s script runs `git
fetch --all --prune && git reset --hard origin/main` on every run — so if
anything pushes to `main` again (including an unrelated future change)
before you've also fixed `main` itself, the VPS snaps back to whatever
`origin/main` says, undoing this manual rollback. Use this only as an
immediate stop-the-bleeding measure while you also do the `git revert` on
`main` in parallel — treat it as a bridge, not a fix.

### Expected rollback time

- `git revert` + push: ~1 minute of owner time, then the same 6–12 minute
  deploy-workflow build time as any other deploy (§3) — call it **~15
  minutes total** to a fully rolled-back, redeployed state.
- VPS-only manual rollback: faster to *apply* (no CI wait — just the
  `docker compose up -d --build` time, same ~6-12 min build), but must be
  paired with the `main`-branch revert or it will un-rollback itself on the
  next push.

### What's NOT rolled back automatically by either path

- **Supabase edge functions** — deployed separately via `supabase functions
  deploy`, not part of the `git reset`/Docker rebuild. If
  `google-merchant-sync` (or, later, `create-metro-checkout`) was deployed
  as part of this rollout (see §6 — it shouldn't be, as part of *this*
  merge), rolling back the web app does **not** un-deploy it. Roll back an
  edge function by deploying the previous version's code, same as any other
  deploy.
- **Google Merchant Center data** — any product/region/inventory data
  pushed via `google-merchant-sync` (once it's actually live and used) is
  not undone by a git rollback. Manual cleanup in Merchant Center if
  needed.
- **IndexNow submissions** (§4h) — already sent to search engines, can't be
  un-sent. Low risk either way (IndexNow just requests a re-crawl).
- **Search Console** — any manual "request indexing" actions (§4g) aren't
  reversible, and don't need to be; harmless either way.

---

## 6. Edge functions — separate, owner-approved steps

**Nothing in the `main` merge itself deploys any Supabase edge function.**
The web app deploy (`deploy.yml`) only rebuilds the Docker/nginx container;
edge functions are deployed independently via the Supabase CLI, and the
`google-merchant-sync` function's own implementation doc explicitly states
"no commits/pushes/deploys made by this agent."

New/changed functions on this branch, each requiring an **explicit,
separate, owner-approved deploy step** (not automatic, not part of merging
to `main`):

1. **`google-merchant-sync`** (new, complete as of this branch) — see §7
   below for the full setup/deploy sequence. Do not deploy until the
   secrets in §7 are set; the function will error without them, but
   there's no reason to deploy it before you're ready to actually use it.
2. **`create-metro-checkout`** (referenced by `src/metro/checkout/contract.ts`,
   does **not yet exist** in `supabase/functions/` as of this snapshot —
   being built in parallel on this same branch by a separate effort). Do
   not deploy this until it exists, is reviewed, and the
   `VITE_METRO_CHECKOUT_ENABLED` gate (§2) is confirmed wired correctly —
   this one directly gates real Stripe charges for metro orders once both
   metros' price books are confirmed.

---

## 7. Merchant API setup steps (for the owner)

Source docs: `docs/metro/research/merchant-api-implementation.md` (the
implementation notes — read this in full first, it's thorough) and
`docs/metro/research/ai-ads-and-google-shopping.md` (the original research/
rationale doc). Doc URLs below verified live via web search on 2026-09-28
(current as of this writing; Google's docs restructure periodically —
re-check if a link 404s).

### 7a. Why this is time-sensitive

Content API for Shopping v2.1 (the *old* integration this replaces) is
mid-sunset: **progressive errors started 2026-09-01, full shutdown
2026-08-18** per Google's public migration guidance — i.e., as of today
(2026-09-28) the old API is already in its degrading window, not a future
concern. This doesn't block the `main` merge (the old client code
`merchantCenter.ts` is kept in place, unused, marked `@deprecated` — not
deleted, not called by any UI anymore), but it does mean the Merchant API
migration itself (this section) shouldn't sit indefinitely once the web
app changes are live.

### 7b. GCP + Merchant Center setup

1. **Confirm/claim the Merchant Center account** for `mygravelguy.com` if
   not already done.
2. **Create or reuse a Google Cloud project**, then **enable the Merchant
   API** (not "Content API for Shopping") in Cloud Console → APIs &
   Services. See [Merchant API — Get started](https://developers.google.com/merchant/api/guides/quickstart)
   and [Overview](https://developers.google.com/merchant/api/guides/quickstart/overview).
3. **Register as a developer** — a one-time step linking the Cloud project
   to your primary Merchant Center account (assigns an `API_DEVELOPER` role
   to a Merchant Center user). See
   [Register as a developer](https://developers.google.com/merchant/api/guides/quickstart/registration).
   This is a **separate step from #2** — a common mistake (noted in both
   Google's docs and this repo's own implementation notes) is enabling the
   API but skipping registration, or vice versa.
4. **Create a service account** in that Cloud project (IAM & Admin →
   Service Accounts) and generate a JSON key. See
   [Set up authentication](https://developers.google.com/merchant/api/guides/quickstart/authentication).
5. **Grant the service account access to the Merchant Center account**:
   Merchant Center → Settings → Account access → Add user → the service
   account's `...@...iam.gserviceaccount.com` email → Admin or Standard
   access.

### 7c. Supabase secrets (exact names, from reading `supabase/functions/google-merchant-sync/index.ts`)

```bash
supabase secrets set \
  GOOGLE_MERCHANT_ACCOUNT_ID=<numeric Merchant Center account ID> \
  GOOGLE_SERVICE_ACCOUNT_JSON="$(cat service-account.json)" \
  GOOGLE_MERCHANT_DATA_SOURCE_ID=<primary product data source ID> \
  GOOGLE_MERCHANT_SYNC_ADMIN_SECRET=<optional — only for a future non-interactive/cron caller>
```

`SUPABASE_URL` / `SUPABASE_ANON_KEY` are read by the function too, but
those are Supabase-platform-injected defaults, not something to set by
hand.

### 7d. Deploy + dry-run first

```bash
# 1. Regenerate the price book after any pricing/metro/zone change:
node scripts/metro/export-price-book.mjs

# 2. Review the diff — it's generated, but treat changes like a migration:
git diff supabase/functions/google-merchant-sync/price-book.json

# 3. Deploy the function (separate from, not part of, the main-branch web deploy):
supabase functions deploy google-merchant-sync

# 4. Dry run — does NOT call Google, returns the payloads it *would* send:
curl -X POST https://losrkjvrcambvgijfism.supabase.co/functions/v1/google-merchant-sync \
  -H "Authorization: Bearer <your Supabase user JWT>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true, "metroSlug": "long-island"}'
```

Long Island is the smaller metro (fewer zones) — start there.

### 7e. Sandbox/test verification of `[UNVERIFIED]` field names before going live

`merchantApi.ts` and `googleAuth.ts` were built from documentation review
only — the implementing agent was explicitly barred from making live
Google API calls. Flagged `[UNVERIFIED]` items to confirm against a real
sandbox/test Merchant Center account before ever setting `dryRun: false`:

- **`google_product_category`** — the taxonomy path strings in
  `priceBookExport.ts` (e.g. `"Home & Garden > Lawn & Garden > Landscape &
  Garden Rocks & Stones"`) were not checked against Google's live taxonomy
  file. Verify:
  ```bash
  curl -s https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt \
    | grep -iE "rocks|stones|mulch|soil|compost"
  ```
- **Minimum-order-quantity attribute name** on `ProductInput` — guessed as
  `minimumOrderQuantity: { minOrderQuantity }` from the plain feed-spec
  attribute name, not confirmed against the Merchant API's actual REST
  shape. See [Add regional information to online products](https://developers.google.com/merchant/api/guides/inventories/add-regional-inventory)
  and [Region resource reference](https://developers.google.com/merchant/api/reference/rpc/google.shopping.merchant.accounts.v1alpha/Types/Region).
- **Availability string format** — `"in stock"`/`"out of stock"` (space)
  vs. `"in_stock"`/`"out_of_stock"` (underscore) — Google's own docs are
  inconsistent between the feed spec and REST API per the implementation
  doc; confirm against a real response.
- **OAuth scope** (`https://www.googleapis.com/auth/content`) — high
  confidence unchanged from Content API, not re-confirmed live.
- **Postal-code-per-region quota** — research doc found Google's own docs
  disagree (25,000 vs 50,000); irrelevant at ~170 total ZIPs across 2
  metros today, check before scaling further.
- **Region eligibility minimums** (confirmed via web search, 2026-09-28,
  not in the original implementation doc): a Merchant API region must
  cover **at least 3 sq km and 1,000 people** per
  [Regional availability and pricing](https://support.google.com/merchants/answer/14644124).
  DFW/Long Island zones are large enough this is very unlikely to be an
  issue, but it's a real rejection condition worth knowing about if a
  future metro's zones are drawn much smaller.

**Do the first live (non-dry-run) call against a sandbox/test account**,
scoped to one region + one product + one regional-inventory call by hand,
read the actual response, and fix any field-name mismatches before running
`pushAll()` against the real production Merchant Center account.

### 7f. DFW zones (ZIP-based), regional inventory, and when to flip availability

- Zones are ZIP-set-based (`src/metro/config/data/dfwZips.ts` /
  `src/metro/config/data/*.ts` for Long Island) — this is the same
  source-of-truth the storefront's own pricing engine
  (`src/metro/lib/pricing.ts`) uses, by design, so the Merchant API
  `regions` and the storefront's own zone lookups can't drift apart (see
  the implementation doc §8 point 6 for why this matters for Google's
  price/landing-page consistency policy).
- **Every product is `"availability": "out_of_stock"` today, by design** —
  `buildPriceBook()` only marks `in_stock` when
  `metro.status === 'live'` **and** `metro.priceBookConfirmed === true`.
  Both DFW (`status: 'coming-soon'`) and Long Island (`status: 'pilot'`)
  currently have `priceBookConfirmed: false`.
- **Do not flip availability by hand-editing `price-book.json`.** It's a
  generated artifact (`node scripts/metro/export-price-book.mjs`). The only
  correct way to go live for a metro is: get a signed partner price sheet
  → a human updates `priceBookConfirmed: true` in
  `src/metro/config/dallasFortWorth.ts` or `longIsland.ts` (not this
  agent's file to edit) → regenerate the price book → review the diff →
  redeploy the edge function.
- Landing-page price parity (§8 point 6 of the implementation doc): today's
  metro pages render one price regardless of visitor ZIP (no server-side
  ZIP detection yet), matching the base `ProductInput` "starting at" price
  this function submits — consistent for now. Once/if the storefront gains
  ZIP-aware server-rendered pricing, the regional inventory price a
  Shopping ad shows for a zone must be kept in sync with what that zone's
  ZIP sees on the landing page — plan any such future change and the
  Merchant API region definitions from the same zone/ZIP source together.

---

## Appendix: sources checked for this document

- `.github/workflows/deploy.yml`, `.github/workflows/docker-build-check.yml`
- `Dockerfile`, `docker-compose.yml`, `nginx/default.conf`, `nginx/redirects.conf`, `.dockerignore`
- `package.json`, `.env`, `.gitignore`
- `scripts/prerender/prerender.mjs`, `scripts/generate-prerender-routes.mjs`
- `docs/metro/research/prerender-implementation.md`, `docs/metro/research/merchant-api-implementation.md`, `docs/metro/research/ai-ads-and-google-shopping.md`
- `src/App.tsx`, `src/metro/checkout/contract.ts`, `src/metro/config/dallasFortWorth.ts`, `src/metro/config/longIsland.ts`
- `supabase/functions/google-merchant-sync/index.ts`
- `git diff main...feature/metro-ui --stat` (2026-09-28, `main` HEAD `3c2fc42`)
- Local, read-only: `npx vitest run src/metro src/content src/services/googleShopping` (110/110 passed), `npx tsc --noEmit -p tsconfig.app.json` (19 pre-existing, unrelated errors)
- Web (2026-09-28): Merchant API quickstart/registration/authentication docs, Content API for Shopping sunset dates, Merchant API regions/regionalInventory eligibility requirements
