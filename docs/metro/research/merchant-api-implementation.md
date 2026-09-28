# Google Merchant API sync — implementation notes

_Status: implementation complete on branch `feature/metro-ui`; no commits/pushes/deploys made by this agent, and no live Google API calls were made in building this (per this task's operating constraints). Author: MERCHANT-FEED engineer agent, 2026-09-28._

**How to read this document** (same convention as `ai-ads-and-google-shopping.md`, the research doc this implementation is built from):
- **[FACT]** — verifiable, sourced to an official page fetched by the prior research pass, or a live test run in this session (vitest/tsc/eslint/the export script — all of which stayed entirely local, no Google calls).
- **[INFERENCE]** — a design decision this agent made, not guaranteed to be Google's own recommendation.
- **[UNVERIFIED]** — a request/response shape or field name built from documentation review, not confirmed against a live API call, because this agent was explicitly barred from calling live Google APIs. Flagged everywhere it appears; do not treat as load-bearing until a human runs one real dry-run→live call against a sandbox account.

---

## 1. Why this exists

`docs/metro/research/ai-ads-and-google-shopping.md` (Part B) found three independent problems with the previous integration:
1. `src/services/googleShopping/merchantCenter.ts` calls Content API for Shopping v2.1 (`shoppingcontent.googleapis.com`), which began progressive errors on 2026-09-01 and is heading to a blanket HTTP 410.
2. `src/services/googleShopping/feedGenerator.ts` computes one flat national price with a hardcoded 3-ton minimum — there is no metro/zone concept anywhere in the old pipeline, which structurally cannot represent MGG's real "price varies by delivery zone" model.
3. `GoogleShoppingManager.tsx` held a live Merchant Center OAuth access token in React state, readable via devtools by anyone with access to the admin page.

This implementation replaces all three: a new Merchant API-based edge function (`google-merchant-sync`) holds the Google credential server-side, reads a pre-built, metro/zone-aware price book, and syncs Google's `regions` + `regionalInventories` primitives — the sanctioned exception to Google's "never vary price by location" policy, and exactly the "metro → zone (ZIP set) → regional price" shape this project already uses internally (`src/metro/**`).

## 2. Architecture

```
src/metro/config/**  (METRO-CORE's source of truth: metros, zones, ZIPs, catalog, prices)
        │
        ▼
src/metro/lib/pricing.ts  (quote() — the same delivered-price engine the storefront uses)
        │
        ▼
src/services/googleShopping/priceBookExport.ts   (buildPriceBook() — pure, testable)
        │  (bundled + executed by scripts/metro/export-price-book.mjs via esbuild)
        ▼
supabase/functions/google-merchant-sync/price-book.json   ← generated artifact, NOT hand-edited
        │  (read by the edge function at request time)
        ▼
supabase/functions/google-merchant-sync/index.ts  (Deno edge function)
        │  ├─ admin auth (check_user_admin_status RPC, or shared secret header)
        │  ├─ merchantApi.ts — builds Region / ProductInput / RegionalInventory payloads
        │  ├─ googleAuth.ts — mints a Google OAuth2 access token from a service account
        │  └─ dryRun (default) → returns payloads; dryRun:false → pushes to Google
        ▼
Google Merchant API (merchantapi.googleapis.com)
        │
        ▼
src/components/admin/GoogleShoppingManager.tsx  (admin UI: "Dry run sync" / "Sync to Merchant Center")
        via src/services/googleShopping/merchantApiClient.ts (supabase.functions.invoke wrapper)
```

**Why a static `price-book.json` instead of the edge function importing `src/metro/**` directly at request time:** Deno *can* resolve plain relative-import TypeScript files outside its own function directory (there are no bare npm specifiers anywhere in `src/metro/**`), so a direct cross-import would technically work. This implementation deliberately did **not** do that. The JSON file is a frozen, versioned data contract between the Vite/React app and the Deno function — a future change to `src/metro/types.ts` (e.g. adding a new field a frontend component needs) can't silently change the edge function's behavior without a regeneration + review step (`node scripts/metro/export-price-book.mjs` + a diff on the JSON) in between. `supabase/functions/google-merchant-sync/types.ts` duplicates the minimal shape by hand for this reason — it is not generated, and the fields are locked down to only what the sync path needs.

## 3. Files

| File | Role |
|---|---|
| `src/services/googleShopping/priceBookExport.ts` | Pure TS: `buildPriceBook()`. No React, no Deno API — importable by both vitest and the esbuild-bundled export script. |
| `src/services/googleShopping/priceBookExport.test.ts` | 13 vitest cases covering shape, id stability, zone coverage, basePrice-is-lowest-zone, availability gating, custom quantity, link format, category mapping. |
| `scripts/metro/export-price-book.mjs` | Bundles `priceBookExport.ts` with esbuild (already a transitive devDependency via Vite — no `tsx` dependency was added, since this agent may not touch `package.json`), runs `buildPriceBook()`, writes the JSON. |
| `supabase/functions/google-merchant-sync/price-book.json` | Generated output — regenerate after any metro/pricing change, before deploying. |
| `supabase/functions/google-merchant-sync/types.ts` | Local type mirrors of the price-book shape + Merchant API payload shapes. |
| `supabase/functions/google-merchant-sync/googleAuth.ts` | RFC 7523 JWT-Bearer service-account auth → Google OAuth2 access token (uses `deno.land/x/djwt` for RS256 signing). |
| `supabase/functions/google-merchant-sync/merchantApi.ts` | Builds Region/ProductInput/RegionalInventory payloads from the price book; live-call helpers with retry/backoff on 429/5xx. |
| `supabase/functions/google-merchant-sync/index.ts` | HTTP handler: CORS, admin auth, dryRun/live branching, summary response. |
| `src/services/googleShopping/merchantApiClient.ts` | Browser-side wrapper: `runMerchantSyncDryRun()` / `runMerchantSyncLive()`, calling the edge function via `supabase.functions.invoke`. |
| `src/services/googleShopping/index.ts` | Barrel file — old exports kept (not deleted), new ones added, deprecation notice in comments. |
| `src/services/googleShopping/feedGenerator.ts`, `merchantCenter.ts` | Kept for reference only; `merchantCenter.ts` now carries a `@deprecated` header pointing at this new path. Only lint/type cleanup was applied (no `any`, no unused `let`) — no behavior changes. |
| `src/components/admin/GoogleShoppingManager.tsx` | Rewritten: no client-side token/merchant-ID fields. New "Merchant API Sync" tab with Dry run / Sync buttons; legacy XML feed preview kept as a separate, clearly-labeled tab (still client-side, still no Google calls). |

## 4. Price book shape — sample (3 products + 1 region, DFW)

_Regenerated 2026-09-28 (final step of this task) after METRO-CORE's DFW pricing update landed — figures below reflect the live `price-book.json`, not the earlier draft prices this doc originally shipped with._

Trimmed for length (the full DFW Core zone has 150 ZIPs; each product actually carries one `zonePrices` entry per zone, not just the first):

```json
{
  "regionSample": {
    "slug": "dfw-core",
    "name": "DFW Core (Dallas & Tarrant)",
    "minUnits": 3,
    "zipCount": 150,
    "zipsSample": ["75001", "75006", "75019", "75038", "75039"]
  },
  "products": [
    {
      "id": "mgg-dallas-fort-worth-gravel-pea-gravel",
      "metroSlug": "dallas-fort-worth",
      "categorySlug": "gravel",
      "variantSlug": "pea-gravel",
      "unit": "ton",
      "referenceQuantity": 10,
      "title": "Pea Gravel (3/8\") — 10 tons delivered in Dallas–Fort Worth",
      "link": "https://mygravelguy.com/dallas-fort-worth/gravel-delivery?variant=pea-gravel",
      "availability": "out_of_stock",
      "googleProductCategory": "Home & Garden > Lawn & Garden > Landscape & Garden Rocks & Stones",
      "basePrice": 1055,
      "zonePrices": [
        { "zoneSlug": "dfw-core", "referenceQuantityPrice": 1055, "minOrderQuantity": 3, "minOrderPrice": 390, "pricePerUnit": 105.5 },
        { "zoneSlug": "dfw-north", "referenceQuantityPrice": 1080, "minOrderQuantity": 3, "minOrderPrice": 410, "pricePerUnit": 108 },
        { "zoneSlug": "dfw-outer", "referenceQuantityPrice": 1130, "minOrderQuantity": 3, "minOrderPrice": 450, "pricePerUnit": 113 }
      ]
    },
    {
      "id": "mgg-dallas-fort-worth-gravel-57-limestone",
      "variantSlug": "57-limestone",
      "title": "#57 Crushed Limestone — 10 tons delivered in Dallas–Fort Worth",
      "basePrice": 1435,
      "availability": "out_of_stock"
    },
    {
      "id": "mgg-dallas-fort-worth-gravel-flex-base",
      "variantSlug": "flex-base",
      "title": "Flex Base / Road Base — 10 tons delivered in Dallas–Fort Worth",
      "basePrice": 1375,
      "availability": "out_of_stock"
    }
  ]
}
```

Every product in both metros currently comes out `"availability": "out_of_stock"` — **by design**: `buildPriceBook()` only marks a product `in_stock` when the metro's `status === 'live'` **and** `priceBookConfirmed === true`. As of this writing both `dallasFortWorth` and `longIsland` have `priceBookConfirmed: false` (placeholder pricing, per METRO-CORE's own file-header comments) — publishing a real-looking price to Google Shopping before a partner price sheet is signed would be a policy violation (price/landing-page mismatch) waiting to happen, not just an internal inconsistency. **Do not flip a metro to `in_stock` by editing the price book by hand** — that flag should only ever flow from `priceBookConfirmed` in `src/metro/config/*.ts`, which is METRO-CORE's file, not this agent's.

The reference quantity defaults to 10 units (tons or yards, per category) — a fixed "10-unit load" bundle, because `unit_pricing_measure` doesn't support "ton" or "cubic yard" as a unit (research doc B2) and the storefront itself sells by delivered load, not by a Google-recognized per-unit price. Each zone's `minOrderPrice`/`minOrderQuantity` is also carried, in case a future iteration wants a second, smaller-bundle product line.

## 5. `google_product_category` — flagged as unverified

`GOOGLE_PRODUCT_CATEGORY` in `priceBookExport.ts` maps each of the four material categories to a full taxonomy **path string** (not a numeric ID):

| Category | Path used |
|---|---|
| gravel, sand | `Home & Garden > Lawn & Garden > Landscape & Garden Rocks & Stones` |
| mulch | `Home & Garden > Lawn & Garden > Mulch` |
| soil | `Home & Garden > Lawn & Garden > Compost & Soil` |

**[UNVERIFIED]** These were not fetched from Google's live taxonomy file in this session (per the "never call live Google APIs" constraint). The research doc already flagged the old repo's numeric IDs (`1279`/`1278`) as unconfirmed (B4 #7); this implementation doesn't repeat that mistake by inventing a numeric ID, but the path text itself still needs a one-time check. Before the first live sync:

```bash
curl -s https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt \
  | grep -iE "rocks|stones|mulch|soil|compost"
```

Update `GOOGLE_PRODUCT_CATEGORY` (and re-run the export script) with whatever the current exact path text is. Using the human-readable path rather than only a numeric ID was a deliberate choice: Merchant API's `googleProductCategory` attribute accepts the path string, and a stale-but-close string degrades more gracefully at Google's review stage than a wrong numeric ID would.

## 6. Merchant API request shapes — flagged as unverified

`merchantApi.ts` builds three payload types. All three carry the same caveat: **built from the Merchant API guide pages the AI-ADS+SHOPPING research agent fetched directly** (regions, products/ProductInput vs Product, `accounts.products.regionalInventories` — see the research doc's Appendix sources log), **not re-verified against a live call or the current REST reference in this session.**

- `POST /accounts/v1/accounts/{account}/regions?regionId={id}` — one per metro zone, `postalCodeArea.postalCodes` built from `dfwZips.ts`/the LI zone lists.
- `POST /products/v1/accounts/{account}/productInputs:insert?dataSource=...` — one per (metro, category, variant); base price = the metro's lowest-zone reference price ("starting at").
- `POST /inventories/v1/accounts/{account}/products/{productId}/regionalInventories:insert` — one per (product, zone), carrying that zone's real delivered price.

Specific items flagged **[UNVERIFIED]** inside the code (see the file header comments in `merchantApi.ts` / `googleAuth.ts`):
- The exact JSON attribute name for minimum-order-quantity on a `ProductInput` (`minimumOrderQuantity: { minOrderQuantity }` is a guess based on the feed-spec attribute name from the research doc's B2; Merchant API's actual attribute name was not confirmed).
- Whether availability strings should be `"in stock"`/`"out of stock"` (space-delimited, as used here, matching Content API's REST JSON convention) vs. `"in_stock"`/`"out_of_stock"` (underscore, as used in the plain feed spec) — Google's own docs are inconsistent about this between the feed spec and the REST API.
- The OAuth scope (`https://www.googleapis.com/auth/content`) — high confidence this is unchanged from Content API, but not re-confirmed against `developers.google.com/merchant/api/guides/quickstart` live.
- The reported postal-code-per-region quota (research doc says Google's own docs disagree, 25,000 vs 50,000) — irrelevant at 2 metros / ~170 total ZIPs today, but check before scaling to metro 10+.

**Before flipping `dryRun: false` for the first time**: run one region, one product, and one regional-inventory call by hand (or with `metroSlug` scoped to Long Island's smallest zone) against a Merchant Center **sandbox/test account**, read the actual response, and fix any field-name mismatches this flags. Do not run the first live call against the production Merchant Center account.

## 7. Auth model

**Admin gating (who can trigger a sync):** two paths, either sufficient —
1. A Supabase user JWT whose email passes `check_user_admin_status` (the same RPC `useAuth.ts`/`DashboardLayout.tsx` already use to gate `/dashboard`) — this is what the admin UI uses.
2. A shared secret in the `x-merchant-sync-secret` header, matched against the `GOOGLE_MERCHANT_SYNC_ADMIN_SECRET` env var, for a future non-interactive caller (cron/CLI). Note the Supabase gateway's own `verify_jwt` (default `true`, unchanged in `supabase/config.toml` — this function was **not** added to the `verify_jwt = false` list) still requires *some* valid Supabase JWT on every call regardless of path; a cron job would pass `Authorization: Bearer <anon or service-role key>` to satisfy that platform-level check, then the shared secret for the application-level admin check.

**Google auth (how the function talks to Google):** a Google Cloud service account's JSON key (`GOOGLE_SERVICE_ACCOUNT_JSON` secret) is used to mint a short-lived OAuth2 access token server-side via the RFC 7523 JWT-Bearer flow (`googleAuth.ts`), using `deno.land/x/djwt` for RS256 signing (the private key is PKCS8 PEM, imported via Web Crypto). The token is only ever held in the edge function's memory for the duration of one request — it is never returned to the browser, never logged, and never persisted. This directly closes the gap flagged in the research doc (B4 #5): the old `GoogleShoppingManager.tsx` held a live Merchant Center token in a `<Textarea>` in React state.

## 8. Merchant Center setup steps (for the human doing the actual Google-side setup)

1. **Confirm/claim the Merchant Center account** for `mygravelguy.com` if not already done (the account this repo's old `MerchantCenterConfig.merchantId` pointed at — check whether it's still valid or needs re-verification given the Content API sunset).
2. **Create a Google Cloud project** (or reuse an existing one) and enable the **Merchant API** (not "Content API for Shopping") in the Cloud Console.
3. **Create a service account** in that project (IAM & Admin → Service Accounts), and generate a JSON key for it.
4. **Grant the service account access to the Merchant Center account**: Merchant Center → Settings → Account access → Add user → paste the service account's email (`...@...iam.gserviceaccount.com`) → grant Admin or Standard access, per Google's Merchant API auth guide. This step is separate from, and in addition to, enabling the API in Cloud Console — a common setup mistake is doing one but not the other.
5. **Set edge function secrets** (Supabase dashboard → Project Settings → Edge Functions → Secrets, or `supabase secrets set`):
   - `GOOGLE_MERCHANT_ACCOUNT_ID` — the numeric Merchant Center account ID.
   - `GOOGLE_SERVICE_ACCOUNT_JSON` — the full service-account JSON key, as a single-line string.
   - `GOOGLE_MERCHANT_DATA_SOURCE_ID` — the primary product data source ID for this account (Merchant API's `productInputs:insert` requires a `dataSource` parent; create one under Merchant Center → Products → Data sources if none exists yet).
   - `GOOGLE_MERCHANT_SYNC_ADMIN_SECRET` — optional, only needed for a future non-interactive caller.
6. **Register/confirm the landing page price-match requirement.** Google's price/landing-page consistency policy (research doc B2) requires the feed price and the page's *displayed* price to match for the visitor's actual location. Today's metro pages (`src/pages/metro/MetroCategoryPage.tsx` etc., per METRO-UI's work) render entirely client-side with no server-side ZIP detection — so **the page currently shows one price regardless of visitor location**, same as the base `ProductInput` price this function submits (the metro's lowest-zone "starting at" figure). That's consistent for now. Once the storefront gains ZIP-aware server-rendered pricing (a build-time-prerender improvement flagged separately in `docs/metro/research/seo-technical-audit.md`), the regional inventory price a Shopping ad shows for a given zone must match what that zone's ZIP actually sees on the landing page — plan the prerender work and the Merchant API region definitions from the *same* zone/ZIP source (`src/metro/config/data/*.ts`) so they can never drift apart. Until then, treat the base "starting at" price as the only price semantically guaranteed to match the page.

## 9. Deploy steps

```bash
# 1. Regenerate the price book after any pricing/metro/zone change:
node scripts/metro/export-price-book.mjs

# 2. Review the diff on price-book.json before deploying (it's a generated artifact, but
#    it's the actual data Google will see — treat changes to it like a migration).
git diff supabase/functions/google-merchant-sync/price-book.json

# 3. Set/update secrets (one-time, or when rotating the service-account key):
supabase secrets set GOOGLE_MERCHANT_ACCOUNT_ID=... \
  GOOGLE_SERVICE_ACCOUNT_JSON="$(cat service-account.json)" \
  GOOGLE_MERCHANT_DATA_SOURCE_ID=...

# 4. Deploy the function:
supabase functions deploy google-merchant-sync

# 5. Smoke test with dryRun (default) before ever setting dryRun:false:
curl -X POST https://losrkjvrcambvgijfism.supabase.co/functions/v1/google-merchant-sync \
  -H "Authorization: Bearer <your Supabase user JWT>" \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true, "metroSlug": "long-island"}'
```

Long Island is the smaller of the two metros (5 zones vs. DFW's 3, but LI's `priceBookConfirmed` is also `false` — both metros will dry-run cleanly but neither should go live yet) — use `metroSlug` to scope a first live test narrowly once a metro's price book is actually confirmed.

## 10. Migration off Content API — status

`src/services/googleShopping/merchantCenter.ts` (the Content API v2.1 client) is **left in place, unused, and marked `@deprecated`** rather than deleted, per this task's file-ownership rules. It is not wired to any UI anymore — `GoogleShoppingManager.tsx`'s Merchant Center tab now calls `merchantApiClient.ts` exclusively. If the account still has any live product feed uploaded via the old Content API path, expect Google to eventually stop serving it (per the B3 sunset timeline: HTTP 410 on/after 2026-09-01, escalating); this new pipeline is the replacement, not an addition alongside it.

## 11. Risks / open items

- **[UNVERIFIED]** Every Merchant API field name/path in `merchantApi.ts` and the OAuth scope in `googleAuth.ts` — see §6. The single highest-value next step is one real dry-run→live test against a sandbox account.
- **[UNVERIFIED]** `google_product_category` path text — see §5.
- **Both metros are pre-launch.** `priceBookConfirmed: false` on both DFW and Long Island means every product in the current price book is `out_of_stock` by design. This function is ready to run, but there's nothing to responsibly go live with yet — that's a pricing/business decision (signed partner price sheets), not an engineering blocker.
- **Landing-page price parity is not yet server-rendered** (§8, point 6) — a real risk once regional inventory actually varies meaningfully by zone and Google starts spot-checking; flagged for follow-up alongside the SEO-TECH prerender work.
- **Merchant API batch endpoints exist but aren't used here.** `pushAll()` in `merchantApi.ts` calls each region/product/regional-inventory sequentially with a small delay, specifically to avoid guessing at batch request/response semantics without a live call to confirm them. Revisit once the single-item calls are verified — batching would matter more once the product count is in the hundreds (metro N+, not today's 31).
- **djwt pin (`deno.land/x/djwt@v3.0.2`)**: this is a third-party (not deno.land/std, not esm.sh-mirrored-npm) dependency, unlike every other import in this repo's edge functions. It was the pragmatic choice for correct RS256 JWT signing without hand-rolling PKCS8/ASN.1 handling; flagging it here so a future audit of edge function dependencies doesn't miss it.
