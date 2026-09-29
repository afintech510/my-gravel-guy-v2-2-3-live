-- OPTIONAL migration — NOT applied; owner to review before running.
--
-- Context: as of the 2026-09-28 metro-checkout hardening pass (A1v3-METRO-CHECKOUT-HARDENING,
-- see docs/metro/research/metro-checkout-server.md and
-- docs/metro/research/metro-checkout-security-review.md), an `orders` row for a metro order is
-- now inserted exactly once, at verified-payment time, by either `verify-metro-payment` (the
-- client's own confirmation-page call) or the new `metro-stripe-webhook` function (Stripe's
-- server-to-server event) — whichever gets there first. Both already defend against a race
-- between themselves in application code (see resolveInsertRace in
-- src/metro/checkout/conversion.ts + supabase/functions/_shared/metro-conversion-runner.ts:
-- after inserting, each caller re-selects every row sharing the same order_id, keeps only the
-- earliest, and deletes any duplicate it itself just created), but that's a best-effort,
-- read-after-write race resolution — not a hard DB-level guarantee.
--
-- This index would add that hard guarantee for one axis (a given Stripe Checkout Session can
-- back at most one metro order row), and let the insert code treat a unique-violation
-- (Postgres error code 23505) as an authoritative "someone else already converted this session"
-- signal instead of relying purely on the re-select-and-delete race resolution above (the insert
-- code in metro-conversion-runner.ts already handles 23505 via isUniqueViolation, so applying
-- this migration is a pure hardening step with no code changes required).
--
-- Why "NOT applied" / why a partial index: this repo's migrations are not run automatically as
-- part of this task (no live DB access, no Stripe calls — see this agent's constraints), and
-- migrations in this repo appear to be applied manually/via CI outside this working session. The
-- index is scoped with `WHERE order_id LIKE 'ORDER-METRO-%'` specifically so it can NEVER
-- conflict with any pre-existing `orders` row for the legacy non-metro checkout flow (which
-- reuses the same `stripe_session_id` column but under entirely different order_id prefixes) —
-- confirmed safe to add at any time because no metro order_id has ever existed before this
-- change ships. Owner: please review and run
-- `supabase db push` (or your normal migration-apply step) once ready; it is safe to apply even
-- while the feature is fully dark (priceBookConfirmed: false for every metro), since there are
-- zero ORDER-METRO- rows in the table until a metro goes live.

CREATE UNIQUE INDEX IF NOT EXISTS orders_metro_stripe_session_id_unique
  ON public.orders (stripe_session_id)
  WHERE order_id LIKE 'ORDER-METRO-%';
