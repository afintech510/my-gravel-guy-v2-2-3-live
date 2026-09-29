// Tests for supabase/functions/_shared/stripe-mode.ts — the live/test Stripe key-selection
// contract shared by create-metro-checkout, verify-metro-payment, and metro-stripe-webhook (see
// docs/metro/STAGING.md "Stripe TEST mode" and docs/metro/research/metro-checkout-server.md's
// "Staging / test mode" section).
//
// stripe-mode.ts lives under supabase/functions/_shared/ (Deno-importable, not part of the
// vitest `src/**` glob in vitest.config.ts) rather than under src/metro/checkout/ — it's shared
// by three edge functions, not bundled from src/ like serverQuote.ts/verifyLogic.ts/conversion.ts
// are. This test file lives here (under src/metro/checkout/, so `npx vitest run src/metro`
// actually picks it up) and imports the module by relative path instead. Every test passes its
// own explicit `env` getter — never relying on the module's `defaultEnv` param, whose body
// references the `Deno` global (`Deno.env.get`) that doesn't exist under vitest/Node. That
// reference is only ever evaluated if `defaultEnv` is actually CALLED (i.e. a test omits the env
// argument), so passing an explicit getter everywhere here sidesteps it entirely — no vitest
// type-check or runtime failure, and no need to fall back to testing a copied helper.
import { describe, expect, it } from 'vitest';
import {
  isStagingOrigin,
  parseOrigins,
  resolveStripeModeForLivemode,
  resolveStripeModeForOrigin,
  resolveStripeModeForSessionId,
} from '../../../supabase/functions/_shared/stripe-mode';

const envFrom = (vars: Record<string, string | undefined>) => (name: string): string | undefined => vars[name];

describe('parseOrigins', () => {
  it('splits, trims, and drops trailing slashes/empties', () => {
    expect(parseOrigins('https://staging.mygravelguy.com, https://foo.example.com/ ,,')).toEqual([
      'https://staging.mygravelguy.com',
      'https://foo.example.com',
    ]);
  });

  it('returns [] for undefined/empty input', () => {
    expect(parseOrigins(undefined)).toEqual([]);
    expect(parseOrigins('')).toEqual([]);
  });
});

describe('isStagingOrigin', () => {
  const env = envFrom({ STAGING_ORIGINS: 'https://staging.mygravelguy.com,https://staging2.mygravelguy.com/' });

  it('matches an exact allowlisted origin', () => {
    expect(isStagingOrigin('https://staging.mygravelguy.com', env)).toBe(true);
  });

  it('matches allowing for a trailing slash on either side', () => {
    expect(isStagingOrigin('https://staging2.mygravelguy.com', env)).toBe(true);
  });

  it('rejects the production origin and unknown origins', () => {
    expect(isStagingOrigin('https://mygravelguy.com', env)).toBe(false);
    expect(isStagingOrigin('https://evil.example.com', env)).toBe(false);
  });

  it('rejects null/undefined/empty origin', () => {
    expect(isStagingOrigin(null, env)).toBe(false);
    expect(isStagingOrigin(undefined, env)).toBe(false);
    expect(isStagingOrigin('', env)).toBe(false);
  });

  it('is false for every origin when STAGING_ORIGINS is unset', () => {
    const emptyEnv = envFrom({});
    expect(isStagingOrigin('https://staging.mygravelguy.com', emptyEnv)).toBe(false);
  });
});

describe('resolveStripeModeForOrigin', () => {
  const env = envFrom({
    STAGING_ORIGINS: 'https://staging.mygravelguy.com',
    stripe: 'sk_live_abc',
    STRIPE_TEST_SECRET_KEY: 'sk_test_abc',
  });

  it('resolves test mode + the test key for a staging origin', () => {
    expect(resolveStripeModeForOrigin('https://staging.mygravelguy.com', env)).toEqual({
      mode: 'test',
      secretKey: 'sk_test_abc',
    });
  });

  it('resolves live mode + the live key for the production origin', () => {
    expect(resolveStripeModeForOrigin('https://mygravelguy.com', env)).toEqual({ mode: 'live', secretKey: 'sk_live_abc' });
  });

  it('resolves live mode for a missing/unrecognized origin — never defaults to test', () => {
    expect(resolveStripeModeForOrigin(null, env)).toEqual({ mode: 'live', secretKey: 'sk_live_abc' });
    expect(resolveStripeModeForOrigin('https://evil.example.com', env)).toEqual({ mode: 'live', secretKey: 'sk_live_abc' });
  });

  it('fails closed (secretKey undefined) when the resolved mode key is not configured', () => {
    const noTestKeyEnv = envFrom({ STAGING_ORIGINS: 'https://staging.mygravelguy.com', stripe: 'sk_live_abc' });
    const result = resolveStripeModeForOrigin('https://staging.mygravelguy.com', noTestKeyEnv);
    expect(result.mode).toBe('test');
    expect(result.secretKey).toBeUndefined();
  });
});

describe('resolveStripeModeForSessionId', () => {
  const env = envFrom({ stripe: 'sk_live_abc', STRIPE_TEST_SECRET_KEY: 'sk_test_abc' });

  it('resolves test mode for a cs_test_ session id', () => {
    expect(resolveStripeModeForSessionId('cs_test_abc123', env)).toEqual({ mode: 'test', secretKey: 'sk_test_abc' });
  });

  it('resolves live mode for a live session id', () => {
    expect(resolveStripeModeForSessionId('cs_abc123', env)).toEqual({ mode: 'live', secretKey: 'sk_live_abc' });
  });

  it('resolves live mode for a null/undefined session id', () => {
    expect(resolveStripeModeForSessionId(undefined, env)).toEqual({ mode: 'live', secretKey: 'sk_live_abc' });
    expect(resolveStripeModeForSessionId(null, env)).toEqual({ mode: 'live', secretKey: 'sk_live_abc' });
  });
});

describe('resolveStripeModeForLivemode', () => {
  const env = envFrom({ stripe: 'sk_live_abc', STRIPE_TEST_SECRET_KEY: 'sk_test_abc' });

  it('resolves test mode when livemode is false', () => {
    expect(resolveStripeModeForLivemode(false, env)).toEqual({ mode: 'test', secretKey: 'sk_test_abc' });
  });

  it('resolves live mode when livemode is true', () => {
    expect(resolveStripeModeForLivemode(true, env)).toEqual({ mode: 'live', secretKey: 'sk_live_abc' });
  });

  it('fails closed when the resolved mode key is missing', () => {
    const noTestKeyEnv = envFrom({ stripe: 'sk_live_abc' });
    expect(resolveStripeModeForLivemode(false, noTestKeyEnv)).toEqual({ mode: 'test', secretKey: undefined });
  });
});
