import { describe, expect, it, afterEach, vi } from 'vitest';
import { getCreateAuthHoldFunctionName, getVerifyPaymentFunctionName, isCheckoutV2Enabled } from './checkoutFunctions';

describe('checkoutFunctions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults to the v1 function names when no env vars are set', () => {
    vi.stubEnv('VITE_VERIFY_PAYMENT_FUNCTION', '');
    vi.stubEnv('VITE_CREATE_AUTH_HOLD_FUNCTION', '');
    expect(getVerifyPaymentFunctionName()).toBe('verify-payment');
    expect(getCreateAuthHoldFunctionName()).toBe('create-auth-hold');
    expect(isCheckoutV2Enabled()).toBe(false);
  });

  it('switches to v2 names when the env vars are set', () => {
    vi.stubEnv('VITE_VERIFY_PAYMENT_FUNCTION', 'verify-payment-v2');
    vi.stubEnv('VITE_CREATE_AUTH_HOLD_FUNCTION', 'create-auth-hold-v2');
    expect(getVerifyPaymentFunctionName()).toBe('verify-payment-v2');
    expect(getCreateAuthHoldFunctionName()).toBe('create-auth-hold-v2');
    expect(isCheckoutV2Enabled()).toBe(true);
  });

  it('is enabled if only one of the two env vars is set', () => {
    vi.stubEnv('VITE_VERIFY_PAYMENT_FUNCTION', 'verify-payment-v2');
    vi.stubEnv('VITE_CREATE_AUTH_HOLD_FUNCTION', '');
    expect(isCheckoutV2Enabled()).toBe(true);
  });
});
