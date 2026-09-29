// HTML-escaping + email payload building for verify-payment-v2. Requirement (e) of the S1
// brief: move the customer confirmation + internal notification emails that
// PaymentSuccess.tsx's `handleDatabaseInsert` sends today (client-side, via
// src/services/emailService.ts -> src/utils/emailTemplates.ts) into verify-payment-v2, using the
// *same* templates, but with every user-supplied string escaped first — those templates
// interpolate raw `${...}` with no escaping (confirmed by reading src/utils/emailTemplates.ts in
// full), which is fine for a client-only insert path but not acceptable now that the same HTML
// is being assembled server-side from data this endpoint cannot re-validate as painstakingly as
// metro's serverQuote.ts does (see docs/metro/research/metro-checkout-security-review.md's F4,
// fixed the same way for metro's own templates in src/metro/checkout/emailTemplates.ts).
export const escapeHtml = (input: string | null | undefined): string => {
  if (input === null || input === undefined) return '';
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

export interface EmailOrderRow {
  product_name: string;
  quantity: number;
  total_price: number;
  delivery_date?: string | null;
  delivery_street?: string | null;
  delivery_city?: string | null;
  delivery_state?: string | null;
  delivery_zip?: string | null;
  delivery_name?: string | null;
  delivery_email?: string | null;
  delivery_phone?: string | null;
  delivery_time_preference?: string | null;
  delivery_instructions?: string | null;
}

export interface EmailOrderItem {
  product_name: string;
  quantity: number;
  total_price: number;
  delivery_date?: string;
  delivery_address?: { street: string; city: string; state: string; zip: string };
  contact_info?: { name: string; email: string; phone: string };
  delivery_time_preference?: string;
  delivery_instructions?: string;
}

export interface EmailOrderData {
  order_id: string;
  items: EmailOrderItem[];
  total_amount: number;
  customer_email: string;
  customer_name: string;
  base_total?: number;
  coupon_info?: { code: string; total_discount: number; applied: boolean } | null;
  is_deposit_payment?: boolean;
  deposit_amount?: number;
  balance_due?: number;
}

export interface BuildOrderEmailDataInput {
  orderId: string;
  rows: EmailOrderRow[];
  customerEmail: string;
  customerName: string;
  couponInfo?: { code: string; discount: number } | null;
  baseTotal?: number;
  isDepositPayment?: boolean;
  depositAmount?: number | null;
  balanceDue?: number | null;
}

/** Builds the exact object shape src/utils/emailTemplates.ts's generateCustomerConfirmationEmail
 * / generateInternalNotificationEmail expect (their local, unexported `OrderData` interface —
 * matched structurally here rather than imported, since it isn't exported), with every
 * user-controlled string field escaped. */
export const buildOrderEmailData = (input: BuildOrderEmailDataInput): EmailOrderData => {
  const items: EmailOrderItem[] = input.rows.map((row) => ({
    product_name: escapeHtml(row.product_name),
    quantity: row.quantity,
    total_price: row.total_price,
    delivery_date: row.delivery_date ?? undefined,
    delivery_address: row.delivery_street
      ? {
          street: escapeHtml(row.delivery_street),
          city: escapeHtml(row.delivery_city),
          state: escapeHtml(row.delivery_state),
          zip: escapeHtml(row.delivery_zip),
        }
      : undefined,
    contact_info: row.delivery_name
      ? {
          name: escapeHtml(row.delivery_name),
          email: escapeHtml(row.delivery_email),
          phone: escapeHtml(row.delivery_phone),
        }
      : undefined,
    delivery_time_preference: row.delivery_time_preference ?? undefined,
    delivery_instructions: row.delivery_instructions ? escapeHtml(row.delivery_instructions) : undefined,
  }));

  const total_amount = input.rows.reduce((sum, row) => sum + row.total_price, 0);

  return {
    order_id: input.orderId,
    items,
    total_amount,
    customer_email: input.customerEmail,
    customer_name: escapeHtml(input.customerName) || 'Valued Customer',
    base_total: input.baseTotal,
    coupon_info: input.couponInfo
      ? { code: escapeHtml(input.couponInfo.code), total_discount: input.couponInfo.discount, applied: true }
      : null,
    is_deposit_payment: input.isDepositPayment,
    deposit_amount: input.depositAmount ?? undefined,
    balance_due: input.balanceDue ?? undefined,
  };
};

export const buildCustomerEmailSubject = (orderId: string): string => `Order Confirmation - ${orderId}`;
export const buildInternalEmailSubject = (customerName: string): string =>
  `New Order Notification - ${customerName}`;

/** review_required internal alert — a distinct email from the normal internal notification,
 * sent when a binding check (src/services/checkoutV2/binding.ts) or the price floor
 * (src/services/checkoutV2/pricing.ts) fails but a real Stripe payment still exists, so a human
 * has to look at it (requirement (b): "never silently drop a paid order"). */
export const buildReviewRequiredAlertSubject = (orderId: string): string =>
  `[REVIEW REQUIRED] Order ${orderId} needs manual verification`;

export const buildReviewRequiredAlertHtml = (opts: { orderId: string; reason: string; sessionId: string | null }): string => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Review Required</title></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="margin: 0; font-size: 22px;">Order flagged for manual review</h1>
  </div>
  <div style="background: #fef2f2; padding: 20px; border: 1px solid #fca5a5; border-radius: 0 0 8px 8px;">
    <p><strong>Order ID:</strong> ${escapeHtml(opts.orderId)}</p>
    <p><strong>Stripe session:</strong> ${escapeHtml(opts.sessionId ?? 'unknown')}</p>
    <p><strong>Reason:</strong> ${escapeHtml(opts.reason)}</p>
    <p>A payment was received but could not be automatically bound to a verified order. The order
    row was created with status <code>review_required</code> — please verify this payment in
    Stripe and reconcile the order manually before it ships.</p>
  </div>
</body>
</html>
`;
