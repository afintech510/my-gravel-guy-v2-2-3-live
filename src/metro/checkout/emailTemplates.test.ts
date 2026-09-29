import { describe, expect, it } from 'vitest';
import {
  buildCustomerConfirmationHtml,
  buildInternalNotificationHtml,
  buildOrderInsertFailedInternalHtml,
  buildReviewRequiredInternalHtml,
  escapeHtml,
  type MetroOrderEmailData,
  type MetroOrderErrorAlertData,
} from './emailTemplates';

describe('escapeHtml', () => {
  it('escapes all five HTML-significant characters', () => {
    expect(escapeHtml(`<img src=x onerror=alert(1)> & "quoted" 'single'`)).toBe(
      '&lt;img src=x onerror=alert(1)&gt; &amp; &quot;quoted&quot; &#39;single&#39;',
    );
  });

  it('coerces numbers and returns empty string for null/undefined', () => {
    expect(escapeHtml(5)).toBe('5');
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('leaves plain text unchanged', () => {
    expect(escapeHtml('Jane Doe')).toBe('Jane Doe');
  });
});

const data: MetroOrderEmailData = {
  orderId: 'ORDER-METRO-123-abc',
  customerName: '<script>alert(1)</script>',
  customerEmail: 'evil"><img src=x onerror=alert(2)>@example.com',
  variantName: 'Pea Gravel',
  quantity: 10,
  unit: 'ton',
  totalAmount: 312.5,
  deliveryDate: '2026-10-05',
  deliveryStreet: '<b>123</b> Main St',
  deliveryCity: 'Dallas',
  deliveryState: 'TX',
  deliveryZip: '75201',
};

describe('email templates HTML-escape every user-provided field (security-review F4)', () => {
  it('buildCustomerConfirmationHtml never emits a raw <script> or unescaped attribute breakout', () => {
    const html = buildCustomerConfirmationHtml(data);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x onerror=alert(2)>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;b&gt;123&lt;/b&gt; Main St');
    expect(html).toContain('$312.50');
  });

  it('buildInternalNotificationHtml escapes the same fields', () => {
    const html = buildInternalNotificationHtml(data);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('buildReviewRequiredInternalHtml escapes both the order data and the reason string', () => {
    const html = buildReviewRequiredInternalHtml(data, '<img src=x onerror=alert(3)> amount mismatch');
    expect(html).not.toContain('<img src=x onerror=alert(3)>');
    expect(html).toContain('&lt;img src=x onerror=alert(3)&gt; amount mismatch');
    expect(html).not.toContain('<script>');
  });

  it('omits the delivery address row entirely when there is no street (never renders undefined/null literals)', () => {
    const html = buildCustomerConfirmationHtml({ ...data, deliveryStreet: null });
    expect(html).not.toContain('Delivery Address');
  });
});

describe('buildOrderInsertFailedInternalHtml (G1 — metro-checkout-rereview.md)', () => {
  const errorData: MetroOrderErrorAlertData = {
    orderId: 'ORDER-METRO-123-abc',
    stripeSessionId: 'cs_test_<script>alert(1)</script>',
    stripePaymentIntentId: 'pi_test_456',
    amount: 312.5,
    customerEmail: 'evil"><img src=x onerror=alert(2)>@example.com',
    dbErrorMessage: '<img src=x onerror=alert(3)> connection terminated unexpectedly',
  };

  it('escapes every field, including the DB error message and session/payment-intent ids', () => {
    const html = buildOrderInsertFailedInternalHtml(errorData);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x onerror=alert(2)>');
    expect(html).not.toContain('<img src=x onerror=alert(3)>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('&lt;img src=x onerror=alert(3)&gt; connection terminated unexpectedly');
  });

  it('includes order id, session id, payment intent id, amount, and customer email', () => {
    const html = buildOrderInsertFailedInternalHtml(errorData);
    expect(html).toContain('ORDER-METRO-123-abc');
    expect(html).toContain('pi_test_456');
    expect(html).toContain('$312.50');
  });

  it('renders placeholders instead of blank/undefined for a null payment intent or unknown amount', () => {
    const html = buildOrderInsertFailedInternalHtml({ ...errorData, stripePaymentIntentId: null, amount: null });
    expect(html).toContain('(none)');
    expect(html).toContain('(unknown)');
    expect(html).not.toContain('undefined');
    expect(html).not.toContain('null');
  });

  it('renders a placeholder instead of an empty cell when customerEmail is empty', () => {
    const html = buildOrderInsertFailedInternalHtml({ ...errorData, customerEmail: '' });
    expect(html).toContain('(none)');
  });
});
