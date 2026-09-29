// Stripe live/test mode selection (orchestrator-authored contract, 2026-09-28).
// Shared by edge functions that create or verify Stripe Checkout sessions.
//
// Rule: TEST mode is used ONLY for requests whose Origin is in the STAGING_ORIGINS allowlist
// (comma-separated env, e.g. "https://staging.mygravelguy.com"), or when verifying a session id
// that Stripe itself marks as test ("cs_test_…"). Everything else is LIVE, exactly as today.
// If test mode is selected but STRIPE_TEST_SECRET_KEY is missing, callers must fail closed
// (never silently fall back to the live key for a staging request).
//
// Env:
//   stripe                 — existing LIVE secret key (name kept for backward compatibility)
//   STRIPE_TEST_SECRET_KEY — test-mode secret key (sk_test_…)
//   STAGING_ORIGINS        — comma-separated exact origins allowed to use test mode

export type StripeMode = 'live' | 'test';

export interface StripeModeResult {
  mode: StripeMode;
  /** undefined when the required key for that mode isn't configured → caller returns 500 */
  secretKey: string | undefined;
}

type EnvGetter = (name: string) => string | undefined;

// This file runs under Deno (edge functions) where the real `Deno` global is provided by the
// runtime — but it's also imported by src/metro/checkout/stripeMode.test.ts (vitest, under
// tsconfig.app.json's `include: ["src"]`), and `tsc --noEmit` follows that import into this file
// even though this file itself isn't under `src/`. This narrow, file-scoped ambient declaration
// (not a global .d.ts — it only satisfies the type-checker for THIS module) is the fix the
// stripeMode.test.ts header comment flags as the fallback: every test passes its own explicit
// `env` getter, so `defaultEnv`'s body (and this declaration) is never actually executed under
// vitest/Node — it only needs to type-check there, never run.
declare const Deno: { env: { get(name: string): string | undefined } };

const defaultEnv: EnvGetter = (name) => Deno.env.get(name);

export const parseOrigins = (raw: string | undefined): string[] =>
  (raw ?? '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

export const isStagingOrigin = (origin: string | null | undefined, env: EnvGetter = defaultEnv): boolean => {
  if (!origin) return false;
  return parseOrigins(env('STAGING_ORIGINS')).includes(origin.trim().replace(/\/+$/, ''));
};

/** For creating sessions: mode follows the request Origin. */
export const resolveStripeModeForOrigin = (
  origin: string | null | undefined,
  env: EnvGetter = defaultEnv,
): StripeModeResult =>
  isStagingOrigin(origin, env)
    ? { mode: 'test', secretKey: env('STRIPE_TEST_SECRET_KEY') }
    : { mode: 'live', secretKey: env('stripe') };

/** For verifying sessions: mode follows the session id Stripe issued. */
export const resolveStripeModeForSessionId = (
  sessionId: string | null | undefined,
  env: EnvGetter = defaultEnv,
): StripeModeResult =>
  typeof sessionId === 'string' && sessionId.startsWith('cs_test_')
    ? { mode: 'test', secretKey: env('STRIPE_TEST_SECRET_KEY') }
    : { mode: 'live', secretKey: env('stripe') };

/** For verify-metro-payment/metro-stripe-webhook once a real Stripe object (Checkout Session or
 * Event) has been retrieved/verified: `livemode` is Stripe's own authoritative signal for which
 * key space the object belongs to — more reliable at this point than re-deriving mode from a
 * session id prefix or an Origin header (a webhook request has neither). Additive helper, same
 * fail-closed contract as the two functions above (secretKey undefined when the mode's key isn't
 * configured — caller must fail closed rather than fall back to the other mode's key). */
export const resolveStripeModeForLivemode = (
  livemode: boolean,
  env: EnvGetter = defaultEnv,
): StripeModeResult =>
  livemode === false
    ? { mode: 'test', secretKey: env('STRIPE_TEST_SECRET_KEY') }
    : { mode: 'live', secretKey: env('stripe') };
