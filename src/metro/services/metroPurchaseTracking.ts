// Fires the GA4 `purchase` event + Google Ads conversion for a metro order. Used from
// src/pages/metro/MetroOrderConfirmedPage.tsx — the ONLY caller (G3,
// docs/metro/research/metro-checkout-rereview.md; confirmed by grep) — from `applyResponse`'s
// success branch, on every successful verify-metro-payment response (including
// `alreadyProcessed: true` reloads; the `mgg_purchase_fired_<orderId>` localStorage guard below,
// not call-site gating, is what prevents a double-fire).
//
// Why this exists as a separate call rather than living in the shared handleDatabaseInsert
// tracking block: metro is fully isolated from the live /cart -> /checkout -> /payment-success ->
// verify-payment pipeline (see src/metro/checkout/contract.ts's header comment) — its own
// verify-metro-payment function and its own /metro-order-confirmed confirmation page, neither of
// which touches PaymentSuccess.tsx/handleDatabaseInsert. Without this, every metro purchase would
// be invisible to GA4/Google Ads. Field shape intentionally mirrors handleDatabaseInsert's
// tracking block (same event shape, same enhanced-conversion fields, same value calc) so metro
// and regular-checkout purchases report identically downstream — as of G3, MetroConfirmedOrder
// now carries `customerName`/`customerPhone` too, so the enhanced-conversion match rate is the
// same for both flows (previously metro always sent empty firstName/lastName/phone here).
import { trackGoogleAdsConversion, setEnhancedConversionData } from '@/utils/analytics';

export interface MetroPurchaseOrderRow {
  product_name: string;
  quantity: number;
  total_price: number;
  contact_name?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  delivery_address_street?: string | null;
  delivery_address_city?: string | null;
  delivery_address_state?: string | null;
  delivery_address_zip?: string | null;
}

/** Deduplicates via the same `mgg_purchase_fired_<orderId>` localStorage key the regular
 * /checkout path uses (see handleDatabaseInsert in PaymentSuccess.tsx), so a retried
 * verification (handleRetry) or a second mount never double-fires the conversion. */
export function trackMetroPurchaseConversion(orderId: string, orders: MetroPurchaseOrderRow[]): void {
  const purchaseFiredKey = `mgg_purchase_fired_${orderId}`;
  if (localStorage.getItem(purchaseFiredKey)) return;

  const totalValue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0);
  const firstOrder = orders[0];

  if (firstOrder) {
    const nameParts = (firstOrder.contact_name || '').split(' ');
    setEnhancedConversionData({
      email: firstOrder.contact_email || undefined,
      phone: firstOrder.contact_phone || undefined,
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' '),
      street: firstOrder.delivery_address_street || undefined,
      city: firstOrder.delivery_address_city || undefined,
      region: firstOrder.delivery_address_state || undefined,
      postalCode: firstOrder.delivery_address_zip || undefined,
      country: 'US',
    });
  }

  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      value: totalValue,
      currency: 'USD',
      items: orders.map(order => ({
        item_id: order.product_name,
        item_name: order.product_name,
        quantity: order.quantity,
        price: order.quantity ? order.total_price / order.quantity : order.total_price,
      })),
    });
  }

  trackGoogleAdsConversion('purchase', totalValue, orderId);
  localStorage.setItem(purchaseFiredKey, 'true');
  console.log('Metro purchase conversion tracked:', { orderId, value: totalValue });
}
