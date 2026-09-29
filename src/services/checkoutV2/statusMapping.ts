// Order status mapping for verify-payment-v2 — this is the fix for F2
// (docs/metro/research/verify-payment-paymentstatus-bug.md): verify-payment/index.ts computes
// `orderStatus` correctly (lines ~283-311) but then references an undeclared `paymentStatus` at
// the three places that actually write it to the DB/response, so every DB write throws and is
// silently swallowed. This module is that same logic, declared and named correctly, plus the new
// `review_required` outcome for a binding failure (F1) or a hard price-floor rejection.
import type { OrderStatus, VerificationInfo } from './contract';

export const computeOrderStatus = (
  verification: VerificationInfo,
  isDepositPayment: boolean,
): OrderStatus => {
  let status: OrderStatus = 'pending';
  if (verification.usedFallback) {
    status = 'processed';
  } else if (verification.paymentVerified) {
    status = verification.isAuthorized ? 'authorized' : 'paid';
  }
  if (isDepositPayment && status === 'paid') {
    status = 'Deposit Paid';
  }
  return status;
};

/** Wraps computeOrderStatus for the review_required override — used whenever binding
 * (src/services/checkoutV2/binding.ts) fails or the price-floor check rejected the order at
 * create time but a real payment still landed (see live-checkout-v2.md: "never silently drop a
 * paid order"). */
export const computeOrderStatusWithReview = (
  verification: VerificationInfo,
  isDepositPayment: boolean,
  reviewRequired: boolean,
): OrderStatus => (reviewRequired ? 'review_required' : computeOrderStatus(verification, isDepositPayment));
