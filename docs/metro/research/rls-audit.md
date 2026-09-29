# `orders` / PII RLS Audit (S2-RLS-AUDIT)

Status: COMPLETE (live exposure confirmed, code inventory complete, staged plan + draft migrations
written). Resolves F5 from `metro-checkout-security-review.md` and extends scope to every
PII/money-bearing table the anon key can touch, plus one table (`delivery_confirmations`) that
review didn't know existed.

Branch: `feature/metro-ui`. No migrations applied, no writes performed against the live project.
Project: `losrkjvrcambvgijfism` (mygravelguy.com, LIVE).

## TL;DR

**F5 is confirmed and worse than "partially unconfirmed."** The live anon key can read the full
`orders` table (249 rows) and three other tables that have no RLS at all. A separate,
previously-undocumented table, `delivery_confirmations`, holds customer name/email/phone/GPS/
Stripe payment IDs behind a "secret token" that isn't actually enforced by any database policy —
anyone with the anon key can list every token and read every field for every row, no token needed.
`orders` itself has no `user_id`/ownership column, is written by ~40 client call sites (guest
checkout inserts, quote forms, and the entire admin dashboard), and includes an admin
`updateOrderStatus(orderId, status)` with no ownership check reachable straight from the anon REST
API. A hand-written policy file already sitting in the repo (`src/utils/productionDatabasePolicy.sql`,
never turned into a migration) shows someone already tried to lock this down once — its policies
would restrict `orders` to `authenticated` only, which **would break guest checkout, guest quote
lookup, and the "save cart" flow that depend on anon INSERT/SELECT today.** That's the central
constraint this plan is built around.

---

## Step 1 — Live exposure probe (read-only, `?select=id&limit=1` + `Range: 0-0`/`Prefer: count=exact`)

Anon key used: `VITE_SUPABASE_PUBLISHABLE_KEY` from the committed `.env` (public by design).
No writes, no RPC calls, no PII columns selected. `pg_policies` / `information_schema.tables` are
**not** reachable via PostgREST (`404 42P01 relation ... does not exist` — schema not exposed,
as expected).

| Table | Anon SELECT | Approx. row count | Notes |
|---|---|---|---|
| `orders` | **YES — exposed** | 249 | `id` + full row readable; confirmed via `206 Partial Content`, `Content-Range: 0-0/249` |
| `delivery_confirmations` | **YES — exposed** | 4 | Not in this repo at all (no migration, not in generated `types.ts`). Holds customer PII + Stripe payment id behind a UUID "token" that a plain anon SELECT bypasses entirely (see below) |
| `suppliers` | **YES — exposed** | 22 | Vendor name/email/phone/address/materials/service areas |
| `delivery_locations` | **YES — exposed (likely intentional)** | 196 | City/state/lat/lng/description only — no PII. Public delivery-area map data; still has zero RLS, should get an explicit `public_read` policy rather than relying on "no RLS = readable" |
| `order_status_history` | **YES — exposed** | 31 | `changed_by` (internal staff identifier), `old_status`/`new_status` — not referenced anywhere in client code (grep across `src/` = 0 hits), so this is pure DB-level drift with no code path currently exploiting it, but still open to any anon REST caller |
| `rate_limits` | **YES — exposed** | 3 | `client_id` + `function_name` — internal abuse-control bookkeeping; low direct sensitivity but leaks rate-limit internals and could aid evasion |
| `quote_analytics` (view) | **YES — exposed** | 27 | Aggregated revenue/conversion-rate business metrics, no PII |
| `customers` | Blocked (0 rows, `200`, `[]`) | — | Not referenced anywhere in `src/` client code. Signature (`200`/`[]`/`Content-Range: */0`) differs from the exposed tables' `206`/real-count signature — consistent with RLS filtering, not literal emptiness, but can't be proven without owner/service-role access |
| `leads` | Blocked (same signature) | — | Table exists live (confirmed by `200`, not a `42P01` "relation does not exist" error). Migration `20260206070534...sql` in this repo makes `leads` **admin-only for INSERT too** (`leads_admin_insert WITH CHECK (is_admin())`) — see "Unrelated bug" callout below |
| `messages` | Blocked (same signature) | — | Matches this repo's existing `is_admin()`-gated migration |
| `supplier_quotes` | Blocked (same signature) | — | Matches this repo's existing `is_admin()`-gated migration |
| `quote_links` | Blocked (same signature) | — | Not referenced anywhere in `src/` client code |
| `expenses` / `expense_categories` | Blocked (same signature) | — | Matches this repo's existing `is_admin()`-gated migration |

**Read the "blocked" rows carefully**: a `200 OK` with an empty array and `Content-Range: */0` is
*consistent with* RLS filtering out all rows for the anon role, but it is not distinguishable from
"the table is genuinely empty" using only the anon key (both look identical over REST). I did not
have write or service-role access to disambiguate further, per the task's read-only constraint.
Treat "blocked" as **probably RLS-protected**, not proven — but every one of the "exposed" rows
above returned a *different, unambiguous* signature (`206 Partial Content` with a real row and a
real `Content-Range` count), which **does** unambiguously prove no RLS (or a fully-permissive
anon-SELECT policy) on those six.

### The `delivery_confirmations` problem, specifically

`src/pages/DeliveryConfirm.tsx:242-246` (public route `/delivery-confirm?token=...`, reached via an
SMS/email link sent from `OrderDetailModal.tsx:496-500` after a delivery) does:
```ts
supabase.from('delivery_confirmations').select('token, order_id, ..., customer_phone, customer_email, stripe_payment_id').eq('token', token).maybeSingle()
```
This is exactly the "unguessable token instead of RLS" pattern — and it only works as a security
control if the database also refuses to return rows to anyone who *doesn't* supply the right token.
It doesn't: `curl .../delivery_confirmations?select=token&limit=1` with nothing but the public anon
key returned a real token and a real total count (4). Nothing stops `?select=*` from returning
every customer's name/phone/email/GPS coordinates/signature image URL/Stripe payment id for all 4
rows in one request — the app's `.eq('token', token)` filter is a client-side convention, not a
server-side guarantee. This table isn't tracked in this repo (no migration, not in `types.ts` —
confirmed via `SESSION_LOG.md:55,92`, which describes a column added directly through the Supabase
dashboard). **This is at least as severe as the `orders` gap** and needs its own RLS fix — folded
into the same migrations below since the correct fix (a `SECURITY DEFINER` token-lookup RPC) is
the same shape as the fix `orders`/`QuoteCheckout.tsx` needs.

---

## Step 2 — Code audit: every client-side access to a live-exposed table

### `orders` (~40 call sites)

| File:Line | Op | Who (route / guard) | Notes / replacement |
|---|---|---|---|
| `src/pages/Checkout.tsx:87-90` (`testDatabaseInsertion`) | INSERT | Anonymous, `/checkout`. Button is `className="hidden"` but the handler ships in the bundle | Dead test code with `status:'test'`. **Remove entirely** — not a real feature, just an extra anon-INSERT surface |
| `src/services/orderInsertService.ts:153-156` (`insertOrderToDatabase`) | INSERT (`status:'confirmed'`) | Anonymous, called from `PaymentSuccess.tsx:445` after client-side Stripe verification | **The core F5 exploit path.** Called after the client calls `verify-payment`, but nothing server-side gates *this* insert — a raw anon REST `INSERT` with `status:'confirmed'` and fabricated Stripe IDs works today, no payment required. Must move behind the payment-verification edge function (server-authoritative insert) once S1's `verify-payment-v2` lands; until then, narrow the anon INSERT policy to reject `status IN ('confirmed','paid')` from anon entirely (Stage 1) |
| `src/services/orderInsertService.ts:236-239` (`createManualOrderRecords`) | INSERT | Admin only — `ManualOrderForm.tsx:172,241` (`/dashboard/orders/new`) | Needs `is_admin()` INSERT policy (Stage 2) |
| `src/services/orderInsertService.ts:255-294` (`testEnhancedDatabaseInsert`) | INSERT | Dead code, invoked from `PaymentSuccess.tsx:765` behind a debug button | **Remove** — same class of issue as the Checkout.tsx test button |
| `src/pages/PaymentSuccess.tsx:700-703` ("checkout-style insert" debug path, F5's original citation) | INSERT (`status:'confirmed'`) | Anonymous, debug button on `/payment-success` | **Remove entirely.** Literally an anon INSERT of a fully "confirmed" order with attacker-controlled name/email/phone/address and zero payment check, gated by nothing but a hidden button in the bundle |
| `src/services/cartInsertService.ts:78-81` (`insertCartToDatabase`) | INSERT (`status:'cart'`) | Anonymous, "save cart" feature | **Legitimate anon flow — must keep working.** Narrow anon INSERT policy: allow only `status = 'cart'`, deny `total_price`/`quoted_price`/payment-related columns being set to anything but the client-computed cart total (can't fully prevent price tampering via RLS alone — that's a business-logic problem, not this audit's scope, but RLS can at least block `status` escalation) |
| `src/services/quoteOrderService.ts:76-79` (`createQuoteOrder`) | INSERT (`status:'Quote'`) | Anonymous, quote request forms across many landing pages | **Legitimate anon flow — must keep working.** Narrow anon INSERT: `status = 'Quote'`, `total_price = 0`, `unit_price = 0` |
| `src/services/specMaterialQuoteService.ts:163-167` (`createSpecMaterialQuote`) | INSERT (`status:'Quote'`) | Anonymous, contractor spec-materials quote form | Same as above |
| `src/pages/QuoteCheckout.tsx:92-96` (`fetchQuoteData`) | SELECT `*` by `order_id LIKE quoteId% AND status='Quote'` | **Anonymous**, `/quote-checkout/:quoteId` — reached via emailed quote link | **This is the anonymous-order-lookup case the task asked me to find.** Today, knowledge of the `quoteId` (a predictable-ish `QUOTE-<date>-<unix ts>` or `ORDER-...` string, echoed in URLs/localStorage) is the *only* access control. If `orders` SELECT gets locked to `authenticated`, this page breaks. **Fix: replace with `get_order_by_token()` RPC** (drafted below) — see "Required app change" below |
| `src/pages/QuoteCheckout.tsx:141-158` (`handleSaveDeliveryInfo`) | UPDATE delivery_* columns by `id` | Anonymous, same page | Same page, same exposure. Needs a matching `update_quote_delivery_info()` RPC or a narrow anon UPDATE policy scoped to `status='Quote' AND` a small delivery-field allowlist (excludes `total_price`, `status`, `stripe_*`, `sales_*`, `supplier_*`) |
| `src/services/quoteService.ts:36-57` (`QuoteService.sendQuoteFromExistingOrder`) | UPDATE (status→`Quote`) + SELECT | Admin only — called from `OrderDetailModal.tsx` (`/dashboard/orders`) | `is_admin()` policy (Stage 2) |
| `src/services/orderService.ts` — **entire `OrderService` class**, 16 methods incl. `fetchOrders`, `fetchOrderById`, `updateOrderFulfillmentStatus`, `updateOrderSalesPerson`, `updateOrderSalesCommission`, **`updateOrderStatus`** (line 402-422, the ownership-unchecked one F5 named), `updateOrderNotes`, `updateOrderSupplier`, `updateOrderQuoteNotes`, `updateOrderItem`, **`removeOrderItem`** (DELETE, line 538-555), `addOrderItem`, `updateDeliveryInfo`, `convertToOrder` | SELECT/UPDATE/INSERT/DELETE | **Admin dashboard only** — every call site is in `OrderEdit.tsx` (`/dashboard/orders/edit/:orderId`), `OrderDetailModal.tsx`, `OrdersTable.tsx`, `OrderItemsManager.tsx`, `ManualOrderForm.tsx`, `SalesPersonSelector.tsx`, `OrderTableFilters.tsx` — all rendered inside `<DashboardLayout>` | **`DashboardLayout`'s `isAdmin` check (`src/components/dashboard/DashboardLayout.tsx:73`) is a client-side UI gate only.** It does not, and cannot, stop a direct `curl`/REST call using the public anon key from hitting `updateOrderStatus`'s exact query (`update orders set status=X where order_id=Y`) — there is no route guard in `App.tsx` (no `<ProtectedRoute>` wrapper on any `/dashboard/*` route) and no ownership check in the function itself. **This entire class needs `is_admin()` UPDATE/DELETE/INSERT/SELECT policies (Stage 2)**; until then it is exploitable by anyone with the anon key, admin session or not |
| `src/services/supplierService.ts:300-303,326-328` (`getSupplierOrders`, `getSupplierStatsBatch`) | SELECT | Admin only — `/dashboard/suppliers` | `is_admin()` SELECT policy (Stage 2) |
| `src/services/financialAnalysisService.ts:65,104,162` | SELECT (financial aggregates incl. `total_price`, `supplier_charges`, `sales_commission`) | Admin only — `/dashboard/analyze`, gated additionally by `check_financial_admin_status` RPC | `is_admin()` (or a financial-admin-specific) SELECT policy (Stage 2) |
| `src/components/dashboard/{CartStatsWidget,OrdersFinancialSummary,OrdersStatsWidget,QuotesStatsWidget}.tsx` | SELECT (`fulfillment_status`, `total_price`) | Admin dashboard widgets | Same, Stage 2 |

### `delivery_confirmations` (2 call sites)

| File:Line | Op | Who | Notes |
|---|---|---|---|
| `src/components/dashboard/OrderDetailModal.tsx:496-500` | INSERT (token auto-generated by DB default) | Admin only, `/dashboard/orders` "send delivery confirmation" action | `is_admin()` INSERT policy |
| `src/pages/DeliveryConfirm.tsx:242-246` (SELECT), plus an `.update()` further down the same file setting `confirmed_at`/`confirmed_delivery`/`signature_url`/etc. by `token` | SELECT + UPDATE | **Anonymous**, `/delivery-confirm?token=...` | Both must move to `SECURITY DEFINER` RPCs keyed on the token argument (drafted below) rather than a plain RLS policy, because RLS can't restrict "you must already know this exact random value" — a permissive-enough-to-work anon SELECT/UPDATE policy on this table is *always* enumerable |

### `suppliers`, `delivery_locations`, `order_status_history`, `rate_limits`, `quote_analytics`

All read-only (SELECT) from the admin dashboard (`supplierService.ts`, `DashboardSuppliers`) except
`delivery_locations`, which is also read from the **public** `/delivery-map` route
(`src/components/DeliveryMap.tsx:29-31`) — that one's public exposure looks intentional (no PII in
the schema: city/state/lat/lng/description/slug) and should get an explicit `public_read` policy
(the same pattern already used for `market_aliases`/`market_materials` in
`20260201173806...sql`/`20260201173903...sql`) rather than being left with no RLS at all.
`order_status_history` and `rate_limits` have **zero client-code references** — nothing in `src/`
uses them — so they're pure schema drift with no current app dependency; safe to lock to
`is_admin()`-only (or service-role-only for `rate_limits`, which should arguably never be
client-readable even for admins) with no app-side changes required.

### How admin is determined (for writing the policies)

- `is_admin()` — a no-arg `SECURITY DEFINER` SQL/plpgsql function, **already the established pattern**
  in this repo's own migrations (`expenses`, `expense_categories`, `messages`, `leads`,
  `supplier_quotes`, `market_aliases`, `market_materials` all use `USING (is_admin())`). Its
  definition is **not** in this repo (not in any `supabase/migrations/*.sql`, not in
  `src/utils/*.sql`) — it exists only in the live database. Given the sibling function
  `check_user_admin_status` (below) takes `auth.uid()` as an implicit check, it's reasonable to
  assume `is_admin()` does the same (checks `auth.uid()` against an admin table/list using the JWT
  directly), but this could not be confirmed without dashboard access. **Recommendation: use
  `is_admin()` for every new admin policy below, for consistency with the rest of the schema** —
  don't introduce a second admin-check convention.
- `check_user_admin_status(user_email TEXT)` / `check_financial_admin_status(user_email TEXT)` —
  defined in `src/utils/adminCheckFunction.sql` (not a tracked migration either) and
  `supabase/migrations/20250721031934-...sql`. Both are `SECURITY DEFINER`, both require
  `auth.uid() IS NOT NULL`, but **both trust a client-supplied `user_email` TEXT argument** rather
  than reading the email off the JWT (`auth.jwt() ->> 'email'`) internally. `src/hooks/useAuth.ts:91`
  and `src/hooks/useFinancialAuth.ts:19` call these with `user.email` from the *client's own*
  Supabase Auth session object, which is trustworthy in that specific call site (it comes from a
  verified session), but **if either function is ever referenced inside an RLS policy, the policy
  must pass `auth.jwt() ->> 'email'`, never a value from the request body/params** — otherwise a
  policy like `USING (check_user_admin_status(current_setting('request.jwt.claims')::json->>'x')::boolean)`
  could be tricked by anyone able to influence that input. Not currently exploitable (nothing in
  this repo's RLS calls these two functions inside a policy), but worth flagging so nobody adds
  `check_user_admin_status(<anything client-controlled>)` to a future policy.
- There is no `user_roles`/`admins` table in the schema (`types.ts` Tables list has no such table);
  admin status is entirely hardcoded email arrays inside the `SECURITY DEFINER` functions.
- `orders` has **no `user_id` column** (confirmed against the full `Row` type in `types.ts`) — guest
  orders are identified only by `delivery_email`/`billing_email`. Any "customer owns their own
  order" RLS policy for a future authenticated-customer feature must match on
  `delivery_email = auth.jwt() ->> 'email' OR billing_email = auth.jwt() ->> 'email'`, exactly as
  `src/utils/productionDatabasePolicy.sql` already drafted (see below).

### Prior art already in the repo

- **`supabase/migrations/*` already establishes the `is_admin()` + `ALTER TABLE ... ENABLE ROW LEVEL
  SECURITY` + `CREATE POLICY ... admin_select/insert/update/delete` pattern** for `expenses`,
  `expense_categories`, `messages`, `leads`, `supplier_quotes`, `market_aliases`,
  `market_materials`. The migrations below reuse this pattern verbatim for `orders` and the other
  exposed tables, for consistency.
- **`src/utils/productionDatabasePolicy.sql`** is a hand-written, *never-migrated* draft that
  already tried to fix `orders`: `TO authenticated`-only INSERT/SELECT, `admins_can_view_all_orders`/
  `admins_can_update_orders` via a *different* admin check (`auth.users.raw_user_meta_data ->>
  'is_admin'`, not `is_admin()` or the email-array functions — a third, inconsistent admin
  mechanism), and a blanket `service_role_can_insert_orders`. **This file was clearly never applied**
  — the live probe proves anon can still SELECT `orders` freely, which this policy set would
  prevent. It also **would have broken guest checkout, `QuoteCheckout.tsx`, and `cartInsertService.ts`
  outright** had it been applied, since none of those are `TO authenticated`. Treat this file as a
  useful reference for intent, not as something to resurrect as-is — the migrations below supersede
  it with a design that keeps the real anonymous flows working.
- **Unrelated bug worth flagging to the owner (not a security exposure, the opposite):**
  `20260206070534...sql`'s `leads_admin_insert WITH CHECK (is_admin())` makes **all** anonymous
  `leads` inserts fail today — but `ContactQuoteForm.tsx`, `ManagedQuoteModule.tsx`,
  `cartInsertService.ts`, and `specMaterialQuoteService.ts` all call `createLead`/
  `createLeadFromForm` from anonymous pages and swallow the resulting error as "non-blocking"
  (`cartInsertService.ts:119` logs `'Failed to create lead from cart (non-blocking)'` and moves on).
  If this migration is actually live (the RLS probe for `leads` is consistent with it being live),
  the supplier-quotes pipeline is silently not receiving leads from any of these anonymous entry
  points and nobody would notice because the failure is swallowed. **Out of scope for this audit's
  fix** (it's a functionality bug, not an exposure) but worth a separate ticket — and worth keeping
  in mind when designing the `orders` anon-INSERT policy below, so the same silent-failure trap
  isn't repeated.

---

## Risk ranking

| Rank | Finding | Severity | Why |
|---|---|---|---|
| 1 | `delivery_confirmations` — anon can enumerate every token and read all customer PII + Stripe payment id + GPS/signature data for every delivery, and the "secret token" design gives zero real protection | **Critical** | Direct PII + payment-identifier leak, zero effort required, not even the `orders` table itself |
| 2 | `orders` — anon can `SELECT *` on all 249 rows: every guest's name/email/phone/delivery address/order total/Stripe session id | **Critical** | Direct PII + business data leak at scale, matches/confirms F5 |
| 3 | `orders` — `OrderService.updateOrderStatus`/`removeOrderItem`/every other admin-dashboard mutator has no server-side ownership or admin check; reachable by anon REST call regardless of the dashboard's client-side `isAdmin` gate | **Critical** | Full order tampering/deletion/fake-fulfillment, no auth required at the DB layer |
| 4 | `orders` — `insertOrderToDatabase`/PaymentSuccess.tsx's "checkout-style insert" let anyone create a `status:'confirmed'` order with no real payment | **High** (re-confirms F5/F1-class risk for the *legacy* checkout, separate from the already-reviewed metro path) | Payment bypass via direct INSERT, no Stripe interaction needed |
| 5 | `suppliers` — anon can read vendor contacts + pricing relationships | **Medium-High** | Competitive/business-relationship exposure, not customer PII |
| 6 | `order_status_history`, `rate_limits` — anon-readable, unused by any client code | **Low-Medium** | No current exploit path via the app itself, but still an open DB-level hole; `rate_limits` leakage could aid abuse-evasion |
| 7 | `delivery_locations`, `quote_analytics` — anon-readable | **Low** | No PII; `delivery_locations` exposure looks intentional (public map), `quote_analytics` is aggregate business metrics only |

---

## Staged rollout

### Stage 0 — No-regression: enable RLS, lock down what nothing anonymous needs, add token/lookup RPCs for what does

**Goal:** close every finding above **without breaking any currently-working anonymous flow.**
Verified anonymous flows that must keep working through Stage 0:
- Guest checkout INSERT (`cartInsertService.ts`, `orderInsertService.ts`, `Checkout.tsx`) — still
  needed until S1's `verify-payment-v2`/`create-auth-hold-v2` ship (tracked separately, not yet in
  this repo as of this audit).
- Guest quote-request INSERT (`quoteOrderService.ts`, `specMaterialQuoteService.ts`).
- `QuoteCheckout.tsx`'s anonymous read/update of a specific quote by `quoteId` (email link).
- `DeliveryConfirm.tsx`'s anonymous read/update of a specific delivery confirmation by `token`
  (SMS/email link).

**SQL:** see `supabase/migrations-drafts/20260929000100_rls_stage0_draft.sql`. Summary:
1. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on `orders`, `delivery_confirmations`, `suppliers`,
   `delivery_locations`, `order_status_history`, `rate_limits`.
2. `is_admin()`-gated `SELECT`/`INSERT`/`UPDATE`/`DELETE` policies on all six, matching the existing
   `expenses`/`leads` pattern (covers the entire admin dashboard's existing access — Stage 0 already
   fixes risk #3, #5, #6 above without any app change, since the dashboard is already only used by
   authenticated admins in practice).
3. `delivery_locations` additionally gets `delivery_locations_public_read USING (true)` (matches
   `market_aliases`' pattern) since that exposure is intentional.
4. Narrow anon `INSERT` policies on `orders` scoped by `status`:
   - `orders_anon_insert_cart`: `TO anon` `WITH CHECK (status = 'cart')`.
   - `orders_anon_insert_quote`: `TO anon` `WITH CHECK (status = 'Quote' AND total_price = 0 AND unit_price = 0)`.
   - **Deliberately no anon INSERT for `status IN ('confirmed','paid','authorized')`** — closes
     risk #4 immediately. This *will* break `orderInsertService.ts:insertOrderToDatabase` and
     `PaymentSuccess.tsx`'s primary confirm-order path for the **legacy** (non-metro)
     `/checkout` → `/payment-success` flow. That flow is currently live for non-metro traffic, so
     this is a real, immediate app change, not a future one — see "Required app changes" below.
     (The already-reviewed metro path is unaffected either way: it never does a client-side
     `orders` insert at all, per `metro-checkout-security-review.md`'s F3 resolution.)
5. `get_order_by_token(p_order_id text, p_email text) RETURNS SETOF orders` — `SECURITY DEFINER`,
   matches on `order_id ILIKE p_order_id || '%' AND status = 'Quote' AND (delivery_email = p_email
   OR billing_email = p_email)`. Replaces `QuoteCheckout.tsx`'s direct SELECT.
6. `update_quote_delivery_info(p_order_id text, p_email text, p_delivery jsonb) RETURNS void` —
   `SECURITY DEFINER`, re-validates the same ownership predicate before updating only the
   delivery_* columns. Replaces `QuoteCheckout.tsx`'s direct UPDATE.
7. `get_delivery_confirmation(p_token uuid) RETURNS SETOF delivery_confirmations` and
   `confirm_delivery(p_token uuid, p_confirmed boolean, p_signature_url text, ...) RETURNS void` —
   both `SECURITY DEFINER`, both take the token as an explicit argument so a plain `SELECT *` can
   never enumerate rows (the RLS policy on the table itself denies anon entirely; only these two
   functions, which check the token match internally, can return anything). Replaces
   `DeliveryConfirm.tsx`'s direct SELECT/UPDATE.
8. `orders_anon_insert_cart`/`orders_anon_insert_quote` deliberately do **not** block anon `SELECT`
   on `orders` for rows the inserting session doesn't own, because PostgREST's `.insert().select()`
   pattern (used by `cartInsertService.ts:78-81`, `quoteOrderService.ts:76-79`,
   `specMaterialQuoteService.ts:163-167`) needs to read back the row it just inserted. `RETURNING`
   via `INSERT ... SELECT` is governed by the `INSERT` policy's `WITH CHECK`, not a separate
   `SELECT` policy grant, in Postgres RLS — so this is safe (a session can read back only the exact
   row it just inserted, in the same statement) without adding any broader anon `SELECT` grant.

**App changes required for Stage 0** (specified precisely, not implemented by this agent — ownership
is `docs/metro/research/rls-audit.md` + migrations only):
- `src/services/orderInsertService.ts:15` (`insertOrderToDatabase`) and
  `src/pages/PaymentSuccess.tsx:445` (its caller) — the legacy checkout's client-side
  `status:'confirmed'` insert will start failing (`42501 insufficient_privilege`) the moment Stage 0
  ships. **This must be coordinated with whoever owns the legacy (non-metro) checkout path**: either
  (a) gate this insert behind a new/existing server-side verify-and-insert edge function (mirroring
  what S1 is building for metro) before Stage 0 ships, or (b) accept a temporary anon
  `WITH CHECK (status = 'confirmed')` policy in Stage 0 (re-opens risk #4 but keeps legacy checkout
  working) and remove it in Stage 1 once the server-side path exists. **Recommend (a)** — ask the
  owner which legacy-checkout owner/agent should pick this up; it's the same shape of fix S1 already
  did for metro (`create-metro-checkout` → Stripe metadata → `verify-metro-payment`/
  `metro-stripe-webhook` deferred insert), just applied to `/checkout` instead of the metro flow.
- `src/pages/Checkout.tsx:57-111` (`testDatabaseInsertion`) and its "hidden" button at
  `Checkout.tsx:705-716`, plus `src/services/orderInsertService.ts:255-294`
  (`testEnhancedDatabaseInsert`) and `src/pages/PaymentSuccess.tsx:765` (its caller) and
  `PaymentSuccess.tsx:600-736` (the "checkout-style insert" debug path) — **delete these**. They're
  dead debug code, not a real feature, and every one of them will start throwing RLS errors under
  Stage 0/1 regardless; better to remove the anon-INSERT surface than leave broken debug buttons.
- `src/pages/QuoteCheckout.tsx:92-96` — replace
  `supabase.from('orders').select('*').like('order_id', \`${quoteId}%\`).eq('status','Quote')` with
  `supabase.rpc('get_order_by_token', { p_order_id: quoteId, p_email: <email the customer enters or
  that's embedded in the link> })`. **Needs a product decision**: today the page trusts the URL
  `quoteId` alone with no email/secret check — the RPC as drafted requires an email too, which means
  either (i) the emailed quote link needs to embed the customer's email as a second URL param, or
  (ii) add an email-confirmation input on the page before the RPC call, or (iii) issue a proper
  random token (like `delivery_confirmations` does) instead of relying on `QUOTE-<date>-<ts>`
  predictability. **(iii) is the more robust fix** — recommend generating an opaque token at quote-send
  time and switching the URL to `/quote-checkout/:token` instead of `/quote-checkout/:quoteId`, but
  that's a larger product change than this audit should unilaterally decide; flagging the tradeoff
  for the owner.
- `src/pages/QuoteCheckout.tsx:141-158` — replace the direct `.update()` loop with a call to
  `update_quote_delivery_info` RPC, same ownership-parameter question as above.
- `src/pages/DeliveryConfirm.tsx:242-246` and its later `.update(...)` call — replace both with the
  `get_delivery_confirmation`/`confirm_delivery` RPCs. Lower product risk than the quote-checkout
  case since the token here is already a real random UUID (not a predictable string) — this is a
  pure hardening change with no UX tradeoff.

**Test plan:**
- Local/staging: `supabase db reset` (or a Supabase branch) with the draft migrations applied, then
  manually exercise: guest add-to-cart → save cart (`cartInsertService`), guest quote-request forms
  (`quoteOrderService`, `specMaterialQuoteService`), admin login → `/dashboard/orders` (list, filter,
  edit, delete an item, change status, change supplier), `/dashboard/expenses`,
  `/dashboard/suppliers`, `/dashboard/analyze` — confirm all still work for an authenticated admin
  and all correctly fail (`42501` or empty result) for a logged-out/non-admin session.
- `curl` against the branch/staging REST endpoint with only the anon key: repeat this audit's Step 1
  probe and confirm every previously-exposed table now returns `403`/empty for `SELECT`, and that
  `INSERT` into `orders` only succeeds for `status IN ('cart','Quote')` payloads.
- Once the app changes above land: manually walk `QuoteCheckout.tsx` and `DeliveryConfirm.tsx` end
  to end against staging with the new RPCs.
- Full regression: `npx vitest run`, `npx tsc --noEmit -p tsconfig.app.json` (existing test/lint
  gates already used by the metro-checkout hardening pass).

**Rollback:** every `CREATE POLICY`/`CREATE FUNCTION` in the draft has a paired `DROP` in a comment
block at the top of the file; `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` reverts each table to
today's (exposed) behavior if something breaks in a way that can't be fixed forward quickly.

### Stage 1 — After S1's v2 cutover: remove anon INSERT/UPDATE on `orders` except narrow cart/quote cases

Once `verify-payment-v2`/`create-auth-hold-v2` (or the legacy-checkout equivalent from Stage 0's
app-change item) moves paid-order creation fully server-side (service-role key, not anon), remove
whatever temporary `status='confirmed'` anon INSERT allowance Stage 0 had to keep for compatibility
(if option (b) was chosen instead of (a)). Also tighten the `orders_anon_insert_cart`/
`orders_anon_insert_quote` `WITH CHECK` clauses once real column-level abuse patterns are understood
from Stage 0 production logs (e.g., cap `quantity`, require `delivery_email IS NOT NULL`, block
`tags`/`sales_commission`/`supplier_charges` from ever being set by `anon`, which the current
policies already implicitly block by omission but should be made explicit — PostgREST/RLS
`WITH CHECK` doesn't restrict *which columns* an INSERT can set the way a column grant does, so this
needs either explicit `WITH CHECK` predicates on every sensitive column being `NULL`/its default, or
a `SECURITY DEFINER` RPC replacing the raw INSERT entirely, mirroring what metro's
`create-metro-checkout` already does). See `20260929000200_rls_stage1_draft.sql` for the concrete
`WITH CHECK` tightening; this stage's SQL is written defensively now but its exact column list
should be revisited against Stage 0's real traffic before applying.

**App changes:** none expected if Stage 0's option (a) was taken (server-side insert already
replaced the client path). If option (b), `orderInsertService.ts`/`PaymentSuccess.tsx` need the same
server-side migration Stage 0 deferred.

**Test plan / rollback:** same shape as Stage 0 — staging dry run + REST probe + full regression
suite; rollback SQL included as comments in the draft file.

### Stage 2 — Tighten remaining: admin dashboard fully behind `is_admin()`

Stage 0 already added `is_admin()` policies for every dashboard-only operation on `orders`,
`delivery_confirmations`, `suppliers`, `order_status_history`, `rate_limits` (there was no anon
flow to preserve for these, so Stage 0 and Stage 2 collapse into one step for them). Stage 2's
remaining work is process, not SQL: revisit whether `rate_limits` should be readable by `is_admin()`
at all (recommend `service_role`-only — no legitimate UI need to show rate-limit bookkeeping to a
human admin) and whether the admin dashboard's ~16-method `OrderService` class should eventually
move behind edge functions with the service-role key instead of direct client-to-Postgres calls
(reduces blast radius if `is_admin()`'s definition is ever loosened by mistake, and centralizes
audit logging) — noted as a forward-looking recommendation, not drafted as SQL since it's an
architecture change, not an RLS gap.

---

## Migration drafts (NOT applied)

- `supabase/migrations-drafts/20260929000100_rls_stage0_draft.sql`
- `supabase/migrations-drafts/20260929000200_rls_stage1_draft.sql`
- `supabase/migrations-drafts/20260929000300_rls_stage2_draft.sql`

All three are idempotent (`DROP POLICY IF EXISTS` / `CREATE OR REPLACE FUNCTION` /
`DROP FUNCTION IF EXISTS ... CASCADE` before recreate) and carry rollback SQL in a header comment.
**Do not apply without owner review** — Stage 0 in particular has an open product question
(`QuoteCheckout.tsx`'s token/email design) that affects the exact RPC signature.
