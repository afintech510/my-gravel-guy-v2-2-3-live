# Metro Checkout Re-Review (R2v2-CHECKOUT-REREVIEW)

Status: COMPLETE. Adversarial re-review of the redesigned ("v2/v3", no-pre-payment-DB-row) metro
Stripe checkout, per `docs/metro/research/metro-checkout-security-review.md`'s findings and
`docs/metro/research/metro-checkout-server.md`'s "2026-09-28 hardening pass" / "redesign"
sections. Read-only pass — no writes except this file, no Stripe/DB/deployed-function calls.

Branch: `feature/metro-ui`. Files read in full: `src/metro/checkout/{contract,serverQuote,
verifyLogic,conversion,emailTemplates,bundleEntry}.ts`, `supabase/functions/create-metro-checkout/
index.ts`, `supabase/functions/verify-metro-payment/index.ts`, `supabase/functions/
metro-stripe-webhook/index.ts`, `supabase/functions/_shared/metro-conversion-runner.ts`,
`supabase/functions/_shared/metro-checkout.bundle.js` (generated, inspected directly for import
statements), `src/metro/services/metroCheckoutService.ts`, `src/metro/services/
metroPurchaseTracking.ts`, `src/metro/hooks/useMetroOrder.ts` (diff vs HEAD), `src/pages/metro/
MetroOrderConfirmedPage.tsx`, `supabase/migrations-drafts/20260928170000_metro_orders_unique_session.sql`,
`supabase/config.toml`, `src/App.tsx` (diff), `public/robots.txt` (diff), plus `create-auth-hold/
index.ts` and `verify-payment/index.ts` as unchanged reference points.

## Findings

| ID | Severity | File:Line | Issue | Scenario | Fix |
|----|----------|-----------|-------|----------|-----|
| G1 | Medium | `supabase/functions/metro-stripe-webhook/index.ts:109-118`; `supabase/functions/verify-metro-payment/index.ts:137-141` | On a genuine (non-unique-violation) `orders` insert failure inside `convertMetroSession` (`kind:"error"` — e.g. a transient DB outage), neither caller sends any owner-facing alert. The webhook's `switch` only fires `sendMetroConversionNotifications` for `converted` / non-already-processed `review_required`; `error`/`metadata_invalid`/`session_invalid` just get a `console.error` + an unconditional `200 {received:true}` response (by design, to avoid Stripe retry storms — see the webhook's own comment). Because the webhook always 200s on this path, **Stripe will not retry** a transient failure either. `verify-metro-payment` at least shows the customer a "contact us" screen with an order reference, but that also sends no proactive alert. | A momentary DB blip occurs exactly when both (a) the customer's own `/metro-order-confirmed` page call and (b) the `metro-stripe-webhook` delivery for the same session race/fail (or the customer never reaches the confirmation page — tab closed pre-redirect — while the webhook's insert fails). Stripe has authorized/captured the card; the `orders` row was never created; nothing but a function log records it; no automatic retry occurs. Partially mitigated by the dual-path design (page + webhook) — only a *correlated* failure across both loses the order — but there is no belt-and-suspenders alert the way the `review_required` path has one. | Send the same internal "review needed" style alert email (or at minimum a log-based alert/metric) on `kind:"error"` in both callers, and/or return a 5xx from the webhook specifically for the `"error"` outcome (not for `unpaid`/`metadata_invalid`/ignored-event cases) so Stripe's own retry mechanism gets a chance to self-heal a transient DB issue. |
| G2 | Medium | `supabase/functions/_shared/metro-conversion-runner.ts:18-36` | `metro-conversion-runner.ts` imports `type MetroOrderEmailData`, `type MetroServerQuote`, `type MinimalStripeSession`, `type ParsedMetroCheckout` from `./metro-checkout.bundle.js` — a plain esbuild-generated `.js` file with **no accompanying `.d.ts`/JSDoc**. Those four names are all TypeScript `interface`s in the source (`emailTemplates.ts`, `contract.ts`, `verifyLogic.ts`, `conversion.ts`), which esbuild erases entirely (confirmed: `grep` of the bundle's export list has zero interface/type names, only functions and const objects). `deno check` or `tsc` run against this file today would report "Module has no exported member" for all four. Deno's runtime type-stripping (what actually executes at deploy time) doesn't verify this, so there is **no live breakage** — but the file currently has zero real type-safety on these four types (they resolve to implicit `any`/error, silently), exactly the kind of "a type-checker would catch this, but nobody runs one" gap the task asked to look for. Neither `tsconfig.app.json` (scoped to `src/` only) nor CI covers `supabase/functions/**`, so nothing currently catches it. | If anyone runs `deno check supabase/functions/_shared/metro-conversion-runner.ts` (or wires it into CI, a reasonable next step for a live payment path), the build fails immediately with 4 "no exported member" errors — a false-alarm-looking but real blocker, unrelated to any actual logic bug. | Either (a) generate a matching `.d.ts` alongside the bundle in `export-metro-checkout-bundle.mjs` (esbuild can emit declarations), or (b) stop type-importing these four names from the bundle and instead `import type {...} from '../../src/metro/checkout/...'` directly (type-only imports are erased before Deno ever tries to resolve the module at runtime, so a source-relative type import here is safe even though a *value* import from `src/` isn't). |
| G3 | Low | `src/metro/services/metroPurchaseTracking.ts:1-11` (header comment) vs. `src/pages/metro/MetroOrderConfirmedPage.tsx:218-229` | The module doc-comment says this is "Used from `src/pages/PaymentSuccess.tsx`" and "Mirrors `handleDatabaseInsert`'s tracking block (same enhanced-conversion fields...)". Both claims are stale from the pre-redesign plan. `grep` confirms the only caller is `MetroOrderConfirmedPage.tsx`, and the call there only supplies `contact_email` — `contact_name`/`contact_phone` are always `undefined` because `MetroConfirmedOrder` (`contract.ts:142-157`) has no name/phone fields to source them from. `setEnhancedConversionData` therefore always gets `firstName: ''`, `lastName: ''`, `phone: undefined` for every metro order, unlike the live flow it claims to mirror. | Not an order-loss/duplication bug — a Google Ads Enhanced Conversions data-completeness gap (worse match-rate for metro purchases vs. the legacy flow) plus a misleading comment for future maintainers. | Update the comment to reflect the actual caller/contract, and — if better Enhanced Conversions match rate is wanted for metro — add `customerName`/`customerPhone` (already stored on the `orders` row as `delivery_name`/`delivery_phone`) to `MetroConfirmedOrder`/`buildConfirmedOrder` and thread them through. |
| G4 | Info | `docs/metro/research/metro-checkout-server.md` ("`verify-metro-payment` — the new, isolated conversion function" § "Request / response contract") | States `orderId` "may be given in either `CART-METRO-…` or `ORDER-METRO-…` form" — accurate for the pre-redesign (v2) design but stale after the v3 redesign documented further up the same file (no more `CART-` staging prefix at all). The actual code (`verifyLogic.ts`'s `METRO_ORDER_ID_RE = /^ORDER-METRO-(.+)$/`) only accepts `ORDER-METRO-`, correctly matching the v3 design. Doc-only inconsistency within the same file; not a code bug. | — | Delete/update that stale paragraph the next time this doc is touched. |

## Confirmed safe (adversarial checks that did NOT find a problem)

All of the following were specifically checked per the task brief and found solid:

- **No pre-payment DB row (F3 fix)**: `create-metro-checkout/index.ts` never calls `.insert()` — verified by reading the full file; the only Supabase client use is `verifyAuth`'s `auth.getUser`. The entire order lives in Stripe session `metadata`, built exclusively by `buildMetroCheckoutMetadata` (`conversion.ts`) from server-sanitized/re-quoted values — no `...rawRequest` spread, no client-suppliable `metadata` field anywhere in the request body path.
- **Metadata trust**: confirmed the client cannot inject or override any metadata key; `metadata` passed to `stripe.checkout.sessions.create` is built solely from `request` (already run through `sanitizeCheckoutRequest`/`validateRequest`/`buildServerQuote`), `orderId` (server-generated), and `serverQuote` (server-recomputed).
- **Webhook signature verification**: `metro-stripe-webhook/index.ts` uses `stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret, undefined, Stripe.createSubtleCryptoProvider())` — the Deno-correct pattern for `stripe@14.21.0` (Node's default `constructEvent` needs Node's `crypto` module, unavailable the same way under Deno). Raw body is read via `await req.text()` **before** any JSON parsing, satisfying the signature's byte-exactness requirement. Missing `STRIPE_METRO_WEBHOOK_SECRET` (or `stripe`/`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`) fails closed — returns 500 *before* any signature check is attempted, and Stripe will retry until the misconfiguration is fixed (comment in the code confirms this is intentional). A missing/invalid signature always returns 400, never silently accepted.
- **Version consistency**: `stripe@14.21.0` / `@supabase/supabase-js@2.45.0` / `deno.land/std@0.168.0` are identical across `create-metro-checkout`, `verify-metro-payment`, `metro-stripe-webhook`, and the untouched reference functions `create-auth-hold`/`verify-payment` — no drift.
- **Bundle is valid, self-contained ESM**: direct `grep` of `supabase/functions/_shared/metro-checkout.bundle.js` (1509 lines) found zero `import`/`require(` statements, zero references to `integrations/supabase` (the one type-only source import is fully erased, as designed), and zero Node-only API usage (`Buffer.`, `process.`, `node:` specifiers). The file is a flat esbuild `platform:'neutral'` bundle ending in a single `export { ... }` block containing every name every consumer (`create-metro-checkout`, `verify-metro-payment`, `metro-stripe-webhook`, `metro-conversion-runner.ts`) actually imports (cross-checked each consumer's import list against the bundle's export list — no misses, aside from the type-only names in G2 which were never real runtime exports to begin with). `metro-conversion-runner.ts` imports it via the correct relative path with `.js` extension: `from "./metro-checkout.bundle.js"`.
- **PII exposure via `verify-metro-payment`**: `validateSession` requires `session.metadata.source === 'metro-checkout'` AND `session.metadata.orderId === expectedOrderId` before anything else runs. Since `orderId` is embedded immutably in the session's own metadata at creation time (never renamed), a request with a *valid, real* `session_id` but a *mismatched* `order_id` is rejected as `invalid` (400) with zero PII in the response. Getting someone else's order data requires knowing their actual unguessable Stripe `session_id` (not just their order id, which — while only ~31 bits of random suffix entropy — is insufficient alone). Confirmed safe, matching the original security review's conclusion on this surface.
- **Escaping coverage**: all three email templates in `emailTemplates.ts` (`buildCustomerConfirmationHtml`, `buildInternalNotificationHtml`, `buildReviewRequiredInternalHtml`) run every user-derived field (`customerName`, `customerEmail`, `orderId`, `variantName`, `quantity`, `unit`, delivery address lines, delivery date, and the internal `reason` string) through `escapeHtml` before interpolation. `formatUsd`'s output isn't escaped, but its input is always a number (`toFixed(2)`), never a raw user string, so there's nothing to escape.
- **Logs**: reviewed every `console.log`/`console.error`/`console.warn` call site across `create-metro-checkout`, `verify-metro-payment`, `metro-stripe-webhook`, and `metro-conversion-runner.ts` — none log customer PII (name/email/phone/address); logged fields are limited to `sessionId`, `orderId`, error objects/messages, and non-PII quote totals.
- **Insert-race / idempotency / notification-dedup**: `resolveInsertRace`'s `created_at`-then-`id` tie-break, the fast idempotency lookup-by-`order_id`, and the "loser deletes its own row, only winner notifies" flow are exercised by 24 `conversion.test.ts` tests + 46 `verifyLogic.test.ts` tests, all passing. Notification sends (`sendMetroConversionNotifications`) never throw — wrapped in `.catch()` at both call sites — so a Resend outage never turns a successful payment into an error response to the customer (verified in both `verify-metro-payment/index.ts` and `metro-stripe-webhook/index.ts`).
- **`review_required` path**: on an amount/price mismatch, the row **is still inserted** (with `status:'review_required'` and a note), so a real payment is never silently dropped — only an internal alert fires (never the customer confirmation), and the customer-facing response maps to a generic, reassuring "we'll follow up" screen (`ErrorView`) rather than exposing the mismatch detail.
- **Expired/incomplete sessions**: `stripe.checkout.sessions.retrieve` on an expired or never-completed session doesn't throw; `mapPaymentIntentStatus` falls through to `'unpaid'` for any PaymentIntent status other than `requires_capture`/`succeeded`, producing a clean `{success:false, status:'unpaid'}` (200) with zero DB effect — no crash, no partial write.
- **Client StrictMode double-invoke**: `MetroOrderConfirmedPage.tsx` guards its verification `useEffect` with a persistent `invokedRef` (survives the mount/cleanup/remount StrictMode does in dev, since it's the same component instance) — covered by an explicit "StrictMode double-mount: invoke is still only called once" test, passing.
- **GA4 purchase fired once**: `trackMetroPurchaseConversion` (`metroPurchaseTracking.ts`) dedupes via the same `mgg_purchase_fired_<orderId>` localStorage-key pattern the legacy flow uses, and is called from `applyResponse` on every successful verify response (including `alreadyProcessed:true` reloads) — the localStorage guard, not call-site gating, is what prevents a double-fire on repeat visits from the *same* browser. (Cross-device/cross-browser access to the same confirmation link would still fire it again — this mirrors a pre-existing pattern in the live checkout flow, not a new regression, so not listed as a separate finding above.)
- **Regression risk to the live `/cart` → `/checkout` → `/payment-success` flow**: `git diff HEAD --stat` plus targeted `git diff HEAD --` on `supabase/functions/create-auth-hold/index.ts`, `supabase/functions/verify-payment/index.ts`, `supabase/functions/process-abandoned-carts/index.ts`, `src/pages/PaymentSuccess.tsx`, `src/pages/Checkout.tsx`, every `Cart*`/`src/components/cart/**` file, and `src/utils/paymentUtils.ts` all produced **empty diffs** (byte-identical to `HEAD`) and none even appear in `git status`. `src/App.tsx`'s diff is purely additive (new lazy-loaded guide/metro-confirmation routes, plus widening the `isMetroPage` boolean to also match `/metro-order-confirmed` for header/footer chrome) — it does not touch the existing `/cart`, `/checkout`, or `/payment-success` `<Route>` definitions. `public/robots.txt`'s diff adds one new `Disallow: /metro-order-confirmed` line per bot section — it doesn't modify any existing `Disallow: /checkout` / `Disallow: /payment-success` line.
- **Migration**: `20260928170000_metro_orders_unique_session.sql` is a partial unique index scoped to `WHERE order_id LIKE 'ORDER-METRO-%'` — cannot conflict with any legacy-flow row, not applied (documented as optional/owner's call), and the insert code already handles the `23505` unique-violation it would introduce (`isUniqueViolation` in `conversion.ts`).
- **Feature is still fully gated dark**: `isMetroCheckoutEnabled` requires both `metro.priceBookConfirmed === true` (false for DFW and Long Island today) and `VITE_METRO_CHECKOUT_ENABLED === 'true'` — none of the checkout code path (including the client UI changes in `DetailsStep.tsx`/`PriceSummary.tsx`) is reachable in production yet.

## Confirmed vs. speculative

All findings above (G1–G4) are **Confirmed** by direct code/doc reading — none are speculative.
G1 is the only one with a speculative *likelihood* component (it requires a DB-level failure to
trigger at all, and a correlated failure across both the page-call and webhook paths to actually
lose data undetected) — the code gap itself (no alert path, no webhook retry) is confirmed, not
the odds of it firing in practice.

## Test run

`npx vitest run src/metro src/pages/metro` — **13 test files, 639 tests, all passing** (0
failures), including `bundleParity.test.ts`'s 424 sub-comparisons confirming the checked-in
`metro-checkout.bundle.js` currently matches source (no regeneration needed before this review).

## Verdict: ready for owner Stripe TEST-mode run?

**Yes — no blockers.** No finding here rises to "must fix before testing" severity. G1 (no owner
alert / no webhook retry on a genuine insert failure) and G2 (Deno type-check gap on 4 type
names) are both real but narrow: G1 requires an actual DB-level fault to matter at all and is
already defense-in-depth on top of the dual page+webhook conversion paths; G2 has zero effect on
running code today (Deno's runtime doesn't type-check) and only matters if/when a `deno check`
step is added to CI. G3/G4 are documentation/analytics-completeness nits with no correctness or
security impact. Recommend fixing G1 (cheap: mirror the `review_required` internal-alert email
onto the `error` outcome) before flipping `priceBookConfirmed: true` for any metro in
**production**, but it does not block a Stripe **TEST**-mode manual run per
`docs/metro/research/metro-checkout-server.md`'s existing test plan (steps 1–14). The feature
remains gated fully dark in production regardless (`priceBookConfirmed: false` for both metros),
so there is zero live exposure from any of these findings today.

## Resolution (A1v4/A1v5)

Verified against the current code (`src/metro/checkout/{contract,serverQuote,verifyLogic,
conversion,emailTemplates}.ts`, `supabase/functions/{create-metro-checkout,verify-metro-payment,
metro-stripe-webhook}/index.ts`, `supabase/functions/_shared/metro-conversion-runner.ts`,
`scripts/metro/export-metro-checkout-bundle.mjs`):

- **G1 (owner alert / webhook retry on insert failure) — fixed.** `metro-conversion-runner.ts`
  adds `sendMetroConversionErrorAlert`, which sends an internal-only `[ORDER MAY BE LOST]` email
  (`buildOrderInsertFailedInternalHtml`/`MetroOrderErrorAlertData` in `emailTemplates.ts`) when
  `convertMetroSession` returns `{ kind: "error" }` (a genuine post-payment `orders` insert
  failure). `metro-stripe-webhook/index.ts` calls it and returns **500** specifically for that
  outcome (every other outcome — `unpaid`, `metadata_invalid`, `session_invalid`, ignored events —
  still 200s) so Stripe's own retry mechanism gets a chance to self-heal a transient DB issue.
  `verify-metro-payment/index.ts` deliberately does **not** also call the alert on the same
  outcome (dedupe decision documented in `sendMetroConversionErrorAlert`'s doc comment: only the
  webhook alerts, since it's the more reliable of the two signals and now retries) — it still
  returns the customer a reassuring "payment received, we're confirming your order" response
  either way.
- **G2 (no `.d.ts` for the bundle) — fixed.** `scripts/metro/export-metro-checkout-bundle.mjs` now
  also emits `supabase/functions/_shared/metro-checkout.bundle.d.ts` via the real TypeScript
  compiler (`tsc --emitDeclarationOnly` over `bundleEntry.ts`'s dependency graph, not
  hand-duplicated types). `metro-conversion-runner.ts` attaches it with a `// @deno-types=
  "./metro-checkout.bundle.d.ts"` comment directly above its `import { ... } from
  "./metro-checkout.bundle.js"` line, so `MetroOrderEmailData`, `MetroServerQuote`,
  `MinimalStripeSession`, `ParsedMetroCheckout`, and `MetroOrderErrorAlertData` all resolve under
  `deno check`/`tsc` instead of erroring "no exported member". A new test file,
  `src/metro/checkout/bundleDeclarations.test.ts` (7 tests), covers this.
- **G3 (stale doc-comment / missing Enhanced Conversions fields) — fixed.**
  `src/metro/services/metroPurchaseTracking.ts`'s header comment now names its actual caller
  (`MetroOrderConfirmedPage.tsx`, not the stale `PaymentSuccess.tsx` reference) and describes the
  real field set. `MetroConfirmedOrder` (`contract.ts`) gained optional `customerName?`/
  `customerPhone?`, populated in `verifyLogic.ts`'s `buildConfirmedOrder` from
  `row.delivery_name`/`row.billing_name` and `row.delivery_phone`, and threaded through to
  `setEnhancedConversionData` via `trackMetroPurchaseConversion` — metro orders now get the same
  enhanced-conversion match-rate fields (first/last name split client-side, phone) as the legacy
  flow instead of always sending empty/undefined values.
- **G4 (stale doc: `docs/metro/research/metro-checkout-server.md`) — fixed.** Added a "Current
  design (authoritative)" summary at the top of that doc (one order id, `ORDER-METRO-` only,
  generated once at session creation; no DB row before payment; row inserted post-payment by
  `verify-metro-payment`/`metro-stripe-webhook`; G1/G2/G3 fixes) and corrected or clearly marked
  "Superseded (v1 design)" every place further down the doc that still described the old
  `CART-METRO-`/insert-before-Stripe/UPDATE-on-verify design as current — including the "## Design"
  section's step 4, the "## DB row mapping" table, the `verify-metro-payment` section's summary
  line and "### Flow" subsection, the Manual test plan (steps 2–11, corrected in place to match
  the metadata-only/post-payment-insert flow), the Owner deploy steps (added `metro-stripe-webhook`
  and the `.d.ts` regeneration), the Bundling section (documented `conversion.ts`/`emailTemplates.ts`
  now being part of `bundleEntry.ts`, plus the G2 `.d.ts` step), and the Risks/open-decisions
  bullets that called the webhook a not-yet-built recommendation (it's shipped) and referenced the
  since-removed `CART-` row's `total_price` compare.

Test run: `npx vitest run src/metro src/pages/metro` — **14 test files, 650 tests, all passing**
(0 failures) — up from the 639 tests recorded earlier in this doc, reflecting the new
`bundleDeclarations.test.ts` (7 tests) added for G2 plus incidental additions elsewhere.
`npx eslint src/metro scripts/metro src/pages/metro` is clean (0 errors; one pre-existing,
unrelated `react-refresh/only-export-components` warning in `FaqSection.tsx`) — the 4
`@typescript-eslint/no-explicit-any` errors previously called out in
`scripts/metro/margin-scenarios.ts` (the `sku.categorySlug as any` casts passed to `quote()`) were
fixed by typing `SkuRow.categorySlug` as the real `CategorySlug` union instead of `string`, so no
cast is needed at any of the four call sites; script output (`npx tsx
scripts/metro/margin-scenarios.ts all`) is byte-for-byte identical before and after the change.
