
// Google Ads Conversion Tracking Utility

// Define window with gtag and Google Ads conversion tracking
declare global {
  interface Window {
    gtag: (
      command: string,
      action: string,
      params?: any
    ) => void;
  }
}

/**
 * Track Google Ads conversion
 * @param conversionId - Your Google Ads conversion ID (e.g., 'AW-CONVERSION_ID')
 * @param conversionLabel - The conversion label
 * @param value - Optional conversion value
 * @param currency - Currency code (default: 'USD')
 * @param transactionId - Optional unique transaction ID
 */
export const trackGoogleAdsConversion = (
  conversionId: string,
  conversionLabel: string,
  value?: number,
  currency: string = 'USD',
  transactionId?: string
) => {
  if (!window.gtag) {
    console.warn('Google Analytics/Ads not loaded');
    return;
  }

  const conversionParams: any = {
    'send_to': `${conversionId}/${conversionLabel}`,
  };

  if (value !== undefined) {
    conversionParams.value = value;
    conversionParams.currency = currency;
  }

  if (transactionId) {
    conversionParams.transaction_id = transactionId;
  }

  window.gtag('event', 'conversion', conversionParams);

  console.log('Google Ads conversion tracked:', {
    conversionId,
    conversionLabel,
    value,
    currency,
    transactionId
  });
};

/**
 * Track purchase conversion
 * @param orderId - Order ID
 * @param value - Total order value
 * @param currency - Currency code
 * @param items - Array of purchased items
 */
export const trackPurchaseConversion = (
  orderId: string,
  value: number,
  currency: string = 'USD',
  items?: any[]
) => {
  // Replace with your actual Google Ads conversion ID and label
  const PURCHASE_CONVERSION_ID = 'AW-YOUR_CONVERSION_ID';
  const PURCHASE_CONVERSION_LABEL = 'PURCHASE_LABEL';

  trackGoogleAdsConversion(
    PURCHASE_CONVERSION_ID,
    PURCHASE_CONVERSION_LABEL,
    value,
    currency,
    orderId
  );

  // Also track enhanced ecommerce purchase
  if (window.gtag && items) {
    window.gtag('event', 'purchase', {
      transaction_id: orderId,
      value: value,
      currency: currency,
      items: items.map(item => ({
        item_id: item.product_name || item.id,
        item_name: item.product_name || item.name,
        category: 'Landscape Materials',
        quantity: item.quantity || 1,
        price: item.total_price || item.price || 0
      }))
    });
  }
};

/**
 * Track lead/quote conversion
 * @param leadType - Type of lead (quote_request, contact_form, etc.)
 * @param value - Optional lead value
 */
export const trackLeadConversion = (
  leadType: string = 'quote_request',
  value?: number
) => {
  // Replace with your actual Google Ads conversion ID and label
  const LEAD_CONVERSION_ID = 'AW-YOUR_CONVERSION_ID';
  const LEAD_CONVERSION_LABEL = 'LEAD_LABEL';

  trackGoogleAdsConversion(
    LEAD_CONVERSION_ID,
    LEAD_CONVERSION_LABEL,
    value
  );

  // Also track as GA4 event
  if (window.gtag) {
    window.gtag('event', 'generate_lead', {
      event_category: 'Lead Generation',
      event_label: leadType,
      value: value
    });
  }
};

/**
 * Track add to cart conversion
 * @param item - Item added to cart
 * @param value - Item value
 */
export const trackAddToCartConversion = (
  item: any,
  value: number
) => {
  // Replace with your actual Google Ads conversion ID and label
  const ADD_TO_CART_CONVERSION_ID = 'AW-YOUR_CONVERSION_ID';
  const ADD_TO_CART_CONVERSION_LABEL = 'ADD_TO_CART_LABEL';

  trackGoogleAdsConversion(
    ADD_TO_CART_CONVERSION_ID,
    ADD_TO_CART_CONVERSION_LABEL,
    value
  );

  // Also track enhanced ecommerce add_to_cart
  if (window.gtag) {
    window.gtag('event', 'add_to_cart', {
      currency: 'USD',
      value: value,
      items: [{
        item_id: item.id,
        item_name: item.name,
        category: 'Landscape Materials',
        quantity: item.quantity || 1,
        price: value
      }]
    });
  }
};

/**
 * Track checkout initiation
 * @param cartValue - Total cart value
 * @param items - Cart items
 */
export const trackBeginCheckoutConversion = (
  cartValue: number,
  items: any[]
) => {
  // Replace with your actual Google Ads conversion ID and label
  const BEGIN_CHECKOUT_CONVERSION_ID = 'AW-YOUR_CONVERSION_ID';
  const BEGIN_CHECKOUT_CONVERSION_LABEL = 'BEGIN_CHECKOUT_LABEL';

  trackGoogleAdsConversion(
    BEGIN_CHECKOUT_CONVERSION_ID,
    BEGIN_CHECKOUT_CONVERSION_LABEL,
    cartValue
  );

  // Also track enhanced ecommerce begin_checkout
  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'USD',
      value: cartValue,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        category: 'Landscape Materials',
        quantity: item.quantity || 1,
        price: item.price || 0
      }))
    });
  }
};

/**
 * Track calculator usage conversion
 * @param calculatorType - Type of calculator used
 * @param productType - Product being calculated
 */
export const trackCalculatorConversion = (
  calculatorType: string,
  productType?: string
) => {
  // Replace with your actual Google Ads conversion ID and label
  const CALCULATOR_CONVERSION_ID = 'AW-YOUR_CONVERSION_ID';
  const CALCULATOR_CONVERSION_LABEL = 'CALCULATOR_LABEL';

  trackGoogleAdsConversion(
    CALCULATOR_CONVERSION_ID,
    CALCULATOR_CONVERSION_LABEL
  );

  // Also track as GA4 event
  if (window.gtag) {
    window.gtag('event', 'calculator_usage', {
      event_category: 'Engagement',
      event_label: calculatorType,
      custom_parameter_1: productType || 'unknown'
    });
  }
};
