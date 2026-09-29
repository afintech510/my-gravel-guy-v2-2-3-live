import { describe, expect, it } from 'vitest';
import { computeOrderStatus, computeOrderStatusWithReview } from './statusMapping';

// This is the F2 regression test: verify-payment/index.ts computes `orderStatus` with exactly
// this logic (lines ~283-311) but then references an undeclared `paymentStatus` everywhere it's
// actually used, so the DB write always throws. These cases pin the correct, declared behavior.
describe('computeOrderStatus (F2 fix)', () => {
  it('defaults to pending when nothing is verified', () => {
    expect(computeOrderStatus({ paymentVerified: false, isAuthorized: false, usedFallback: false }, false)).toBe(
      'pending',
    );
  });

  it('is processed when fallback verification was used', () => {
    expect(computeOrderStatus({ paymentVerified: true, isAuthorized: false, usedFallback: true }, false)).toBe(
      'processed',
    );
  });

  it('is authorized for a manual-capture hold, paid for a captured payment', () => {
    expect(computeOrderStatus({ paymentVerified: true, isAuthorized: true, usedFallback: false }, false)).toBe(
      'authorized',
    );
    expect(computeOrderStatus({ paymentVerified: true, isAuthorized: false, usedFallback: false }, false)).toBe(
      'paid',
    );
  });

  it('maps a paid deposit checkout to the special "Deposit Paid" status', () => {
    expect(computeOrderStatus({ paymentVerified: true, isAuthorized: false, usedFallback: false }, true)).toBe(
      'Deposit Paid',
    );
  });

  it('does not relabel an authorized (not yet captured) deposit hold', () => {
    expect(computeOrderStatus({ paymentVerified: true, isAuthorized: true, usedFallback: false }, true)).toBe(
      'authorized',
    );
  });
});

describe('computeOrderStatusWithReview', () => {
  it('overrides everything to review_required when reviewRequired is true', () => {
    expect(
      computeOrderStatusWithReview({ paymentVerified: true, isAuthorized: false, usedFallback: false }, false, true),
    ).toBe('review_required');
  });

  it('falls through to computeOrderStatus when reviewRequired is false', () => {
    expect(
      computeOrderStatusWithReview({ paymentVerified: true, isAuthorized: false, usedFallback: false }, false, false),
    ).toBe('paid');
  });
});
