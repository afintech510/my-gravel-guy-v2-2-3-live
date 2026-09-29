# RLS Hotfix Stage 0a — Adversarial Review (R3-HOTFIX-REVIEW)

Branch: `hotfix/orders-rls` (worktree `mgg-hotfix-rls`), based on `origin/main` @ `8438ab4`.
Reviewed: app diff (Checkout.tsx, PaymentSuccess.tsx, QuoteCheckout.tsx, DeliveryConfirm.tsx,
cartInsertService.ts, orderInsertService.ts, quoteOrderService.ts, specMaterialQuoteService.ts,
rlsHotfixCompat.ts + tests), `sql/rls-hotfix-stage0a.sql` + rollback, `scripts/security/probe-anon-exposure.sh`,
`docs/security/RLS-HOTFIX-RUNBOOK.md`, and every `supabase/functions/*` for anon-key usage against
the affected tables. No files were edited — no bugs met the bar for a fix.

## Findings

| ID | Severity | File:Line | Issue | Fix applied? / Recommendation |
|----|----------|-----------|-------|-------------------------------|
| F1 | Info | `sql/rls-hotfix-stage0a.sql:159-211` (`get_quote_by_id`) | `ilike (p_quote_id \|\| '%')` lets a caller-supplied `quoteId` contain SQL `LIKE` wildcards (`%`, `_`) to broaden the match beyond the intended prefix. Not new SQL-injection (parameter is bound, not concatenated) — it's the exact same behavior as the raw query it replaces (`.like('order_id', quoteId+'%')`), and the SQL file's own comment already documents this as a known, unchanged limitation. | No fix — out of scope for a zero-regression hotfix; already flagged for Stage 1 (opaque per-quote token) in both the SQL comments and the runbook. |
| F2 | Info | `src/pages/PaymentSuccess.tsx:717`, `src/services/orderInsertService.ts:175-178` | Synthesized `id: \`${order_id}-${index}\`` replaces the DB-generated UUID after `.select()` was removed from the insert. Verified this value is only ever used as a React list `key` (`orderItems.map(item => <div key={item.id}>`) — never passed to a subsequent `.eq('id', ...)` query, email, SMS, or GA4 payload. | No fix needed — confirmed no functional dependency on the real UUID anywhere downstream. |
| F3 | Info | `verify-payment` (Supabase Edge Function, not in this repo's diff) | Uses `SUPABASE_ANON_KEY` only inside `verifyAuth()` for `supabase.auth.getUser(token)`; every `.from('orders')` call in that function runs on a second client built with `SUPABASE_SERVICE_ROLE_KEY` (line ~275), which bypasses RLS entirely. Confirmed unaffected by this SQL. | No fix needed. |
| F4 | Info | `supabase/functions/{get-messages,mark-messages-read,send-order-sms,create-auth-hold,create-payment}` | All anon-key edge-function clients only touch `messages` (or nothing at all) — none reference `orders`, `delivery_confirmations`, `suppliers`, `order_status_history`, `rate_limits`, or `quote_analytics`. | No fix needed — none of the six affected tables are touched by an anon-key edge-function client. |
| F5 | Info | `supabase/functions/create-quote-checkout/index.ts` | Uses `SUPABASE_SERVICE_ROLE_KEY`, reads `orders`/`products` — bypasses RLS, unaffected by the SQL. | No fix needed. |

No Critical/High/Medium findings survived. Everything flagged above is either (a) explicitly
documented as an intentional, unchanged limitation by the hotfix author, or (b) a verification
that a theoretical risk (stale id, anon-key edge function touching a newly-locked-down table)
does not actually occur in this codebase.

## Verification performed

- **Checkout / PaymentSuccess / cart / quote insert paths**: traced every `.insert()` that had
  `.select()` removed (`orderInsertService.ts`, `cartInsertService.ts`, `quoteOrderService.ts`,
  `specMaterialQuoteService.ts`, `Checkout.tsx` debug button, `PaymentSuccess.tsx`
  `handleCheckoutStyleDatabaseInsert`) to every caller. Confirmed via `node_modules/@supabase/postgrest-js`
  source (`PostgrestQueryBuilder.js`) that `.insert()`/`.update()` without `.select()` already
  default to not returning a representation (no `Prefer: return=representation` header is set) —
  this is unchanged supabase-js v2 behavior, not something this hotfix introduces, and it means
  removing `.select()` is both correct (avoids the RLS-governed `INSERT...RETURNING` empty-result
  problem once anon SELECT is revoked) and safe under **today's** pre-SQL permissive policies too.
- Confirmed no caller of `insertOrderToDatabase`/`insertCartToDatabase`/`createQuoteOrder`/
  `createSpecMaterialQuote` reads anything from the returned object beyond fields already present
  in the client-built record, plus the synthesized `id` (React key only — see F2).
- **GA4/emails/SMS**: `handleDatabaseInsert`'s GA4 `transaction_id`/`trackGoogleAdsConversion` and
  `handleEmailSending`/`transformOrderDataForEmail` all read from `insertedOrders`
  (client-built + synthesized `id`), not from a DB round-trip — unaffected.
- **Pre/post SQL compatibility**: `QuoteCheckout.tsx` and `DeliveryConfirm.tsx` call four new
  SECURITY DEFINER RPCs guarded by `isRpcMissing()` (`src/utils/rlsHotfixCompat.ts`), which checks
  PostgREST's real `PGRST202` code / "Could not find the function" message — this is the correct,
  documented PostgREST error shape for a missing RPC, and the fallback branch reproduces the exact
  pre-hotfix raw query/update, so both pages work identically before and after the SQL is applied.
- **SQL correctness**: RLS enabled on `orders`, `delivery_confirmations`, `suppliers`,
  `order_status_history`, `rate_limits`; `quote_analytics` view grants revoked. All four new
  functions are `security definer`, `set search_path = public`, `revoke all ... from public`,
  then explicit `grant execute ... to anon, authenticated`, and return only the columns their
  callers need. `confirm_delivery` re-validates the token server-side (`where token::text = p_token`,
  `raise exception` if not found) and only ever updates the single matched row — cannot touch
  arbitrary rows. `update_quote_delivery_info` is scoped to `order_id ilike (quoteId||'%') and
  status = 'Quote'`, restricted to `delivery_*` columns, matching exactly what the raw per-row
  update it replaces did. `is_admin()` itself is not defined in this repo (created directly
  against the live DB, same as `delivery_confirmations`) — the SQL file's own pre-flight checks
  #2 already require the operator to verify it manually before applying; this is a documented
  precondition, not a hotfix defect.
- **Admin dashboard**: every admin data path (`orderService.ts`, `supplierService.ts`,
  `financialAnalysisService.ts`, `quoteService.ts`, `OrderDetailModal.tsx`,
  `ManualOrderForm.tsx`, `CartStatsWidget`/`OrdersFinancialSummary`/`OrdersStatsWidget`/
  `QuotesStatsWidget`) is untouched by this branch and sits behind `DashboardLayout`, which
  early-returns unless `useAuth().isAdmin` is true (confirmed at `DashboardLayout.tsx:73`) — all
  covered by the new `orders_admin_*`/`delivery_confirmations_admin_*`/`suppliers_admin_*`/
  `order_status_history_admin_*` policies (`using (is_admin())`). No non-admin authenticated user
  path needs `orders` access.
- **Rollback**: `sql/rls-hotfix-stage0a-rollback.sql` drops all four new functions and every new
  policy, then `disable row level security` on all five tables plus re-grants `quote_analytics` —
  restores pre-hotfix exposure exactly, matching the forward migration's object list 1:1.
- **Probe script**: `scripts/security/probe-anon-exposure.sh` is read-only (single-column
  `limit=1`/`count=exact` HEAD-style checks, RPCs called with bogus ids), safe to run against
  production at any time.

## Test / build results (this session, in the worktree)

- `npx vitest run` → 140/143 pass. The 3 failures (`src/services/products/exponentialPricing.test.ts`)
  are pre-existing and unrelated to this branch — confirmed identical failures on `origin/main`
  with `git stash` (file untouched by this hotfix).
- `npx tsc --noEmit -p tsconfig.app.json` → same error set as `origin/main` (confirmed via
  `git stash` diff of the two runs): `OrderDetailModal.tsx`/`DeliveryConfirm.tsx`
  `delivery_confirmations`-not-in-generated-types errors, `CrushedStoneLanding.tsx`,
  `MarketMaterialPage.tsx`. No new error classes introduced by this branch.
- `npm run build` → succeeds. `public/sitemap.xml` was regenerated by the build and reverted with
  `git checkout -- public/sitemap.xml` afterward, per instructions.

## Verdicts

- **Safe to merge app changes to main: YES.** No regressions found in the live checkout, cart
  save, quote request/conversion, or delivery-confirm flows under either today's (pre-SQL) or the
  post-SQL RLS state. Tests/tsc/build are clean relative to `main`.
- **Safe to apply SQL after deploy: YES, with preconditions** (already called out in the SQL
  file's own pre-flight section and the runbook — re-stated here as the gating checklist):
  1. Confirm `delivery_confirmations`'s real columns/types via `\d public.delivery_confirmations`
     match what `get_delivery_confirmation`/`confirm_delivery` assume (the table isn't tracked in
     any migration).
  2. Confirm `is_admin()` exists, is `SECURITY DEFINER`, and returns `true` for the real admin
     account.
  3. Apply during a quiet hour with `sql/rls-hotfix-stage0a-rollback.sql` open.
  4. Run `scripts/security/probe-anon-exposure.sh` before and after.
  5. Minimize the window between app deploy and SQL apply — until the SQL commits,
     `QuoteCheckout.tsx`/`DeliveryConfirm.tsx` still run through their pre-hotfix-equivalent raw
     query fallback (not a regression, but not an improvement either during that window).
