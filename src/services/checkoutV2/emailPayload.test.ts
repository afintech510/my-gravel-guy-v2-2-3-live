import { describe, expect, it } from 'vitest';
import { buildOrderEmailData, escapeHtml } from './emailPayload';

describe('escapeHtml', () => {
  it('escapes the standard HTML-significant characters', () => {
    expect(escapeHtml('<img src=x onerror=alert(1)>')).toBe(
      '&lt;img src=x onerror=alert(1)&gt;',
    );
    expect(escapeHtml(`Tom & "Jerry" 'O'Brien'`)).toBe('Tom &amp; &quot;Jerry&quot; &#39;O&#39;Brien&#39;');
  });

  it('handles null/undefined safely', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});

describe('buildOrderEmailData', () => {
  it('escapes every user-controlled string field it emits', () => {
    const xss = '<script>alert(1)</script>';
    const data = buildOrderEmailData({
      orderId: 'ORDER-1',
      customerEmail: 'test@example.com',
      customerName: xss,
      rows: [
        {
          product_name: xss,
          quantity: 1,
          total_price: 100,
          delivery_street: xss,
          delivery_city: xss,
          delivery_state: 'TX',
          delivery_zip: '75001',
          delivery_name: xss,
          delivery_email: 'c@example.com',
          delivery_phone: '555-1234',
          delivery_instructions: xss,
        },
      ],
    });

    const serialized = JSON.stringify(data);
    expect(serialized).not.toContain('<script>');
    expect(data.customer_name).toContain('&lt;script&gt;');
    expect(data.items[0].product_name).toContain('&lt;script&gt;');
    expect(data.items[0].delivery_address?.street).toContain('&lt;script&gt;');
    expect(data.items[0].contact_info?.name).toContain('&lt;script&gt;');
    expect(data.items[0].delivery_instructions).toContain('&lt;script&gt;');
  });

  it('sums total_amount from the rows and defaults an empty customer name', () => {
    const data = buildOrderEmailData({
      orderId: 'ORDER-1',
      customerEmail: 'test@example.com',
      customerName: '',
      rows: [
        { product_name: 'Gravel', quantity: 1, total_price: 100 },
        { product_name: 'Sand', quantity: 1, total_price: 50 },
      ],
    });
    expect(data.total_amount).toBe(150);
    expect(data.customer_name).toBe('Valued Customer');
  });

  it('omits delivery_address/contact_info when the row has no address/name', () => {
    const data = buildOrderEmailData({
      orderId: 'ORDER-1',
      customerEmail: 'test@example.com',
      customerName: 'Jane',
      rows: [{ product_name: 'Gravel', quantity: 1, total_price: 100 }],
    });
    expect(data.items[0].delivery_address).toBeUndefined();
    expect(data.items[0].contact_info).toBeUndefined();
  });
});
