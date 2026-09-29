// Centralizes which Supabase Edge Function name the client calls for the two checkout
// endpoints being hardened (S1-LIVE-CHECKOUT-FIX). Every caller (src/pages/Checkout.tsx,
// src/pages/PaymentSuccess.tsx) MUST go through these two functions instead of hardcoding
// 'create-auth-hold' / 'verify-payment' — that's what makes the v2 rollout a pure env-var flip
// with zero code changes at cutover/rollback time.
//
// With the env vars unset, the return value is byte-identical to the function name every caller
// used before this change (see live-checkout-v2.md's "prove the default path is unchanged"
// requirement) — `git diff HEAD -- supabase/functions/verify-payment supabase/functions/create-auth-hold`
// stays empty, and nothing about this module changes what those two functions receive or how
// they're invoked when the env vars aren't set.
//
// Staging sets VITE_VERIFY_PAYMENT_FUNCTION=verify-payment-v2 and
// VITE_CREATE_AUTH_HOLD_FUNCTION=create-auth-hold-v2. Production cutover = set the same two env
// vars in the production build. Rollback = unset them (no redeploy of the v1 functions needed —
// they're never touched).
export const getVerifyPaymentFunctionName = (): string =>
  import.meta.env.VITE_VERIFY_PAYMENT_FUNCTION || 'verify-payment';

export const getCreateAuthHoldFunctionName = (): string =>
  import.meta.env.VITE_CREATE_AUTH_HOLD_FUNCTION || 'create-auth-hold';

/** True when either endpoint has been switched to its v2 name. PaymentSuccess.tsx uses this to
 * decide whether to trust the server response fully (v2) or keep running today's client-side
 * `handleDatabaseInsert` fallback/auto-insert behavior (v1, unchanged). */
export const isCheckoutV2Enabled = (): boolean =>
  getVerifyPaymentFunctionName() !== 'verify-payment' || getCreateAuthHoldFunctionName() !== 'create-auth-hold';
