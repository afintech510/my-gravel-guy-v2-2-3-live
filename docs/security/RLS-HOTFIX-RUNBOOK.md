# RLS Hotfix Stage 0a — Runbook

Branch: `hotfix/orders-rls` | Project: `losrkjvrcambvgijfism` (mygravelguy.com, **LIVE**)

Closes the anonymous READ leak on `orders`, `delivery_confirmations`, `suppliers`,
`order_status_history`, `rate_limits`, and the `quote_analytics` view, confirmed live on
2026-09-28 (see the "before" probe run below — every one of these returned real rows to a plain
`curl` with only the public anon key). Does **not** narrow anonymous INSERT on `orders` — that's
a later stage, after the legacy checkout's client-side insert is moved server-side.

## ⚠ Before you touch anything: verify the schema assumption for `delivery_confirmations`

This table is **not tracked anywhere in this repo** — no migration, not in
`src/integrations/supabase/types.ts`. Its columns were inferred from every client call site that
reads/writes it (`src/pages/DeliveryConfirm.tsx`, `src/components/dashboard/OrderDetailModal.tsx`)
and cross-checked live via read-only, zero-PII probes (`limit=0` column-existence checks — see
below). That check already passed once during this work, but re-run it yourself before applying
the SQL, since the schema could have changed:

```sql
\d public.delivery_confirmations
```

Expected columns (all confirmed to exist via a live `limit=0` probe on 2026-09-28): `token`
(uuid), `order_id`, `confirmed_at`, `confirmed_delivery`, `verified_at`, `product_name`,
`quantity_tons`, `delivery_address`, `delivery_date`, `customer_name`, `stripe_payment_id`,
`customer_phone`, `customer_email`, `photo_url`, `signature_url`, `rating`, `review_text`,
`confirmed_location`, `confirmed_user_agent`. `token` and `orders.id` were both confirmed to be
`uuid` type (a filter with a non-UUID string returned Postgres error `22P02`). If `\d` shows
anything different, edit `sql/rls-hotfix-stage0a.sql`'s `get_delivery_confirmation` /
`confirm_delivery` function bodies to match before applying.

Also confirm `is_admin()` exists, is `SECURITY DEFINER`, and returns `true` for the owner's admin
account (see the pre-flight section inside `sql/rls-hotfix-stage0a.sql` for the exact queries).

## Order of operations

**1. Merge `hotfix/orders-rls` to `main` → auto-deploys.**
The app changes are safe to deploy *before* the SQL is applied, with one documented exception
(see "The one gap" below). Verify locally first:
```
npm ci
npx vitest run                              # 140/143 pass; 3 pre-existing failures, see below
npx tsc --noEmit -p tsconfig.app.json       # 29 errors, all pre-existing classes, see below
npx eslint <touched files>                   # pre-existing no-explicit-any style, see below
npm run build && git checkout -- public/sitemap.xml
```

**2. Verify the site immediately after deploy** (before applying SQL):
- Guest checkout end-to-end (`/checkout` → Stripe → `/payment-success`) — order should appear,
  confirmation emails should send.
- Guest quote form submit (any landing page's `ContactQuoteForm`/`ManagedQuoteModule`) and the
  spec-materials form (`/contractors-spec-materials`).
- Guest "save cart" flow.
- `/quote-checkout/:quoteId` from a real (or recently-generated) quote link.
- `/delivery-confirm?token=...` from a real delivery-confirmation link.
- Admin dashboard: login, `/dashboard/orders` list/detail/edit, `/dashboard/suppliers`,
  `/dashboard/expenses`, `/dashboard/analyze`.

All of the above should work identically to before this deploy, because:
- Every `.insert(...)` on an anonymous path had its `.select()`/`.single()` removed (Postgres
  RLS applies the SELECT policy to `INSERT ... RETURNING` rows too — once anon SELECT is
  removed, those chains would come back empty/error even though the insert succeeded). The code
  now builds its return value from the record it already has client-side instead of reading it
  back from the DB. This works **identically whether RLS is on or off** — `insert()` without
  `.select()` defaults to `Prefer: return=minimal` in supabase-js v2 either way.
- `QuoteCheckout.tsx` and `DeliveryConfirm.tsx` now call SECURITY DEFINER RPCs
  (`get_quote_by_id`, `update_quote_delivery_info`, `get_delivery_confirmation`,
  `confirm_delivery`) that **don't exist until step 3**. See "The one gap" below — this is the
  one place where "works under both old and new policies" required an explicit compatibility
  shim rather than being automatically true.
- Every admin-dashboard call site (`OrderService`, `supplierService`, `financialAnalysisService`,
  `ManualOrderForm`, dashboard widgets) is unchanged — it already only runs after
  `DashboardLayout` confirms `isAdmin`, and will get an `is_admin()`-gated policy that grants it
  the same access it has today. No code changes there at all.

**3. Apply `sql/rls-hotfix-stage0a.sql` in the Supabase SQL editor, during a quiet hour, as soon
as possible after step 2 passes** (see "The one gap" — minimize this window).
- Run the pre-flight queries at the top of the file first.
- The whole file is one transaction (`begin`/`commit`) — if anything errors, nothing partial is
  left applied.

**4. Run probes + smoke tests again, this time expecting the leak closed:**
```
scripts/security/probe-anon-exposure.sh
```
Expect `orders`, `delivery_confirmations`, `suppliers`, `order_status_history`, `rate_limits`,
`quote_analytics` to now report **closed/PASS** (empty result, not a real row), and
`delivery_locations` to still return real data (untouched, intentional). The two RPC probes
(bogus quote id / bogus token) should now return **empty, not a 404** — confirming the functions
exist and correctly return nothing for junk input.

Then repeat every smoke test from step 2. All should still work — this time genuinely through
RLS + the RPCs, not the temporary raw-query path.

**5. Rollback, if needed:**
```sql
-- in the Supabase SQL editor
\i sql/rls-hotfix-stage0a-rollback.sql
```
This restores today's (exposed) behavior exactly. The app code does not need to be rolled back —
its RPC calls fall back to the raw queries automatically once the RPCs are gone again (same
compat shim that covers step 2→3). Re-apply a corrected forward-fix as soon as possible; don't
leave the rollback in place, since it re-opens F5.

## The one gap: RPC calls between deploy and SQL-apply

`QuoteCheckout.tsx` and `DeliveryConfirm.tsx` were rewritten to call four new SECURITY DEFINER
RPCs. Those RPCs are created by the SQL in step 3, which is a **separate, deliberately later**
step from the app deploy in step 1 (task requirement: app must auto-deploy and work before the
SQL is applied). Taken literally, that's impossible for a brand-new RPC — it doesn't exist yet.

**Fix applied:** `src/utils/rlsHotfixCompat.ts` exports `isRpcMissing(error)`, which recognizes
PostgREST's `PGRST202` ("could not find the function in the schema cache") response. All four
call sites (`QuoteCheckout.tsx` fetch + save, `DeliveryConfirm.tsx` load + submit) try the RPC
first; if it 404s with that specific code, they fall back to the *exact* raw query that was there
before this hotfix. That old raw query still works fine under today's (pre-SQL) permissive,
RLS-less state — it's only unsafe in combination with an anonymous *bulk* `select=*` against the
whole table, which this compat shim doesn't add (it still only ever queries by the specific
token/quoteId the visitor already has). Once the RPC exists (post step 3), the RPC call succeeds
and the fallback branch never runs again.

This was verified with a live, read-only probe against production
(`scripts/security/probe-anon-exposure.sh`, before the SQL was applied) — the RPCs return
`404 PGRST202` today, confirming the fallback branch is exercised in exactly the way it's
designed for.

**Net effect:** these two pages are safe for the whole window between step 1 and step 3, but they
are not *more* secure than today until step 3 actually runs — keep that window short (the task
brief already calls for a quiet-hour SQL apply; do it as soon as step 2's smoke test passes,
not days later). `orders` bulk SELECT and `delivery_confirmations`' zero-RLS token bypass — the
two Critical findings — are fully closed the moment the SQL commits, independent of this gap.

The compat shim files/branches (`src/utils/rlsHotfixCompat.ts` and every block commented
`rls-hotfix TEMPORARY COMPAT SHIM`) are safe to delete once the SQL has been applied to
production and confirmed via the probe script — they're strictly for the deploy-then-apply
sequencing window.

## What changes — policy summary per table

| Table / view | Before | After | Anonymous access now via |
|---|---|---|---|
| `orders` | No RLS — anon full SELECT/INSERT/UPDATE/DELETE | RLS on. `is_admin()` for SELECT/INSERT/UPDATE/DELETE. Anon+authenticated INSERT unrestricted (`with check (true)`, unchanged from today) | Direct anon INSERT (unchanged); `get_quote_by_id`/`update_quote_delivery_info` RPCs for the one legitimate anon read/update case (quote-checkout link) |
| `delivery_confirmations` | **No RLS at all** — anon full SELECT/INSERT/UPDATE/DELETE, "token" was a client-side convention only | RLS on. `is_admin()` for SELECT/INSERT/UPDATE/DELETE. No anon/authenticated-non-admin grant at all | `get_delivery_confirmation`/`confirm_delivery` RPCs, both require the exact token as an argument |
| `suppliers` | No RLS — anon full SELECT/INSERT/UPDATE/DELETE | RLS on. `is_admin()` for all four | None (no anonymous page reads this table) |
| `order_status_history` | No RLS — anon full SELECT/INSERT/UPDATE/DELETE | RLS on. `is_admin()` for all four | None (zero client-code references) |
| `rate_limits` | No RLS — anon full SELECT | RLS on. `is_admin()` SELECT only | None (service-role edge functions write it, bypass RLS) |
| `quote_analytics` (view) | Anon/authenticated SELECT granted | Grant revoked from `anon`/`authenticated` | None (zero client-code references) |
| `delivery_locations` | No RLS, anon SELECT | **Unchanged** — intentional public data, out of scope | Unchanged |

New SECURITY DEFINER functions (all `set search_path = public`, `revoke all ... from public`,
then explicit `grant execute ... to anon, authenticated`):
- `get_quote_by_id(p_quote_id text)` — returns only the `QuoteItem` columns QuoteCheckout.tsx
  needs, for `status = 'Quote'` rows whose `order_id` starts with `p_quote_id`.
- `update_quote_delivery_info(p_quote_id text, p_delivery jsonb)` — same predicate, writes only
  the `delivery_*` columns.
- `get_delivery_confirmation(p_token text)` — returns the `ConfirmationRecord` columns for the
  row matching `token`.
- `confirm_delivery(p_token text, p_confirmed_delivery boolean, ...)` — writes only the
  confirmation-submission columns for the row matching `token`; raises if no row matches.

## Known limitation carried over (not introduced by this hotfix)

`QuoteCheckout.tsx`'s only access control is knowledge of the `quoteId` string
(`QUOTE-<date>-<unix ts>`) — no email or secret token check, exactly as it was before this
hotfix. `get_quote_by_id` replicates that same predicate. What Stage 0a actually fixes is the
**bulk** exposure (anon could previously dump all 249 `orders` rows in one request); a single
quote is still only as safe as its id string is hard to guess, unchanged from today. Recommend a
follow-up (Stage 1) that switches `/quote-checkout/:quoteId` to an opaque per-quote token, the
same pattern `delivery_confirmations` already uses. Flagging, not fixing, per the "zero
regressions" scope of this hotfix — adding an email/token requirement now would be a product/UX
change and a functional-regression risk.

## Every anonymous call site changed

| File:Line (this branch) | Before | After |
|---|---|---|
| `src/services/cartInsertService.ts:78-81` | `.insert(cartRecords).select()` | `.insert(cartRecords)` — no `.select()`; returns the client-built records |
| `src/services/quoteOrderService.ts:76-80` | `.insert([orderRecord]).select().single()` | `.insert([orderRecord])` — no `.select()`; returns the client-built record |
| `src/services/specMaterialQuoteService.ts:163-167` | `.insert([orderRecord]).select().single()` | `.insert([orderRecord])` — no `.select()`; returns the client-built record |
| `src/services/orderInsertService.ts:153-156` (`insertOrderToDatabase`, the live guest-checkout insert path) | `.insert(orderRecords).select()` | `.insert(orderRecords)` — no `.select()`; returns `orderRecords` with a synthesized `id` (`order_id-index`) for use as a React key only |
| `src/pages/Checkout.tsx` (`testDatabaseInsertion`, hidden debug button) | `.insert(orderRecords).select()` | `.insert(orderRecords)` — no `.select()` |
| `src/pages/PaymentSuccess.tsx` (`handleCheckoutStyleDatabaseInsert`, hidden debug path) | `.insert(orderRecords).select()` | `.insert(orderRecords)` — no `.select()` |
| `src/pages/QuoteCheckout.tsx` (`fetchQuoteData`) | `.from('orders').select('*').like('order_id', quoteId+'%').eq('status','Quote')` | `.rpc('get_quote_by_id', { p_quote_id: quoteId })`, with a temporary raw-query fallback on `PGRST202` |
| `src/pages/QuoteCheckout.tsx` (`handleSaveDeliveryInfo`) | per-row `.from('orders').update({...}).eq('id', item.id)` | `.rpc('update_quote_delivery_info', { p_quote_id, p_delivery })`, with a temporary raw-update fallback on `PGRST202` |
| `src/pages/DeliveryConfirm.tsx` (load effect) | `.from('delivery_confirmations').select(...).eq('token', token).maybeSingle()` | `.rpc('get_delivery_confirmation', { p_token: token })`, with a temporary raw-query fallback on `PGRST202` |
| `src/pages/DeliveryConfirm.tsx` (`handleSubmit`) | `.from('delivery_confirmations').update({...}).eq('token', token)` | `.rpc('confirm_delivery', {...})`, with a temporary raw-update fallback on `PGRST202` |

Not changed (admin-only, gated by `DashboardLayout`'s `isAdmin` check + will be covered by the
new `is_admin()` DB policies): `src/services/orderService.ts` (all 16 methods),
`src/services/supplierService.ts`, `src/services/financialAnalysisService.ts`,
`src/services/quoteService.ts`, `src/components/dashboard/OrderDetailModal.tsx`'s
`delivery_confirmations` insert, `src/services/orderInsertService.ts`'s
`createManualOrderRecords`, and the dashboard stat widgets
(`CartStatsWidget`/`OrdersFinancialSummary`/`OrdersStatsWidget`/`QuotesStatsWidget`) — verified
every one of their call sites lives behind a page wrapped in `<DashboardLayout>`, which returns
early (no data fetch) unless `isAdmin` is true.

No `.upsert()` calls exist anywhere in `src/` that touch these tables.

No edge function in `supabase/functions/` uses the anon key to read/write `orders`,
`delivery_confirmations`, or `suppliers` — `verify-payment/index.ts` uses the anon key only for
`supabase.auth.getUser()`; every `.from('orders')` call in that function runs on a separate
client explicitly constructed with `SUPABASE_SERVICE_ROLE_KEY` (line ~275), which bypasses RLS
entirely and is unaffected by this migration. (`get-messages`/`mark-messages-read`/
`send-order-sms` use the anon key against `messages`, which is out of scope for this hotfix.)

`delivery-verify` (the edge function `DeliveryConfirm.tsx` calls for SMS/email code
verification) is **not in this repo** — it's deployed separately. The owner should confirm it
writes `verified_at` using the service-role key, not the anon key, since after this SQL ships
anon/authenticated has zero direct write access to `delivery_confirmations` outside the two new
RPCs.

## Test / tsc / build results

**`npx vitest run`**: 140/143 pass. The 3 failures are pre-existing and unrelated —
`src/services/products/exponentialPricing.test.ts` fails identically on `main` (confirmed by
running it there first). New tests added, all passing: `cartInsertService.test.ts` (3),
`quoteOrderService.test.ts` (4), `specMaterialQuoteService.test.ts` (3),
`orderInsertService.test.ts` (3), `QuoteCheckout.test.tsx` (2), `DeliveryConfirm.test.tsx` (3),
`rlsHotfixCompat.test.ts` (4) — asserting RPC names/args, that anonymous inserts no longer chain
`.select()`, and that the PGRST202 compat-shim fallback triggers correctly.

**`npx tsc --noEmit -p tsconfig.app.json`**: 29 error lines on this branch vs. 35 on `main` —
net improvement. All remaining errors are pre-existing classes already on `main`
(`OrderDetailModal.tsx`'s `delivery_confirmations` insert — same "table not in generated types"
issue, unrelated to this fix; `CrushedStoneLanding.tsx`; `MarketMaterialPage.tsx`). The temporary
compat-shim fallback in `DeliveryConfirm.tsx` reintroduces 2 of the 5 `delivery_confirmations`-
not-in-types errors `main` already had for that file (expected — it's the same raw query that
used to be there); this goes away entirely once the shim is deleted post-SQL-apply. Regenerate
`src/integrations/supabase/types.ts` after applying the SQL to clear these and the `(supabase as
any)` casts on the four new RPC calls (matches the existing pattern in `src/hooks/useAuth.ts` for
`check_user_admin_status`, which has the same "RPC not in generated types" issue today).

**`npx eslint <touched files>`**: matches `main`'s existing `@typescript-eslint/no-explicit-any`
style (this codebase does not currently enforce that rule as a hard gate — `main` already has 21
such errors across these same production files). This branch adds 4 new ones in production code
(`(supabase as any).rpc(...)` casts, same convention as `useAuth.ts`) and a number in the new
test files' mock builders (test-only `any`, same as the existing `priceUtils.test.ts`). No new
warnings beyond `main`'s pre-existing two `react-hooks/exhaustive-deps` warnings in
`PaymentSuccess.tsx` and `QuoteCheckout.tsx` (unchanged).

**`npm run build`**: succeeds. `public/sitemap.xml` is regenerated by the build (pre-existing
behavior, unrelated to this hotfix) and was reverted with `git checkout -- public/sitemap.xml`
after every build in this session.

## Risk list

1. **Highest risk, mitigate by minimizing the deploy→SQL-apply window**: `QuoteCheckout.tsx` /
   `DeliveryConfirm.tsx` rely on the `PGRST202` compat shim between steps 1 and 3. If that window
   stretches for days, these two pages keep working but keep being exactly as exposed as today
   for that entire time (their raw-query fallback has the same access-control shape as before).
   Apply the SQL as soon as step 2's smoke test passes.
2. **`delivery_confirmations` schema mismatch**: the table isn't tracked in this repo. The
   pre-flight `\d` check and the live `limit=0` column probe (done during this work) both
   support the assumed column list/types, but re-verify before applying — a mismatch would make
   `get_delivery_confirmation`/`confirm_delivery` error instead of falling back gracefully (they
   don't have a compat shim of their own once the RPC exists but errors internally — that's a
   real RPC failure, not a "missing function" PGRST202, so the app-side fallback won't catch it).
3. **`is_admin()` internals are unverified.** It's not defined in this repo (only in the live
   DB). The pre-flight check asks the owner to confirm it returns `true` for their account before
   relying on it for every admin policy in this migration.
4. **Legacy `/checkout` anon INSERT stays fully open** (`status: 'confirmed'`, no payment
   verification gate) — this hotfix deliberately does not change that, per the task brief. It
   remains the same payment-bypass risk the original audit flagged as finding #4(High), just
   unaffected by this specific hotfix. Track separately.
5. **`orders_anon_insert` is `with check (true)`** — unrestricted by design (matches "keep
   exactly as permissive as today"), so this migration does not reduce the INSERT-side attack
   surface at all, only the READ/UPDATE/DELETE side. Don't mistake applying this SQL for having
   fixed finding #3/#4 from the original audit.
