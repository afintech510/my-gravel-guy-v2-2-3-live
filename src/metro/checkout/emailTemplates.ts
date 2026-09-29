// Pure HTML-escaping + email-template builders shared by verify-metro-payment and
// metro-stripe-webhook (both import this via the bundle — see bundleEntry.ts). Fixes
// security-review finding F4: every field that traces back to user input (contact.name,
// customer email, delivery address lines, drop notes if ever surfaced) is now run through
// escapeHtml before being interpolated into an outbound HTML email. Order id, variant name,
// zone name, and dollar amounts are server-derived (order id is our own generated string;
// variant/zone names come from the static in-repo metro config, never from the request) but are
// escaped too, defensively — cheap insurance against a future field becoming user-controlled
// without this file being revisited.
//
// No I/O, no Deno/Node APIs — bundled into supabase/functions/_shared/metro-checkout.bundle.js
// by scripts/metro/export-metro-checkout-bundle.mjs, same as every other file under
// src/metro/checkout/**.

/** Escapes the five HTML-significant characters. Non-string input is coerced via String() first
 * (so a number/undefined/null can be passed directly without the caller needing a ternary at
 * every call site) — null/undefined become ''. */
export const escapeHtml = (value: unknown): string => {
  const str = value === null || value === undefined ? '' : String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export interface MetroOrderEmailData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  variantName: string;
  quantity: number;
  unit: string;
  totalAmount: number;
  deliveryDate?: string | null;
  deliveryStreet?: string | null;
  deliveryCity?: string | null;
  deliveryState?: string | null;
  deliveryZip?: string | null;
}

const formatUsd = (amount: number): string => `$${Number(amount).toFixed(2)}`;

const deliveryAddressRow = (data: MetroOrderEmailData): string => {
  if (!data.deliveryStreet) return '';
  const line = [data.deliveryStreet, data.deliveryCity, data.deliveryState, data.deliveryZip]
    .filter(Boolean)
    .map(escapeHtml)
    .join(', ');
  return `<tr><td style="padding:8px 0;"><strong>Delivery Address</strong></td><td>${line}</td></tr>`;
};

const deliveryDateRow = (data: MetroOrderEmailData): string =>
  data.deliveryDate
    ? `<tr><td style="padding:8px 0;"><strong>Delivery Date</strong></td><td>${escapeHtml(data.deliveryDate)}</td></tr>`
    : '';

export const buildCustomerConfirmationHtml = (data: MetroOrderEmailData): string => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#059669;">Order Confirmed!</h1>
      <p>Hi ${escapeHtml(data.customerName)},</p>
      <p>Thanks for your order — here are the details:</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;"><strong>Order ID</strong></td><td>${escapeHtml(data.orderId)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Material</strong></td><td>${escapeHtml(data.variantName)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Quantity</strong></td><td>${escapeHtml(data.quantity)} ${escapeHtml(data.unit)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Total</strong></td><td>${formatUsd(data.totalAmount)}</td></tr>
        ${deliveryDateRow(data)}
        ${deliveryAddressRow(data)}
      </table>
      <p>We'll be in touch to confirm delivery details. Reply to this email with any questions.</p>
    </div>`;

export const buildInternalNotificationHtml = (data: MetroOrderEmailData): string => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1>New Metro Order</h1>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;"><strong>Order ID</strong></td><td>${escapeHtml(data.orderId)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Customer</strong></td><td>${escapeHtml(data.customerName)} (${escapeHtml(data.customerEmail)})</td></tr>
        <tr><td style="padding:8px 0;"><strong>Material</strong></td><td>${escapeHtml(data.variantName)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Quantity</strong></td><td>${escapeHtml(data.quantity)} ${escapeHtml(data.unit)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Total</strong></td><td>${formatUsd(data.totalAmount)}</td></tr>
        ${deliveryDateRow(data)}
        ${deliveryAddressRow(data)}
      </table>
    </div>`;

/** Internal-only alert for a `review_required` conversion (metadata/price mismatch at verify
 * time) — never sent to the customer; `reason` is our own server-generated diagnostic string
 * (not user input) but is escaped anyway for consistency/defense in depth. */
export const buildReviewRequiredInternalHtml = (data: MetroOrderEmailData, reason: string): string => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#b91c1c;">Metro Order Needs Review</h1>
      <p>A metro checkout session was paid, but the order could not be auto-confirmed and needs
      manual review before contacting the customer.</p>
      <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;"><strong>Order ID</strong></td><td>${escapeHtml(data.orderId)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Customer</strong></td><td>${escapeHtml(data.customerName)} (${escapeHtml(data.customerEmail)})</td></tr>
        <tr><td style="padding:8px 0;"><strong>Material</strong></td><td>${escapeHtml(data.variantName)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Quantity</strong></td><td>${escapeHtml(data.quantity)} ${escapeHtml(data.unit)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Total</strong></td><td>${formatUsd(data.totalAmount)}</td></tr>
        ${deliveryDateRow(data)}
        ${deliveryAddressRow(data)}
      </table>
    </div>`;

/** Data available for the G1 (metro-checkout-rereview.md) order-insert-failure alert — deliberately
 * NOT `MetroOrderEmailData`-shaped: a genuine `orders` insert failure (Postgres outage, etc.) means
 * there is no order row to read customer/material details off of, only what's recoverable from the
 * verified Stripe session itself (metadata + amount) plus the DB error text. */
export interface MetroOrderErrorAlertData {
  orderId: string;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  /** Dollars, or null when the session had no resolvable `amount_total`. */
  amount: number | null;
  customerEmail: string;
  dbErrorMessage: string;
}

/** Internal-only alert for a genuine (non-unique-violation) `orders` insert failure after a
 * Stripe payment has already been verified/authorized — see G1 in
 * docs/metro/research/metro-checkout-rereview.md. Reuses the same visual template/escaping
 * approach as `buildReviewRequiredInternalHtml` (never sent to the customer); `dbErrorMessage`
 * is a Postgres/Supabase error string, not user input, but is escaped anyway for defense in
 * depth, same rationale as `reason` above. */
export const buildOrderInsertFailedInternalHtml = (data: MetroOrderErrorAlertData): string => `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <h1 style="color:#b91c1c;">Metro Order Insert Failed — Payment Already Verified</h1>
      <p>Stripe confirmed payment for a metro checkout session, but writing the <code>orders</code>
      row failed. <strong>This order may not exist anywhere except this email.</strong> Please
      verify manually in Stripe and the database, and create the order by hand if it's missing.</p>
      <p><strong>Database error:</strong> ${escapeHtml(data.dbErrorMessage)}</p>
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="padding:8px 0;"><strong>Order ID</strong></td><td>${escapeHtml(data.orderId)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Stripe Session ID</strong></td><td>${escapeHtml(data.stripeSessionId)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Stripe Payment Intent ID</strong></td><td>${escapeHtml(data.stripePaymentIntentId ?? '(none)')}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Amount</strong></td><td>${data.amount === null ? '(unknown)' : formatUsd(data.amount)}</td></tr>
        <tr><td style="padding:8px 0;"><strong>Customer Email</strong></td><td>${escapeHtml(data.customerEmail || '(none)')}</td></tr>
      </table>
    </div>`;
