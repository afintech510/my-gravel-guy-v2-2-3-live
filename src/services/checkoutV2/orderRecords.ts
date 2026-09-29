// Builds `orders` insert/update rows for verify-payment-v2. Ported faithfully from
// verify-payment/index.ts's fresh-insert branch (lines ~608-688) and QUOTE- conversion branch
// (lines ~316-527), with the F2 fix applied (uses the computed status, never the undeclared
// `paymentStatus`) and UTM/coupon/deposit math delegated to pricing.ts's
// computeItemFinalPricing so there is exactly one implementation of that arithmetic.
//
// Deliberately NOT ported: verify-payment's CART- branch (lines 529-606, "update an existing
// cart-status row to an order"). Nothing in the live product creates a CART- order id through
// the checkout-v2 entry points this agent owns — Checkout.tsx always mints a fresh `ORDER-...`
// id (see Checkout.tsx's handleCheckout, unchanged by this work) and create-auth-hold-v2 does
// the same. Porting an unreachable branch just to match v1's line count would add untested,
// unexercised code to a payment path; see docs/metro/research/live-checkout-v2.md for the full
// reasoning and for what F5's RLS lockdown means for the (separate, pre-existing) "save cart"
// feature that legitimately still writes CART- rows today.
import type { BackupItem, BackupUtmData, OrderInsertRecord, OrderStatus } from './contract';
import { computeItemFinalPricing } from './pricing';

export interface BuildFreshOrderRecordsInput {
  orderId: string;
  items: BackupItem[];
  status: OrderStatus;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  billingName: string;
  billingEmail: string;
  couponCode: string | null;
  couponDiscount: number;
  depositOption: boolean;
  utmData?: BackupUtmData | null;
}

const utmFields = (utm: BackupUtmData | null | undefined) => ({
  gclid: utm?.gclid ?? null,
  gbraid: utm?.gbraid ?? null,
  wbraid: utm?.wbraid ?? null,
  utm_source: utm?.utm_source ?? null,
  utm_medium: utm?.utm_medium ?? null,
  utm_campaign: utm?.utm_campaign ?? null,
  utm_term: utm?.utm_term ?? null,
  utm_content: utm?.utm_content ?? null,
  landing_page_url: utm?.landing_page_url ?? null,
  referrer: utm?.referrer ?? null,
  user_agent: utm?.user_agent ?? null,
});

const toDeliveryDateString = (date: string | Date | undefined | null): string | null => {
  if (!date) return null;
  return date instanceof Date ? date.toISOString() : date;
};

export const buildFreshOrderRecords = (input: BuildFreshOrderRecordsInput): OrderInsertRecord[] => {
  const backupItemsForPricing = input.items.map((item) => ({
    total_price: item.total_price ?? item.price * (item.tons ?? item.quantity ?? 1),
  }));
  const pricing = computeItemFinalPricing({
    items: backupItemsForPricing,
    couponDiscount: input.couponDiscount,
    depositOption: input.depositOption,
  });

  return input.items.map((item, index) => {
    const quantity = item.tons ?? item.quantity ?? 1;
    const { finalItemPrice, depositAmount, balanceDue } = pricing[index];

    return {
      order_id: input.orderId,
      stripe_payment_intent_id: input.stripePaymentIntentId,
      stripe_session_id: input.stripeSessionId,
      product_id: String(item.id),
      unit: 'tons',
      unit_price: item.price,
      total_price: finalItemPrice,
      quantity,
      status: input.status,
      delivery_date: toDeliveryDateString(item.deliveryDate),
      delivery_street: item.deliveryAddress?.street ?? null,
      delivery_city: item.deliveryAddress?.city ?? null,
      delivery_state: item.deliveryAddress?.state ?? null,
      delivery_zip: item.deliveryAddress?.zip ?? null,
      delivery_name: item.contactInfo?.name ?? null,
      delivery_phone: item.contactInfo?.phone ?? null,
      delivery_email: item.contactInfo?.email ?? null,
      delivery_time_preference: item.deliveryTimePreference ?? null,
      delivery_instructions: item.deliveryInstructions ?? null,
      billing_name: input.billingName,
      billing_email: input.billingEmail,
      coupon: input.couponCode,
      is_deposit_payment: input.depositOption,
      deposit_amount: depositAmount,
      balance_due: balanceDue,
      ...utmFields(input.utmData),
    };
  });
};

export interface QuoteConversionUpdateInput {
  orderIdFromQuote: string;
  status: OrderStatus;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  utmData?: BackupUtmData | null;
}

/** Update payload for flipping existing `status = 'Quote'` rows (matched by the original
 * `QUOTE-...` order_id) to a confirmed order — mirrors verify-payment/index.ts lines 412-436. */
export const buildQuoteConversionUpdate = (input: QuoteConversionUpdateInput) => ({
  order_id: input.orderIdFromQuote,
  status: input.status,
  stripe_payment_intent_id: input.stripePaymentIntentId,
  stripe_session_id: input.stripeSessionId,
  quote_converted: true,
  ...utmFields(input.utmData),
});
