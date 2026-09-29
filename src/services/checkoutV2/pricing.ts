// Amount math + server-side price validation for create-auth-hold-v2 / verify-payment-v2.
//
// Design decision (documented in full in docs/metro/research/live-checkout-v2.md): the legacy
// `/cart` -> `/checkout` flow does not have a single server-reproducible pricing function the
// way metro's src/metro/checkout/serverQuote.ts does. `item.price` reaching create-auth-hold can
// already reflect a ZIP-code adjustment applied earlier in the flow (see CartItem.basePrice's
// comment in src/contexts/CartContext.tsx — "Original product price before ZIP code
// adjustments") plus a proportional coupon discount and/or the flat $199 deposit split
// (src/pages/Checkout.tsx's formatCartItemsForStripe). None of that ZIP/coupon logic is
// centralized anywhere this agent could find and faithfully port without risking a different,
// worse bug (silently rejecting legitimate discounted/zip-adjusted orders on a live site).
//
// So this module implements "detect and flag" per the task brief's fallback option, with one
// piece of real enforcement layered on top for the specific, named threat ("a tampered client can
// create a $1 hold for a $1,000 order"): every item's submitted per-unit price is checked against
// a floor derived from the product's canonical DB price (products.price). Below the floor is
// rejected outright (409 PRICE_CHANGED) since there is no legitimate business path that produces
// a near-zero price. At or above the floor is labeled 'unverifiable' (not 'ok') because this
// module cannot positively confirm the price is *correct*, only that it isn't absurdly low —
// verify-payment-v2 never uses 'unverifiable' to block anything, only to inform.
//
// The one case this module CAN fully verify is a flat-fee deposit checkout: Checkout.tsx always
// charges exactly $199 for a deposit regardless of cart contents, so that path is checked exactly
// and labeled 'ok'.
import {
  AMOUNT_TOLERANCE_CENTS,
  PRICE_FLOOR_RATIO,
  type ItemPriceEvaluation,
  type PriceEvaluationResult,
  type ProductPriceLookup,
  type StripeItemInput,
} from './contract';

export const DEPOSIT_AMOUNT_CENTS = 19900; // $199.00, matches Checkout.tsx / create-auth-hold today

/** Cents Stripe will actually charge for one line item — matches create-auth-hold's
 * `unit_amount: Math.round(item.price * 100)` times Stripe's own quantity multiplication. Using
 * this (not a single round-the-grand-total operation) keeps the expected total exactly equal to
 * what Stripe will report back as `amount_total`, cent for cent. */
export const lineItemAmountCents = (item: Pick<StripeItemInput, 'price' | 'quantity'>): number =>
  Math.round(item.price * 100) * Math.max(0, Math.round(item.quantity));

export const computeBaseAmountCents = (items: Pick<StripeItemInput, 'price' | 'quantity'>[]): number =>
  items.reduce((sum, item) => sum + lineItemAmountCents(item), 0);

export const computeExpectedTotalCents = (
  items: Pick<StripeItemInput, 'price' | 'quantity'>[],
  depositOption: boolean | undefined,
): number => (depositOption ? DEPOSIT_AMOUNT_CENTS : computeBaseAmountCents(items));

/** amount_total (from Stripe, cents) vs. expectedTotalCents (from our own metadata). */
export const amountsMatch = (
  actualCents: number | null | undefined,
  expectedCents: number,
  toleranceCents: number = AMOUNT_TOLERANCE_CENTS,
): boolean =>
  typeof actualCents === 'number' && Math.abs(actualCents - expectedCents) <= toleranceCents;

const idAsString = (id: string | number): string => String(id);

/** Evaluates every item's submitted price against its DB price. Deposit checkouts are always
 * 'ok' (see module doc) — the per-item comparison is skipped entirely for them since the $199
 * flat fee has nothing to do with individual item prices. */
export const evaluateItemPrices = (
  items: StripeItemInput[],
  dbPrices: ProductPriceLookup[],
  depositOption: boolean | undefined,
): PriceEvaluationResult => {
  if (depositOption) {
    return {
      verdict: 'ok',
      items: items.map((item) => ({
        id: idAsString(item.id),
        submittedPrice: item.price,
        dbPrice: null,
        verdict: 'ok',
        reason: 'Deposit checkout charges a flat $199 regardless of item price.',
      })),
    };
  }

  const dbPriceById = new Map(dbPrices.map((p) => [p.id, p.price]));
  const evaluations: ItemPriceEvaluation[] = items.map((item) => {
    const id = idAsString(item.id);
    const dbPrice = dbPriceById.has(id) ? dbPriceById.get(id)! : null;

    if (item.price <= 0) {
      return { id, submittedPrice: item.price, dbPrice, verdict: 'mismatch', reason: 'Submitted price is not positive.' };
    }
    if (dbPrice === null || dbPrice === undefined) {
      return {
        id,
        submittedPrice: item.price,
        dbPrice: null,
        verdict: 'unverifiable',
        reason: 'Product id not found in products table — cannot check against a canonical price.',
      };
    }
    const floor = dbPrice * PRICE_FLOOR_RATIO;
    if (item.price < floor) {
      return {
        id,
        submittedPrice: item.price,
        dbPrice,
        verdict: 'mismatch',
        reason: `Submitted price ${item.price} is below the ${PRICE_FLOOR_RATIO * 100}% floor of DB price ${dbPrice} (floor ${floor.toFixed(2)}).`,
      };
    }
    return {
      id,
      submittedPrice: item.price,
      dbPrice,
      verdict: 'unverifiable',
      reason: 'Above the tamper floor, but ZIP-adjustment/coupon math cannot be independently reproduced server-side.',
    };
  });

  const verdict = evaluations.some((e) => e.verdict === 'mismatch') ? 'mismatch' : 'unverifiable';
  return { verdict, items: evaluations };
};

/** Coupon + deposit math ported faithfully from verify-payment/index.ts's fresh-insert branch
 * (lines ~608-688) so verify-payment-v2 computes identical per-item total_price/deposit_amount/
 * balance_due values. `items` here are the *backup* items (post add-to-cart, pre-Stripe), each
 * carrying its own `total_price` (== price * quantity, before any coupon discount). */
export interface DepositCouponInput {
  items: { total_price: number }[];
  couponDiscount: number; // 0 if no coupon
  depositOption: boolean;
}

export interface DepositCouponItemResult {
  finalItemPrice: number;
  depositAmount: number | null;
  balanceDue: number | null;
}

export const computeItemFinalPricing = (
  input: DepositCouponInput,
): DepositCouponItemResult[] => {
  const { items, couponDiscount, depositOption } = input;
  const originalTotal = items.reduce((sum, i) => sum + i.total_price, 0);
  const depositAmount = depositOption ? 199 : null;
  const balanceDue = depositOption ? originalTotal - couponDiscount - 199 : null;

  return items.map((item) => {
    const itemDiscount =
      couponDiscount > 0 && originalTotal > 0 ? (item.total_price / originalTotal) * couponDiscount : 0;
    const finalItemPrice = item.total_price - itemDiscount;
    return {
      finalItemPrice: depositOption ? depositAmount! / items.length : finalItemPrice,
      depositAmount,
      balanceDue,
    };
  });
};
