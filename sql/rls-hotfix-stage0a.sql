-- ============================================================================================
-- RLS HOTFIX — Stage 0a: stop the anonymous READ leak, zero functional regressions
-- Branch: hotfix/orders-rls | Agent: H1-RLS-HOTFIX
-- Project: losrkjvrcambvgijfism (mygravelguy.com, LIVE)
--
-- Do NOT run this against production until:
--   1. The app changes on this branch (see docs/security/RLS-HOTFIX-RUNBOOK.md) are merged and
--      deployed, AND verified working against TODAY'S (pre-SQL) database state.
--   2. You have run the PRE-FLIGHT CHECKS below and confirmed every assumption this file makes.
--   3. You are doing this during a quiet hour with the rollback file
--      (sql/rls-hotfix-stage0a-rollback.sql) open and ready.
--
-- WHAT THIS DOES NOT DO (by design — see the H1-RLS-HOTFIX task brief):
--   - Does NOT narrow anonymous INSERT on `orders` by status. The live checkout still inserts
--     "confirmed" orders straight from the browser (src/services/orderInsertService.ts,
--     called from PaymentSuccess.tsx) because the server-side verify-payment path has a known
--     bug (out of scope here). Narrowing anon INSERT is Stage 1, after that's fixed.
--   - Does NOT touch `delivery_locations` — it has no PII (city/state/lat/lng/description) and
--     its anon-read exposure is intentional (/delivery-map). Left exactly as-is.
--   - Does NOT touch anything outside: orders, delivery_confirmations, suppliers,
--     order_status_history, rate_limits, quote_analytics.
--
-- WHAT THIS CLOSES:
--   - Anonymous SELECT/UPDATE/DELETE on `orders` (249 rows of customer PII + Stripe ids were
--     readable by anyone with the public anon key — F5).
--   - `delivery_confirmations` had ZERO RLS — anon could enumerate every token and every
--     customer's name/email/phone/GPS/signature/Stripe payment id with a plain `select=*`, no
--     token needed. Now denied entirely at the table level; served only through two
--     SECURITY DEFINER RPCs that require the exact token as an argument.
--   - `suppliers`, `order_status_history`, `rate_limits`: were fully anon-readable with no RLS
--     at all. Now admin-only (rate_limits: no legitimate human-admin need either, but kept
--     admin-readable for now per the audit's Stage 2 note — service_role already bypasses RLS
--     for the edge functions that actually write it).
--   - `quote_analytics` view: anon/authenticated SELECT revoked. Nothing in src/ currently reads
--     this view (grep confirmed zero call sites), so this is a pure close with no app dependency.
--
-- ============================================================================================
-- PRE-FLIGHT CHECKS — run every one of these in the Supabase SQL editor FIRST and read the
-- results before applying anything below. This migration was written from the app code in this
-- repo, but `delivery_confirmations` is NOT tracked in any migration or in src/integrations/
-- supabase/types.ts (it was created directly against the live DB — see SESSION_LOG.md). Its
-- column list/types below are inferred from every client call site that reads/writes it
-- (src/pages/DeliveryConfirm.tsx, src/components/dashboard/OrderDetailModal.tsx) and are
-- DEFENSIVE, not verified against the live schema.
-- ============================================================================================

-- 1. Confirm delivery_confirmations' real columns/types before trusting the RPCs near the
--    bottom of this file. If any column below is missing or a different type, EDIT the
--    get_delivery_confirmation / confirm_delivery function bodies to match before applying.
--      \d public.delivery_confirmations
--    Expected (inferred): token, order_id, confirmed_at, confirmed_delivery, verified_at,
--    product_name, quantity_tons, delivery_address, delivery_date, customer_name,
--    stripe_payment_id, customer_phone, customer_email, photo_url, signature_url, rating,
--    review_text, confirmed_location, confirmed_user_agent.

-- 2. Confirm is_admin() exists, is SECURITY DEFINER, and returns true for YOUR admin account
--    while logged in as that account (run as the authenticated admin user, e.g. via the
--    Supabase SQL editor "Run as" / or via the app's browser console with the admin session):
--      select proname, prosecdef from pg_proc where proname = 'is_admin';
--      select is_admin();  -- must return true when called with an admin JWT

-- 3. Confirm no policies already exist with these names (this migration uses `drop policy if
--    exists` so it's safe either way, but worth knowing what's live today):
--      select schemaname, tablename, policyname, cmd, roles
--      from pg_policies
--      where tablename in ('orders','delivery_confirmations','suppliers',
--                           'order_status_history','rate_limits');

-- 4. Confirm today's exposure matches the audit before/after with the read-only probe script:
--      scripts/security/probe-anon-exposure.sh  (run before AND after applying this file)

-- 5. Confirm RLS is currently OFF on these tables (expected, per the live probe):
--      select relname, relrowsecurity from pg_class
--      where relname in ('orders','delivery_confirmations','suppliers',
--                         'order_status_history','rate_limits')
--        and relnamespace = 'public'::regnamespace;

-- ============================================================================================
-- ROLLBACK: see sql/rls-hotfix-stage0a-rollback.sql for the full, tested-shape revert. Summary:
-- it drops every policy/function created below and disables RLS on all six tables, restoring
-- today's (exposed) behavior exactly, so the pre-hotfix app code (if rolled back too) keeps
-- working.
-- ============================================================================================

begin;

-- --------------------------------------------------------------------------------------------
-- orders
-- --------------------------------------------------------------------------------------------
alter table public.orders enable row level security;

drop policy if exists "orders_admin_select" on public.orders;
drop policy if exists "orders_admin_insert" on public.orders;
drop policy if exists "orders_admin_update" on public.orders;
drop policy if exists "orders_admin_delete" on public.orders;
drop policy if exists "orders_anon_insert" on public.orders;
-- drop the stage-0-draft names too, in case that draft was ever partially applied by hand
drop policy if exists "orders_anon_insert_cart" on public.orders;
drop policy if exists "orders_anon_insert_quote" on public.orders;

-- Admin dashboard (OrderService, SupplierService.getSupplierOrders, financialAnalysisService,
-- dashboard widgets, ManualOrderForm) keeps working unchanged for anyone is_admin() is true for.
create policy "orders_admin_select" on public.orders
  for select
  using (is_admin());

create policy "orders_admin_insert" on public.orders
  for insert
  with check (is_admin());

create policy "orders_admin_update" on public.orders
  for update
  using (is_admin())
  with check (is_admin());

create policy "orders_admin_delete" on public.orders
  for delete
  using (is_admin());

-- rls-hotfix STAGE 0a: anonymous INSERT stays EXACTLY as permissive as today (no status
-- narrowing — that's Stage 1, after the legacy checkout's client-side "confirmed" insert is
-- moved server-side). This covers: cartInsertService.ts (status='cart'), quoteOrderService.ts /
-- specMaterialQuoteService.ts (status='Quote'), and orderInsertService.ts/PaymentSuccess.tsx
-- (status='confirmed' — the guest checkout path that must keep working).
create policy "orders_anon_insert" on public.orders
  for insert
  to anon, authenticated
  with check (true);

-- Deliberately NO anon/non-admin-authenticated SELECT, UPDATE, or DELETE policy on `orders`.
-- This is the actual F5 fix: today anyone with the public anon key can `SELECT *` all 249 rows
-- and call OrderService's admin mutators (updateOrderStatus, removeOrderItem, ...) with no
-- ownership check at all. QuoteCheckout.tsx's anonymous quote lookup/update is served by the
-- SECURITY DEFINER RPCs below instead of a raw table grant.

-- --------------------------------------------------------------------------------------------
-- get_quote_by_id / update_quote_delivery_info
--   Replace QuoteCheckout.tsx's raw `.from('orders').select('*').like('order_id', quoteId+'%')`
--   and its raw per-row `.update()` loop (src/pages/QuoteCheckout.tsx fetchQuoteData /
--   handleSaveDeliveryInfo). Both are SECURITY DEFINER so they can read/write `orders` even
--   though anon has no table-level SELECT/UPDATE grant; both re-apply the exact same predicate
--   the removed raw query used (`order_id` prefix + `status = 'Quote'`).
--
--   KNOWN LIMITATION (unchanged from today, not introduced by this hotfix): quoteId
--   (`QUOTE-<date>-<unix ts>`) is the ONLY access control here, same as the raw SELECT it
--   replaces — there is no email/token check. This hotfix intentionally does not add one
--   (that would be a product/UX change and a functional regression risk, out of scope for a
--   zero-regression hotfix). What Stage 0a actually fixes is the BULK exposure: before this
--   migration, anyone with the anon key could dump all 249 rows of `orders` in one request;
--   after it, reading a single quote still requires already knowing/guessing that quote's id
--   string, exactly as before. Recommend Stage 1 switch to an opaque per-quote token (see
--   docs/security/RLS-HOTFIX-RUNBOOK.md).
--
--   Returns only the columns QuoteCheckout.tsx's QuoteItem interface actually reads — not
--   stripe_session_id/stripe_payment_intent_id/billing_*/sales_*/supplier_*/tags.
-- --------------------------------------------------------------------------------------------
drop function if exists public.get_quote_by_id(text);

create or replace function public.get_quote_by_id(p_quote_id text)
returns table (
  id text,
  order_id text,
  product_id text,
  quantity numeric,
  unit text,
  unit_price numeric,
  total_price numeric,
  delivery_name text,
  delivery_email text,
  delivery_phone text,
  delivery_street text,
  delivery_city text,
  delivery_state text,
  delivery_zip text,
  delivery_date text,
  delivery_time_preference text,
  delivery_instructions text,
  quote_expires_at text,
  quote_notes text,
  notes text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    o.id::text,
    o.order_id,
    o.product_id,
    o.quantity::numeric,
    o.unit,
    o.unit_price::numeric,
    o.total_price::numeric,
    o.delivery_name,
    o.delivery_email,
    o.delivery_phone,
    o.delivery_street,
    o.delivery_city,
    o.delivery_state,
    o.delivery_zip,
    o.delivery_date,
    o.delivery_time_preference,
    o.delivery_instructions,
    o.quote_expires_at,
    o.quote_notes,
    o.notes
  from public.orders o
  where o.order_id ilike (p_quote_id || '%')
    and o.status = 'Quote';
$$;

revoke all on function public.get_quote_by_id(text) from public;
grant execute on function public.get_quote_by_id(text) to anon, authenticated;

drop function if exists public.update_quote_delivery_info(text, jsonb);

create or replace function public.update_quote_delivery_info(
  p_quote_id text,
  p_delivery jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.orders
  set
    delivery_name = coalesce(p_delivery->>'delivery_name', delivery_name),
    delivery_email = coalesce(p_delivery->>'delivery_email', delivery_email),
    delivery_phone = coalesce(p_delivery->>'delivery_phone', delivery_phone),
    delivery_street = coalesce(p_delivery->>'delivery_street', delivery_street),
    delivery_city = coalesce(p_delivery->>'delivery_city', delivery_city),
    delivery_state = coalesce(p_delivery->>'delivery_state', delivery_state),
    delivery_zip = coalesce(p_delivery->>'delivery_zip', delivery_zip),
    delivery_date = coalesce(p_delivery->>'delivery_date', delivery_date),
    delivery_time_preference = coalesce(p_delivery->>'delivery_time_preference', delivery_time_preference),
    delivery_instructions = coalesce(p_delivery->>'delivery_instructions', delivery_instructions),
    updated_at = now()
  where order_id ilike (p_quote_id || '%')
    and status = 'Quote';
end;
$$;

revoke all on function public.update_quote_delivery_info(text, jsonb) from public;
grant execute on function public.update_quote_delivery_info(text, jsonb) to anon, authenticated;

-- --------------------------------------------------------------------------------------------
-- delivery_confirmations
--   Not tracked anywhere else in this repo (no prior migration, not in generated types.ts) —
--   created directly against the live DB per SESSION_LOG.md. Live probe confirmed zero RLS:
--   anon `select=token&limit=1` returned a real token + real count (4 rows). The app's own
--   `.eq('token', token)` filter in DeliveryConfirm.tsx was a client-side convention only; RLS
--   now denies anon/authenticated SELECT/UPDATE/INSERT/DELETE entirely at the table level. The
--   "I already know my token" case is served through the two SECURITY DEFINER RPCs below,
--   which take the token as an explicit argument and are the ONLY anon-reachable path to this
--   table's data.
--
--   ⚠ SEE PRE-FLIGHT CHECK #1 — verify these columns/types against `\d delivery_confirmations`
--   before applying. The RPC bodies below cast defensively (::text/::numeric/::timestamptz) to
--   reduce (not eliminate) the chance of a type mismatch against the real schema.
-- --------------------------------------------------------------------------------------------
alter table public.delivery_confirmations enable row level security;

drop policy if exists "delivery_confirmations_admin_select" on public.delivery_confirmations;
drop policy if exists "delivery_confirmations_admin_insert" on public.delivery_confirmations;
drop policy if exists "delivery_confirmations_admin_update" on public.delivery_confirmations;
drop policy if exists "delivery_confirmations_admin_delete" on public.delivery_confirmations;

-- Admin dashboard's "send delivery confirmation" action (OrderDetailModal.tsx) does
-- `.insert(snapshot).select('token').single()` — needs both INSERT and SELECT for admins so
-- the RETURNING clause can hand back the generated token.
create policy "delivery_confirmations_admin_select" on public.delivery_confirmations
  for select
  using (is_admin());

create policy "delivery_confirmations_admin_insert" on public.delivery_confirmations
  for insert
  with check (is_admin());

create policy "delivery_confirmations_admin_update" on public.delivery_confirmations
  for update
  using (is_admin())
  with check (is_admin());

create policy "delivery_confirmations_admin_delete" on public.delivery_confirmations
  for delete
  using (is_admin());

drop function if exists public.get_delivery_confirmation(text);
drop function if exists public.get_delivery_confirmation(uuid);

create or replace function public.get_delivery_confirmation(p_token text)
returns table (
  token text,
  order_id text,
  confirmed_at timestamptz,
  confirmed_delivery boolean,
  verified_at timestamptz,
  product_name text,
  quantity_tons numeric,
  delivery_address text,
  delivery_date text,
  customer_name text,
  stripe_payment_id text,
  customer_phone text,
  customer_email text
)
language sql
security definer
set search_path = public
stable
as $$
  select
    dc.token::text,
    dc.order_id,
    dc.confirmed_at,
    dc.confirmed_delivery,
    dc.verified_at,
    dc.product_name,
    dc.quantity_tons::numeric,
    dc.delivery_address,
    dc.delivery_date,
    dc.customer_name,
    dc.stripe_payment_id,
    dc.customer_phone,
    dc.customer_email
  from public.delivery_confirmations dc
  where dc.token::text = p_token;
$$;

revoke all on function public.get_delivery_confirmation(text) from public;
grant execute on function public.get_delivery_confirmation(text) to anon, authenticated;

drop function if exists public.confirm_delivery(text, boolean, text, text, integer, text, jsonb, text);
drop function if exists public.confirm_delivery(uuid, boolean, text, text, integer, text, text, jsonb, text);

create or replace function public.confirm_delivery(
  p_token text,
  p_confirmed_delivery boolean,
  p_photo_url text default null,
  p_signature_url text default null,
  p_rating integer default null,
  p_review_text text default null,
  p_confirmed_location jsonb default null,
  p_confirmed_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.delivery_confirmations
  set
    confirmed_at = case when p_confirmed_delivery then now() else confirmed_at end,
    confirmed_delivery = p_confirmed_delivery,
    photo_url = coalesce(p_photo_url, photo_url),
    signature_url = coalesce(p_signature_url, signature_url),
    rating = coalesce(p_rating, rating),
    review_text = coalesce(p_review_text, review_text),
    confirmed_location = coalesce(p_confirmed_location, confirmed_location),
    confirmed_user_agent = coalesce(p_confirmed_user_agent, confirmed_user_agent)
  where token::text = p_token;

  if not found then
    raise exception 'invalid token';
  end if;
end;
$$;

revoke all on function public.confirm_delivery(text, boolean, text, text, integer, text, jsonb, text) from public;
grant execute on function public.confirm_delivery(text, boolean, text, text, integer, text, jsonb, text) to anon, authenticated;

-- --------------------------------------------------------------------------------------------
-- suppliers — admin dashboard only (src/services/supplierService.ts, /dashboard/suppliers).
-- Vendor email/phone/address/pricing relationships; grep confirms no anonymous page reads this
-- table (DeliveryMap.tsx and product pages use `delivery_locations`/`products`, not `suppliers`).
-- --------------------------------------------------------------------------------------------
alter table public.suppliers enable row level security;

drop policy if exists "suppliers_admin_select" on public.suppliers;
drop policy if exists "suppliers_admin_insert" on public.suppliers;
drop policy if exists "suppliers_admin_update" on public.suppliers;
drop policy if exists "suppliers_admin_delete" on public.suppliers;

create policy "suppliers_admin_select" on public.suppliers
  for select
  using (is_admin());

create policy "suppliers_admin_insert" on public.suppliers
  for insert
  with check (is_admin());

create policy "suppliers_admin_update" on public.suppliers
  for update
  using (is_admin())
  with check (is_admin());

create policy "suppliers_admin_delete" on public.suppliers
  for delete
  using (is_admin());

-- --------------------------------------------------------------------------------------------
-- order_status_history — zero references anywhere in src/ client code (grep confirms 0 hits
-- outside generated types.ts). Pure schema drift with no current app dependency; lock to
-- admin-only. If a legitimate service-role write path exists (edge function trigger), it
-- bypasses RLS entirely and is unaffected.
-- --------------------------------------------------------------------------------------------
alter table public.order_status_history enable row level security;

drop policy if exists "order_status_history_admin_select" on public.order_status_history;
drop policy if exists "order_status_history_admin_insert" on public.order_status_history;
drop policy if exists "order_status_history_admin_update" on public.order_status_history;
drop policy if exists "order_status_history_admin_delete" on public.order_status_history;

create policy "order_status_history_admin_select" on public.order_status_history
  for select
  using (is_admin());

create policy "order_status_history_admin_insert" on public.order_status_history
  for insert
  with check (is_admin());

create policy "order_status_history_admin_update" on public.order_status_history
  for update
  using (is_admin())
  with check (is_admin());

create policy "order_status_history_admin_delete" on public.order_status_history
  for delete
  using (is_admin());

-- --------------------------------------------------------------------------------------------
-- rate_limits — internal abuse-control bookkeeping (client_id, function_name). Zero references
-- in src/ client code — written by edge functions using the service role key, which bypasses
-- RLS entirely, so this policy only governs the anon/authenticated REST surface. Admin-readable
-- for now; no legitimate UI currently shows it, but this matches the audit's conservative
-- recommendation for Stage 0 (Stage 2 revisits tightening to service_role-only).
-- --------------------------------------------------------------------------------------------
alter table public.rate_limits enable row level security;

drop policy if exists "rate_limits_admin_select" on public.rate_limits;

create policy "rate_limits_admin_select" on public.rate_limits
  for select
  using (is_admin());

-- --------------------------------------------------------------------------------------------
-- quote_analytics — a VIEW, not a table (RLS row policies don't apply to views the same way;
-- exposure here comes from PostgREST + default privileges granting SELECT to anon/authenticated
-- on the view directly). Nothing in src/ reads this view (grep confirms 0 call sites outside
-- generated types.ts), so this is a pure close with zero app-side dependency to preserve.
-- --------------------------------------------------------------------------------------------
revoke all on public.quote_analytics from public;
revoke all on public.quote_analytics from anon, authenticated;
-- Left available to postgres/service_role (default table owner privileges); grant explicitly to
-- authenticated admins later if/when the dashboard actually starts reading it:
--   grant select on public.quote_analytics to authenticated;  -- + wrap read in is_admin() check
--   app-side, since a view can't carry a USING() predicate the way a table policy can.

commit;

-- ============================================================================================
-- POST-APPLY VERIFICATION — run all of these after COMMIT
-- ============================================================================================

-- A. RLS is on everywhere it should be:
--      select relname, relrowsecurity from pg_class
--      where relname in ('orders','delivery_confirmations','suppliers',
--                         'order_status_history','rate_limits')
--        and relnamespace = 'public'::regnamespace;
--    Expect relrowsecurity = true for all five.

-- B. Policy inventory matches this file:
--      select tablename, policyname, cmd, roles
--      from pg_policies
--      where tablename in ('orders','delivery_confirmations','suppliers',
--                           'order_status_history','rate_limits')
--      order by tablename, policyname;

-- C. New functions exist and are SECURITY DEFINER with a locked search_path:
--      select proname, prosecdef, proconfig
--      from pg_proc
--      where proname in ('get_quote_by_id','update_quote_delivery_info',
--                         'get_delivery_confirmation','confirm_delivery');
--    Expect prosecdef = true and proconfig containing 'search_path=public' for all four.

-- D. Anonymous exposure is closed — run scripts/security/probe-anon-exposure.sh again and
--    confirm every previously-"exposed" table/view now returns 0 rows / empty / permission
--    denied for a bare SELECT with only the anon key, and that the two bogus-token RPC probes
--    return empty rows (not an error, not real data).

-- E. Smoke test the app per docs/security/RLS-HOTFIX-RUNBOOK.md step 4 before considering this
--    done: guest cart save, guest quote request (both forms), guest checkout -> payment-success
--    database insert + emails, quote-checkout email-link flow, delivery-confirm SMS/email-link
--    flow, and the full admin dashboard (orders list/detail/edit/delete-item/status-change,
--    suppliers, expenses, analyze).
