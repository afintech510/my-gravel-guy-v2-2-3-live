-- DRAFT — do not apply without owner review; see docs/metro/research/rls-audit.md
--
-- Stage 0 of the orders/PII RLS lockdown (S2-RLS-AUDIT, resolves F5 from
-- metro-checkout-security-review.md). Goal: close every anon-readable/writable gap found by the
-- live exposure probe WITHOUT breaking any currently-working anonymous flow (guest cart save,
-- guest quote requests, QuoteCheckout.tsx's quote lookup, DeliveryConfirm.tsx's token lookup).
--
-- KNOWN, DELIBERATE APP-BREAKING CHANGE in this stage: the legacy (non-metro) checkout's
-- client-side `insert into orders (status='confirmed', ...)` (src/services/orderInsertService.ts
-- insertOrderToDatabase, called from src/pages/PaymentSuccess.tsx:445) will start failing with
-- 42501 insufficient_privilege the moment this migration ships, because no anon INSERT policy
-- below allows status='confirmed'. This is intentional (see docs/metro/research/rls-audit.md,
-- "Required app changes for Stage 0") — that insert path is exactly the F5/F1-class payment-bypass
-- risk this migration exists to close. Coordinate with whoever owns the legacy /checkout flow
-- before applying: either move that insert server-side first (recommended), or temporarily add
-- back a narrow `WITH CHECK (status = 'confirmed')` anon policy here and remove it in Stage 1.
--
-- Also requires app changes (specified in rls-audit.md, not implemented by this migration):
--   - src/pages/QuoteCheckout.tsx:92-96 and :141-158 -> use get_order_by_token /
--     update_quote_delivery_info RPCs instead of raw .from('orders').select()/.update()
--   - src/pages/DeliveryConfirm.tsx:242-246 and its later .update() -> use
--     get_delivery_confirmation / confirm_delivery RPCs instead of raw .from('delivery_confirmations')
--   - src/pages/Checkout.tsx (testDatabaseInsertion + hidden test button),
--     src/services/orderInsertService.ts (testEnhancedDatabaseInsert),
--     src/pages/PaymentSuccess.tsx:600-736 ("checkout-style insert" debug path) -> delete; dead
--     debug code that only exists to do exactly the anon INSERT this migration blocks
--
-- ============================================================================================
-- ROLLBACK (run to fully revert this migration):
--
--   drop function if exists public.get_order_by_token(text, text);
--   drop function if exists public.update_quote_delivery_info(text, text, jsonb);
--   drop function if exists public.get_delivery_confirmation(uuid);
--   drop function if exists public.confirm_delivery(uuid, boolean, text, text, integer, text, text, jsonb, text);
--
--   drop policy if exists "orders_admin_select" on public.orders;
--   drop policy if exists "orders_admin_insert" on public.orders;
--   drop policy if exists "orders_admin_update" on public.orders;
--   drop policy if exists "orders_admin_delete" on public.orders;
--   drop policy if exists "orders_anon_insert_cart" on public.orders;
--   drop policy if exists "orders_anon_insert_quote" on public.orders;
--   alter table public.orders disable row level security;
--
--   drop policy if exists "delivery_confirmations_admin_select" on public.delivery_confirmations;
--   drop policy if exists "delivery_confirmations_admin_insert" on public.delivery_confirmations;
--   drop policy if exists "delivery_confirmations_admin_update" on public.delivery_confirmations;
--   drop policy if exists "delivery_confirmations_admin_delete" on public.delivery_confirmations;
--   alter table public.delivery_confirmations disable row level security;
--
--   drop policy if exists "suppliers_admin_select" on public.suppliers;
--   drop policy if exists "suppliers_admin_insert" on public.suppliers;
--   drop policy if exists "suppliers_admin_update" on public.suppliers;
--   drop policy if exists "suppliers_admin_delete" on public.suppliers;
--   alter table public.suppliers disable row level security;
--
--   drop policy if exists "delivery_locations_public_read" on public.delivery_locations;
--   drop policy if exists "delivery_locations_admin_all" on public.delivery_locations;
--   alter table public.delivery_locations disable row level security;
--
--   drop policy if exists "order_status_history_admin_select" on public.order_status_history;
--   drop policy if exists "order_status_history_admin_insert" on public.order_status_history;
--   alter table public.order_status_history disable row level security;
--
--   drop policy if exists "rate_limits_admin_select" on public.rate_limits;
--   alter table public.rate_limits disable row level security;
-- ============================================================================================

-- -------------------------------------------------------------------------------------------
-- orders
-- -------------------------------------------------------------------------------------------
alter table public.orders enable row level security;

drop policy if exists "orders_admin_select" on public.orders;
drop policy if exists "orders_admin_insert" on public.orders;
drop policy if exists "orders_admin_update" on public.orders;
drop policy if exists "orders_admin_delete" on public.orders;
drop policy if exists "orders_anon_insert_cart" on public.orders;
drop policy if exists "orders_anon_insert_quote" on public.orders;

-- Admin dashboard (OrderService, SupplierService.getSupplierOrders, financialAnalysisService,
-- dashboard widgets) keeps working unchanged for anyone is_admin() returns true for.
create policy "orders_admin_select" on public.orders
  for select
  using (is_admin());

create policy "orders_admin_insert" on public.orders
  for insert
  with check (is_admin());

create policy "orders_admin_update" on public.orders
  for update
  using (is_admin());

create policy "orders_admin_delete" on public.orders
  for delete
  using (is_admin());

-- Guest "save cart" (src/services/cartInsertService.ts) — narrow to cart rows only.
create policy "orders_anon_insert_cart" on public.orders
  for insert
  to anon
  with check (status = 'cart');

-- Guest quote-request forms (src/services/quoteOrderService.ts,
-- src/services/specMaterialQuoteService.ts) — narrow to $0 quote rows only.
create policy "orders_anon_insert_quote" on public.orders
  for insert
  to anon
  with check (status = 'Quote' and total_price = 0 and unit_price = 0);

-- Deliberately NO anon insert policy allows status in ('confirmed','paid','authorized',...) —
-- that is the F5 payment-bypass gap this migration closes. Deliberately NO anon select/update/
-- delete policy either: QuoteCheckout.tsx's anonymous read/update needs are served by the
-- SECURITY DEFINER RPCs below instead, which cannot be used to enumerate other customers' orders.

-- -------------------------------------------------------------------------------------------
-- get_order_by_token / update_quote_delivery_info
--   Replace QuoteCheckout.tsx's raw `.from('orders').select('*').like('order_id', quoteId+'%')`
--   and its raw `.update()` loop. Ownership is proven by (order_id prefix + matching email), not
--   by RLS row visibility, so a caller who doesn't know both cannot read/modify anything.
--   NOTE (see rls-audit.md): requires QuoteCheckout.tsx to have the customer's email available
--   (either embedded in the emailed link as a second param, or entered by the customer) —
--   product decision needed; recommend switching to an opaque per-quote token instead of trusting
--   the quoteId prefix, see rls-audit.md Stage 0 discussion. Signature below assumes email-based
--   ownership as the minimal fix; revisit before applying if the token approach is chosen instead.
-- -------------------------------------------------------------------------------------------
drop function if exists public.get_order_by_token(text, text);

create or replace function public.get_order_by_token(p_order_id text, p_email text)
returns setof public.orders
language sql
security definer
set search_path = public
as $$
  select *
  from public.orders
  where order_id like (p_order_id || '%')
    and status = 'Quote'
    and p_email is not null
    and (delivery_email = p_email or billing_email = p_email);
$$;

grant execute on function public.get_order_by_token(text, text) to anon, authenticated;

drop function if exists public.update_quote_delivery_info(text, text, jsonb);

create or replace function public.update_quote_delivery_info(
  p_order_id text,
  p_email text,
  p_delivery jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_email is null then
    raise exception 'email required';
  end if;

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
  where order_id like (p_order_id || '%')
    and status = 'Quote'
    and (delivery_email = p_email or billing_email = p_email);
end;
$$;

grant execute on function public.update_quote_delivery_info(text, text, jsonb) to anon, authenticated;

-- -------------------------------------------------------------------------------------------
-- delivery_confirmations
--   Not tracked anywhere else in this repo (no prior migration, not in generated types.ts) —
--   created directly against the live DB per SESSION_LOG.md. Live probe confirmed zero RLS:
--   anon `select=token&limit=1` returned a real token + real count (4 rows). The app's own
--   `.eq('token', token)` filter in DeliveryConfirm.tsx is a client-side convention only; a plain
--   anon SELECT/UPDATE policy permissive enough to make that page work would also let anyone
--   enumerate every row's PII (customer_name/phone/email/stripe_payment_id/GPS/signature) via
--   `select=*` with no token at all. Fix: deny anon SELECT/UPDATE entirely at the RLS layer, serve
--   the "I know my token" case through SECURITY DEFINER RPCs that take the token as an argument.
-- -------------------------------------------------------------------------------------------
alter table public.delivery_confirmations enable row level security;

drop policy if exists "delivery_confirmations_admin_select" on public.delivery_confirmations;
drop policy if exists "delivery_confirmations_admin_insert" on public.delivery_confirmations;
drop policy if exists "delivery_confirmations_admin_update" on public.delivery_confirmations;
drop policy if exists "delivery_confirmations_admin_delete" on public.delivery_confirmations;

create policy "delivery_confirmations_admin_select" on public.delivery_confirmations
  for select
  using (is_admin());

create policy "delivery_confirmations_admin_insert" on public.delivery_confirmations
  for insert
  with check (is_admin());

create policy "delivery_confirmations_admin_update" on public.delivery_confirmations
  for update
  using (is_admin());

create policy "delivery_confirmations_admin_delete" on public.delivery_confirmations
  for delete
  using (is_admin());

drop function if exists public.get_delivery_confirmation(uuid);

create or replace function public.get_delivery_confirmation(p_token uuid)
returns setof public.delivery_confirmations
language sql
security definer
set search_path = public
as $$
  select *
  from public.delivery_confirmations
  where token = p_token;
$$;

grant execute on function public.get_delivery_confirmation(uuid) to anon, authenticated;

drop function if exists public.confirm_delivery(uuid, boolean, text, text, integer, text, text, jsonb, text);

create or replace function public.confirm_delivery(
  p_token uuid,
  p_confirmed_delivery boolean,
  p_signature_url text default null,
  p_photo_url text default null,
  p_rating integer default null,
  p_review_text text default null,
  p_verification_code text default null,
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
    signature_url = coalesce(p_signature_url, signature_url),
    photo_url = coalesce(p_photo_url, photo_url),
    rating = coalesce(p_rating, rating),
    review_text = coalesce(p_review_text, review_text),
    verified_at = case when p_verification_code is not null then now() else verified_at end,
    confirmed_location = coalesce(p_confirmed_location, confirmed_location),
    confirmed_user_agent = coalesce(p_confirmed_user_agent, confirmed_user_agent)
  where token = p_token;

  if not found then
    raise exception 'invalid token';
  end if;
end;
$$;

grant execute on function public.confirm_delivery(uuid, boolean, text, text, integer, text, text, jsonb, text) to anon, authenticated;

-- -------------------------------------------------------------------------------------------
-- suppliers — admin dashboard only (src/services/supplierService.ts, /dashboard/suppliers).
-- Vendor email/phone/address/pricing relationships; no anonymous flow reads this table.
-- -------------------------------------------------------------------------------------------
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
  using (is_admin());

create policy "suppliers_admin_delete" on public.suppliers
  for delete
  using (is_admin());

-- -------------------------------------------------------------------------------------------
-- delivery_locations — no PII (city/state/lat/lng/description/slug). Publicly read on the
-- /delivery-map route (src/components/DeliveryMap.tsx) — that exposure looks intentional, so
-- this gets an explicit public_read policy (same pattern as market_aliases/market_materials)
-- instead of being left with no RLS at all.
-- -------------------------------------------------------------------------------------------
alter table public.delivery_locations enable row level security;

drop policy if exists "delivery_locations_public_read" on public.delivery_locations;
drop policy if exists "delivery_locations_admin_all" on public.delivery_locations;

create policy "delivery_locations_public_read" on public.delivery_locations
  for select
  using (true);

create policy "delivery_locations_admin_all" on public.delivery_locations
  for all
  using (is_admin())
  with check (is_admin());

-- -------------------------------------------------------------------------------------------
-- order_status_history — zero references anywhere in src/ client code. Pure schema drift with
-- no current app dependency; lock to admin-only with no app-side change required.
-- -------------------------------------------------------------------------------------------
alter table public.order_status_history enable row level security;

drop policy if exists "order_status_history_admin_select" on public.order_status_history;
drop policy if exists "order_status_history_admin_insert" on public.order_status_history;

create policy "order_status_history_admin_select" on public.order_status_history
  for select
  using (is_admin());

-- No client code inserts into this table either; if a server-side trigger/function needs to,
-- it runs as service_role (bypasses RLS) or postgres owner, so no anon/authenticated insert
-- policy is added here. Add one explicitly if a legitimate write path is found later.
create policy "order_status_history_admin_insert" on public.order_status_history
  for insert
  with check (is_admin());

-- -------------------------------------------------------------------------------------------
-- rate_limits — internal abuse-control bookkeeping (client_id, function_name). Zero references
-- in src/ client code (written by edge functions using the service role, which bypasses RLS
-- entirely). Lock to admin-only for now per rls-audit.md; Stage 2 revisits whether even
-- is_admin() should be able to read this (recommendation there: service_role-only).
-- -------------------------------------------------------------------------------------------
alter table public.rate_limits enable row level security;

drop policy if exists "rate_limits_admin_select" on public.rate_limits;

create policy "rate_limits_admin_select" on public.rate_limits
  for select
  using (is_admin());
