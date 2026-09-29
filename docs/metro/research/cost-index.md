# Gravel Driveway Cost Index — build report (agent C2-COST-INDEX)

Route: `/gravel-driveways/cost-index`. Built per `aeo-plan.md` §3.5, with the orchestrator's
gate override: this ships now as a **market** price index sourced from the DFW
competitor price research (independent of MGG's own price book, which is still
`priceBookConfirmed: false`), plus a separately-labeled MyGravelGuy live-estimate column.

## What was built

| File | Purpose |
|---|---|
| `scripts/metro/build-cost-index.mjs` | Regenerates the two outputs below from the DFW research data. Deterministic given the same inputs (only the `generatedAt` header timestamp changes run to run). |
| `src/content/guides/costIndex/costIndexData.ts` | **Generated.** Typed `costIndexRows`/`costIndexMeta` — per-material yard-class and broker-delivered `{n, min, median, max}`, plus sample date range and seller counts. Do not hand-edit. |
| `public/data/gravel-driveway-cost-index-dfw-2026-q3.csv` | **Generated.** Aggregated-stats CSV (22 rows, no seller-level PII) — this is the file the page's `Dataset.distribution.contentUrl` points to. |
| `src/content/guides/costIndex/content.ts` | Page copy. The direct answer, FAQs and "how we know" line interpolate numbers computed at module-load time from `costIndexData.ts` + `src/metro/lib/pricing.ts` — never hand-typed dollar figures. |
| `src/content/guides/costIndex/schema.ts` | `Dataset` + `Article` JSON-LD builders, local to this page (does not touch the shared `src/content/guides/schema.ts`, which this agent doesn't own). |
| `src/content/guides/costIndex/costIndex.test.ts` | 16 tests: direct-answer word count, title/description length, row invariants (`min ≤ median ≤ max`, `n ≥ 1`), CSV existence + row-count match, Dataset JSON-LD required/recommended fields. |
| `src/pages/guides/GravelDrivewayCostIndexPage.tsx` | The page. Default export, so agent C1's lazy route resolves. |

## Method (summary — full detail in `dfw-pricing-v2.md`)

- **Sample:** 27 DFW-area sellers surveyed 2026-09-27–2026-09-28 (17 physical yards/
  producers, 9 online brokers/marketplaces, plus pickup-only and big-box sellers excluded
  from every median). Read live from `docs/metro/research/data/dfw/prices-final.csv` by
  the build script — not hardcoded.
- **Two price columns, never blended:**
  - **Yard-class** — physical DFW yard/producer counter price; delivery (if any) is a
    separate line item.
  - **Broker-delivered** — online broker/marketplace price with delivery already
    included (`delivered_flag = true` rows only — material-only broker rows are excluded
    from this figure per `dfw-pricing-v2.md`'s own stated rule, to avoid understating
    real broker cost).
- **MyGravelGuy column** — computed live on every page load via
  `fromPricePerUnit(dallasFortWorth, category, slug, 10)` from `src/metro/lib/pricing.ts`
  (same engine used at checkout), labeled "(estimated)" because DFW's price book is not
  yet `priceBookConfirmed`. This column will update automatically once real DFW pricing
  lands, with no edits needed to this page.
- **22 materials**, all of DFW's current catalog (`catalog-proposal-v2.json`), grouped
  gravel / sand / mulch / soil.
- **Long Island reference table** (separate section, not part of the Dataset schema):
  4 representative materials' real `nodePricePerUnit` values from
  `src/metro/config/longIsland.ts` (per that file's own header comment, "2025–26 medians
  observed at ELM" — i.e. real prices at MyGravelGuy's actual Long Island fulfillment
  partner, Eastern Landscape & Mason Supply). Explicitly labeled as a single-yard
  reference, not a multi-seller market index like the DFW table, since it has no `n`
  seller-count concept.
- **Caveats surfaced on-page** (from `dfw-pricing-v2.md`'s own "Caveats" section, carried
  through as a per-row `note` in `costIndexData.ts`): `concrete-sand` (thin broker sample,
  the one SKU that doesn't clear "below broker"), `brown-dyed` (zero broker-delivered
  comparison data), `bank-sand` (zero yard-class rows this pass, lowest-confidence
  number), `river-rock` and `decomposed-granite` (wide-but-legitimate yard spreads).

## Schema

- **`Dataset`** (`costIndexDatasetJsonLd`): `name`, `description` (132 chars — reuses the
  page's meta description, well within Google's required 50–5000 range), `url`, `creator`/`publisher` (Organization,
  MyGravelGuy), `license` (CC BY 4.0 URL), `temporalCoverage` (`2026-09-27/2026-09-28`,
  ISO 8601 interval), `spatialCoverage` (`Place`, "Dallas–Fort Worth, TX"),
  `variableMeasured` (one `PropertyValue` per material × unit — 22 entries), `distribution`
  (`DataDownload`, `contentUrl` → the CSV, `encodingFormat: text/csv`), `dateModified`.
- **`Article`** (`costIndexArticleJsonLd`): headline/description/author (Eastern
  Landscape & Mason Supply yard team — same E-E-A-T convention as the rest of the Gravel
  Driveway Hub)/publisher/dates, matching `src/content/guides/schema.ts`'s
  `guideArticleJsonLd` shape for consistency.
- **`FAQPage`**: reuses the existing shared `faqJsonLd` from
  `src/metro/components/marketing/FaqSection.tsx` — 8 FAQs.
- **`BreadcrumbList`**: reuses the existing shared `breadcrumbJsonLd` from
  `src/metro/components/shared/jsonLd.ts`.

### Validation against Google's Dataset guidance

Checked against
https://developers.google.com/search/docs/appearance/structured-data/dataset (fetched
2026-09-28):

- **Required** (`name`, `description` 50–5000 chars) — satisfied.
- **Recommended, populated:** `url`, `creator`, `license`, `distribution` (with required
  `contentUrl` + recommended `encodingFormat`), `temporalCoverage`, `spatialCoverage`,
  `variableMeasured`, `keywords`.
- **Recommended, intentionally NOT populated:**
  - `identifier` — no DOI/compact identifier exists for this dataset; inventing one would
    be worse than omitting it.
  - `citation` — Google's own guidance is that this property names *related academic
    publications that cite the dataset*, not "how to cite this dataset yourself." The
    on-page "How to cite this index" block (with a suggested citation string and the CC
    BY 4.0 license) covers the latter as visible content instead, per this task's brief —
    it is deliberately not encoded into the `citation` JSON-LD property to avoid
    misusing the field.
  - `sameAs`, `version`, `funder` — no real values exist for any of these (no external
    canonical copy, no formal versioning scheme yet beyond the quarterly refresh date, no
    funder distinct from MyGravelGuy itself) — omitted rather than filled with a
    placeholder.

## Refresh procedure (quarterly)

1. Re-run/refresh the DFW seller survey that produces
   `docs/metro/research/data/dfw/prices-final.csv` (own scrape + owner-supplied CSV +
   verified external-LLM rows — see `dfw-pricing-v2.md` for that pipeline) and
   `slug-stats.json` (`scripts/competitors/merge-prices.mjs`).
2. Run `node scripts/metro/build-cost-index.mjs` from the repo root. This regenerates
   `src/content/guides/costIndex/costIndexData.ts` and
   `public/data/gravel-driveway-cost-index-dfw-2026-q3.csv` from the refreshed research
   data. No other file needs to change — `content.ts`'s direct answer, FAQs and worked
   example all recompute automatically from the new data at next build/page-load.
3. Bump `LAST_UPDATED` in `src/content/guides/costIndex/content.ts` to the refresh date
   (this drives the visible "Last updated" line and the `Article`/`Dataset.dateModified`
   fields) — the one manual edit in the refresh cycle.
4. If a new quarter's CSV filename convention is wanted (e.g.
   `gravel-driveway-cost-index-dfw-2026-q4.csv`), update `CSV_OUTPUT_PATH`/`CSV_PUBLIC_URL`
   in the build script and the corresponding path check in `costIndex.test.ts`.
5. Re-run `npx vitest run src/content/guides/costIndex` and re-check the Dataset JSON-LD
   test still passes.

## Verification performed

- `npx vitest run src/content` — 60/60 passing (includes this asset's 16 tests plus the
  existing 44 in the Gravel Driveway Hub suite, untouched).
- `npx tsc --noEmit -p tsconfig.app.json` — no new errors; all pre-existing errors are in
  unrelated files (`OrderDetailModal.tsx`, `DeliveryConfirm.tsx`, `MarketMaterialPage.tsx`,
  `CrushedStoneLanding.tsx`, `metro/checkout/*.test.ts`) untouched by this task.
- `npx eslint` on every file this agent owns — clean.
- Rendered `GravelDrivewayCostIndexPage` in an isolated vitest + `@testing-library/react`
  + `MemoryRouter` + `HelmetProvider` smoke test (not committed — agent C1's route in
  `App.tsx` didn't exist yet at build time, so this was the closest available check per
  the working-rules fallback): renders without crashing, all 5 tables present (4 DFW
  category tables + 1 Long Island table), direct answer/FAQ/citation content all present.
  Once C1's route lands, a `npx vite --port 8083` visual check is still worth doing.
- Did not run `npm run build` or `npm run build:prerender` — no `public/sitemap.xml`
  changes to revert.

## Headline numbers (computed, not hand-typed)

For the worked example (12×50 ft / 600 sq ft, 4" deep, #57 crushed limestone ≈ 10.5
tons), computed live from `costIndexData.ts` + `src/metro/lib/pricing.ts`:

- DFW yard-class median: **$675**
- DFW broker-delivered median: **$888**
- MyGravelGuy live estimate: **$860** (estimated, pending confirmed DFW pricing)

These will change automatically if the DFW catalog, `premiumRate`, or zone `loadCost`
values change, or after the next quarterly data refresh — nothing in `content.ts` or the
page component needs to be touched for that to happen.
