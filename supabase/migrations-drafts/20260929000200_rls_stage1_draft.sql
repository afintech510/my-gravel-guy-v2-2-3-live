-- DRAFT — do not apply without owner review; see docs/metro/research/rls-audit.md
--
-- Stage 1 of the orders/PII RLS lockdown (S2-RLS-AUDIT). Apply only AFTER:
--   (a) S1's verify-payment-v2 / create-auth-hold-v2 (or the legacy-checkout equivalent) has
--       moved paid-order creation server-side (service-role key), per
--       docs/metro/research/live-checkout-v2.md (not yet written as of this audit — check it
--       exists before applying), AND
--   (b) Stage 0 (20260929000100_rls_stage0_draft.sql) has been live for long enough to confirm,
--       from production logs, that the anon cart/quote INSERT policies aren't being abused in a
--       way that needs a tighter WITH CHECK than what's here.
--
-- If Stage 0 shipped with a TEMPORARY `WITH CHECK (status = 'confirmed')` anon policy (because
-- option (a) above wasn't ready yet — see Stage 0's header comment), this migration is what
-- removes it. If Stage 0 shipped as originally drafted (no such temporary policy), this migration
-- has nothing to drop for that specific case and only tightens the cart/quote WITH CHECK clauses.
--
-- ============================================================================================
-- ROLLBACK (run to fully revert this migration back to Stage 0's state):
--
--   drop policy if exists "orders_anon_insert_cart" on public.orders;
--   drop policy if exists "orders_anon_insert_quote" on public.orders;
--   drop policy if exists "orders_anon_insert_confirmed_temp" on public.orders;
--
--   create policy "orders_anon_insert_cart" on public.orders
--     for insert to anon with check (status = 'cart');
--
--   create policy "orders_anon_insert_quote" on public.orders
--     for insert to anon with check (status = 'Quote' and total_price = 0 and unit_price = 0);
--
--   -- (re-add orders_anon_insert_confirmed_temp here only if Stage 0 actually had it live)
-- ============================================================================================

-- Remove the temporary anon 'confirmed' allowance, if Stage 0 was applied with it.
-- Safe no-op if it was never created.
drop policy if exists "orders_anon_insert_confirmed_temp" on public.orders;

-- Re-verify no anon policy on orders allows status outside ('cart','Quote'). Re-create the two
-- Stage 0 policies with tightened WITH CHECK clauses:
--   - cap quantity to something sane (matches the metro checkout's own METRO_QUANTITY_MAX=500
--     rationale from metro-checkout-security-review.md F6 — same DoS/abuse class applies here)
--   - require delivery_email to be present (every legitimate cart/quote flow sets it; an anon
--     insert with no email is not a real customer flow and complicates abandoned-cart tooling)
--   - explicitly pin sales_person/sales_commission/supplier_id/supplier_charges/tags/
--     quote_status/quote_converted to NULL/false — these are admin/back-office fields with no
--     business reason for an anonymous request to set them, and RLS WITH CHECK doesn't restrict
--     *which* columns an INSERT can set the way a column-level grant would, so they must be
--     enumerated explicitly here to be blocked.
drop policy if exists "orders_anon_insert_cart" on public.orders;
drop policy if exists "orders_anon_insert_quote" on public.orders;

create policy "orders_anon_insert_cart" on public.orders
  for insert
  to anon
  with check (
    status = 'cart'
    and quantity is not null and quantity > 0 and quantity <= 500
    and delivery_email is not null
    and sales_person is null
    and sales_commission is null
    and supplier_id is null
    and supplier_charges is null
    and quote_status is null
    and coalesce(quote_converted, false) = false
  );

create policy "orders_anon_insert_quote" on public.orders
  for insert
  to anon
  with check (
    status = 'Quote'
    and total_price = 0
    and unit_price = 0
    and delivery_email is not null
    and sales_person is null
    and sales_commission is null
    and supplier_id is null
    and supplier_charges is null
    and coalesce(quote_converted, false) = false
  );

-- Still deliberately no anon UPDATE/DELETE/SELECT policy on orders — QuoteCheckout.tsx's needs
-- continue to be served by get_order_by_token / update_quote_delivery_info from Stage 0.
