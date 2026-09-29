// rls-hotfix: shared helper for the temporary compat shims in QuoteCheckout.tsx and
// DeliveryConfirm.tsx. Those pages call SECURITY DEFINER RPCs (get_quote_by_id,
// update_quote_delivery_info, get_delivery_confirmation, confirm_delivery) that are only created
// by sql/rls-hotfix-stage0a.sql. Because the app deploy and the SQL apply are two separate steps
// (see docs/security/RLS-HOTFIX-RUNBOOK.md), there's a window where this app code is live but
// the RPCs don't exist yet. PostgREST reports that as a PGRST202 "could not find the function"
// error — this helper recognizes that specific case so the callers can fall back to the old raw
// query (which still works under today's pre-SQL, RLS-less policies) instead of breaking these
// pages for that window.
//
// Safe to delete this file and its call sites once sql/rls-hotfix-stage0a.sql has been applied
// to production and confirmed via scripts/security/probe-anon-exposure.sh — at that point the
// RPCs always exist and this branch never runs.
export function isRpcMissing(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const message = (error as { message?: string } | null)?.message ?? '';
  return code === 'PGRST202' || message.includes('Could not find the function');
}
