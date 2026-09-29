import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/utils/analytics', () => ({
  trackGoogleAdsConversion: vi.fn(),
  setEnhancedConversionData: vi.fn(),
}));

import { trackMetroPurchaseConversion, type MetroPurchaseOrderRow } from './metroPurchaseTracking';
import { trackGoogleAdsConversion, setEnhancedConversionData } from '@/utils/analytics';

const mockTrackGoogleAds = trackGoogleAdsConversion as unknown as ReturnType<typeof vi.fn>;
const mockSetEnhancedConversionData = setEnhancedConversionData as unknown as ReturnType<typeof vi.fn>;

const order: MetroPurchaseOrderRow = {
  product_name: 'metro:dallas-fort-worth:gravel:pea-gravel',
  quantity: 10,
  total_price: 700,
  contact_name: 'QA Tester',
  contact_email: 'qa@example.com',
  contact_phone: '555-123-4567',
  delivery_address_street: '123 Test Ln',
  delivery_address_city: null,
  delivery_address_state: 'TX',
  delivery_address_zip: '75001',
};

beforeEach(() => {
  localStorage.clear();
  mockTrackGoogleAds.mockReset();
  mockSetEnhancedConversionData.mockReset();
  (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag = vi.fn();
});

describe('trackMetroPurchaseConversion', () => {
  it('fires the GA4 purchase event and Google Ads conversion with the order total/items', () => {
    trackMetroPurchaseConversion('ORDER-METRO-abc', [order]);

    expect(window.gtag).toHaveBeenCalledWith(
      'event',
      'purchase',
      expect.objectContaining({
        transaction_id: 'ORDER-METRO-abc',
        value: 700,
        currency: 'USD',
        items: [expect.objectContaining({ item_id: order.product_name, quantity: 10, price: 70 })],
      }),
    );
    expect(mockTrackGoogleAds).toHaveBeenCalledWith('purchase', 700, 'ORDER-METRO-abc');
    expect(mockSetEnhancedConversionData).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'qa@example.com', phone: '555-123-4567', firstName: 'QA', lastName: 'Tester' }),
    );
  });

  it('deduplicates via the mgg_purchase_fired_<orderId> localStorage key, same as the regular checkout path', () => {
    trackMetroPurchaseConversion('ORDER-METRO-abc', [order]);
    (window.gtag as ReturnType<typeof vi.fn>).mockClear();
    mockTrackGoogleAds.mockClear();

    trackMetroPurchaseConversion('ORDER-METRO-abc', [order]);

    expect(window.gtag).not.toHaveBeenCalled();
    expect(mockTrackGoogleAds).not.toHaveBeenCalled();
  });

  it('sums total_price across multiple order rows for the reported value', () => {
    const second = { ...order, total_price: 50 };
    trackMetroPurchaseConversion('ORDER-METRO-multi', [order, second]);

    expect(mockTrackGoogleAds).toHaveBeenCalledWith('purchase', 750, 'ORDER-METRO-multi');
  });
});
