-- ============================================================================================
-- RLS HOTFIX — Stage 0a ROLLBACK
--
-- Restores today's (pre-hotfix) exposure EXACTLY: RLS disabled on all six tables, no admin-only
-- restrictions, no RPCs. Use this if sql/rls-hotfix-stage0a.sql breaks something in production
-- that can't be fixed forward quickly (e.g. an assumption about delivery_confirmations' real
-- columns was wrong and get_delivery_confirmation/confirm_delivery are erroring for real
-- customers on live delivery-confirm links).
--
-- IMPORTANT: this restores the SAME anonymous-read exposure the hotfix closed (F5 and the
-- delivery_confirmations token-bypass issue). Only run this as a last resort, and re-apply the
-- forward fix (corrected, if needed) as soon as possible afterward. If you rolled back because
-- the app-side changes on hotfix/orders-rls are still what's deployed (they should be —
-- app-side changes are safe under BOTH old and new SQL, see the runbook), no app rollback is
-- needed, only this SQL.
-- ============================================================================================

begin;

-- --------------------------------------------------------------------------------------------
-- quote_analytics — restore default anon/authenticated SELECT grant
-- --------------------------------------------------------------------------------------------
grant select on public.quote_analytics to anon, authenticated;

-- --------------------------------------------------------------------------------------------
-- rate_limits
-- --------------------------------------------------------------------------------------------
drop policy if exists "rate_limits_admin_select" on public.rate_limits;
alter table public.rate_limits disable row level security;

-- --------------------------------------------------------------------------------------------
-- order_status_history
-- --------------------------------------------------------------------------------------------
drop policy if exists "order_status_history_admin_select" on public.order_status_history;
drop policy if exists "order_status_history_admin_insert" on public.order_status_history;
drop policy if exists "order_status_history_admin_update" on public.order_status_history;
drop policy if exists "order_status_history_admin_delete" on public.order_status_history;
alter table public.order_status_history disable row level security;

-- --------------------------------------------------------------------------------------------
-- suppliers
-- --------------------------------------------------------------------------------------------
drop policy if exists "suppliers_admin_select" on public.suppliers;
drop policy if exists "suppliers_admin_insert" on public.suppliers;
drop policy if exists "suppliers_admin_update" on public.suppliers;
drop policy if exists "suppliers_admin_delete" on public.suppliers;
alter table public.suppliers disable row level security;

-- --------------------------------------------------------------------------------------------
-- delivery_confirmations + RPCs
-- --------------------------------------------------------------------------------------------
drop function if exists public.confirm_delivery(text, boolean, text, text, integer, text, jsonb, text);
drop function if exists public.get_delivery_confirmation(text);

drop policy if exists "delivery_confirmations_admin_select" on public.delivery_confirmations;
drop policy if exists "delivery_confirmations_admin_insert" on public.delivery_confirmations;
drop policy if exists "delivery_confirmations_admin_update" on public.delivery_confirmations;
drop policy if exists "delivery_confirmations_admin_delete" on public.delivery_confirmations;
alter table public.delivery_confirmations disable row level security;

-- --------------------------------------------------------------------------------------------
-- orders + RPCs
-- --------------------------------------------------------------------------------------------
drop function if exists public.update_quote_delivery_info(text, jsonb);
drop function if exists public.get_quote_by_id(text);

drop policy if exists "orders_admin_select" on public.orders;
drop policy if exists "orders_admin_insert" on public.orders;
drop policy if exists "orders_admin_update" on public.orders;
drop policy if exists "orders_admin_delete" on public.orders;
drop policy if exists "orders_anon_insert" on public.orders;
drop policy if exists "orders_anon_insert_cart" on public.orders;
drop policy if exists "orders_anon_insert_quote" on public.orders;
alter table public.orders disable row level security;

commit;

-- ============================================================================================
-- POST-ROLLBACK VERIFICATION
-- ============================================================================================
-- select relname, relrowsecurity from pg_class
-- where relname in ('orders','delivery_confirmations','suppliers',
--                    'order_status_history','rate_limits')
--   and relnamespace = 'public'::regnamespace;
-- Expect relrowsecurity = false for all five (matches pre-hotfix state).
--
-- Re-run scripts/security/probe-anon-exposure.sh and confirm it matches the ORIGINAL
-- (pre-hotfix) "before" run — i.e. the tables are exposed again. This confirms the rollback
-- actually reverted the database, which is the point of running it.
