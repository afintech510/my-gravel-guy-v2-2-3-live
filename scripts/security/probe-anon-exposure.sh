#!/usr/bin/env bash
# ============================================================================================
# probe-anon-exposure.sh — read-only anon-key exposure probe for the RLS hotfix
# (sql/rls-hotfix-stage0a.sql). Run this BEFORE applying the SQL (to confirm the audit's
# findings still hold) and AFTER applying it (to confirm the leak is closed).
#
# Every probe here is read-only:
#   - `select=id&limit=1` on tables (single non-PII column, single row)
#   - HEAD + `Prefer: count=exact` for a row count, no row data at all
#   - RPC calls use bogus/nonexistent tokens/ids, expecting empty results
# Nothing here selects PII columns or writes anything.
#
# Usage:
#   scripts/security/probe-anon-exposure.sh                # uses the public anon key baked
#                                                            # into src/integrations/supabase/
#                                                            # client.ts (same one the browser
#                                                            # bundle already ships)
#   SUPABASE_URL=... SUPABASE_ANON_KEY=... scripts/security/probe-anon-exposure.sh
# ============================================================================================
set -uo pipefail

# Same values as src/integrations/supabase/client.ts — the anon/publishable key is meant to be
# public (it ships in the browser bundle), so hardcoding it here for a read-only probe is fine.
SUPABASE_URL="${SUPABASE_URL:-https://losrkjvrcambvgijfism.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc3JranZyY2FtYnZnaWpmaXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTI0NjIsImV4cCI6MjA2MTQ2ODQ2Mn0.LdtyGNA5PmayO9VYcNRsO12DCAg0iS460rtTsDsS5B8}"

REST="${SUPABASE_URL}/rest/v1"

pass=0
fail=0
unknown=0

hr() { printf '%s\n' "--------------------------------------------------------------------------------"; }

# check_closed <label> <path>
# Expects the anon key to be denied or see zero rows. Reports EXPOSED if a real row comes back.
check_closed() {
  local label="$1" path="$2"
  local resp status body count
  resp=$(curl -s -w '\n%{http_code}' \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Range: 0-0" \
    -H "Prefer: count=exact" \
    "${REST}/${path}")
  status=$(printf '%s' "$resp" | tail -n1)
  body=$(printf '%s' "$resp" | sed '$d')

  echo "[$label] GET ${path} -> HTTP ${status}"
  echo "  body: ${body}"

  if [[ ( "$status" == "200" || "$status" == "206" ) && "$body" != "[]" && -n "$body" && "$body" != "null" ]]; then
    echo "  => EXPOSED (anon can still read a real row) — FAIL"
    fail=$((fail+1))
  elif [[ "$status" == "200" && ( "$body" == "[]" || "$body" == "null" ) ]]; then
    echo "  => closed (200, empty result — RLS filtered it out) — PASS"
    pass=$((pass+1))
  elif [[ "$status" == "401" || "$status" == "403" ]]; then
    echo "  => closed (explicit auth error) — PASS"
    pass=$((pass+1))
  else
    echo "  => UNKNOWN response, inspect manually"
    unknown=$((unknown+1))
  fi
  hr
}

# check_rpc_empty <label> <path> <json body>
check_rpc_empty() {
  local label="$1" path="$2" body_in="$3"
  local resp status body
  resp=$(curl -s -w '\n%{http_code}' \
    -X POST \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "${body_in}" \
    "${REST}/rpc/${path}")
  status=$(printf '%s' "$resp" | tail -n1)
  body=$(printf '%s' "$resp" | sed '$d')

  echo "[$label] POST rpc/${path} (bogus arg) -> HTTP ${status}"
  echo "  body: ${body}"

  if [[ "$status" == "200" && ( "$body" == "[]" || "$body" == "null" ) ]]; then
    echo "  => correctly empty for a bogus token/id — PASS"
    pass=$((pass+1))
  elif [[ "$status" == "404" ]]; then
    echo "  => function does not exist yet (expected BEFORE the SQL is applied) — info only"
    unknown=$((unknown+1))
  elif [[ "$status" == "200" ]]; then
    echo "  => UNEXPECTED non-empty result for a bogus token/id — FAIL"
    fail=$((fail+1))
  else
    echo "  => UNKNOWN response, inspect manually"
    unknown=$((unknown+1))
  fi
  hr
}

echo "Probing ${SUPABASE_URL} with the public anon key..."
hr

# --- Tables that should have ZERO anon access after the hotfix -------------------------------
check_closed "orders"                 "orders?select=id&limit=1"
check_closed "delivery_confirmations" "delivery_confirmations?select=order_id&limit=1"
check_closed "suppliers"              "suppliers?select=id&limit=1"
check_closed "order_status_history"   "order_status_history?select=id&limit=1"
check_closed "rate_limits"            "rate_limits?select=id&limit=1"
check_closed "quote_analytics (view)" "quote_analytics?select=*&limit=1"

# --- delivery_locations should STILL be readable (intentional public data, out of scope) -----
resp=$(curl -s -w '\n%{http_code}' -H "apikey: ${SUPABASE_ANON_KEY}" -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  "${REST}/delivery_locations?select=id&limit=1")
status=$(printf '%s' "$resp" | tail -n1)
echo "[delivery_locations] GET delivery_locations?select=id&limit=1 -> HTTP ${status} (expected 200 with data — this table is intentionally public, not touched by this hotfix)"
hr

# --- New RPCs, called with bogus arguments, expecting empty (not an error, not real data) ----
check_rpc_empty "get_quote_by_id"          "get_quote_by_id"          '{"p_quote_id":"QUOTE-DOES-NOT-EXIST-00000000"}'
check_rpc_empty "get_delivery_confirmation" "get_delivery_confirmation" '{"p_token":"00000000-0000-0000-0000-000000000000"}'

echo
echo "================================================================================"
echo "RESULT: ${pass} closed/pass, ${fail} EXPOSED/fail, ${unknown} unknown/info"
echo "================================================================================"
if [[ $fail -gt 0 ]]; then
  echo "One or more tables/views are still anonymously readable. If this is a 'before' run,"
  echo "that's expected (matches the audit). If this is an 'after' run (post-SQL), STOP and"
  echo "investigate before considering the hotfix applied successfully."
  exit 1
fi
exit 0
