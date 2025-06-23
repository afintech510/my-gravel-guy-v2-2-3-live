
// Google Analytics Utility with Google Ads Integration

import {
  trackPurchaseConversion,
  trackLeadConversion,
  trackAddToCartConversion,
  trackBeginCheckoutConversion,
  trackCalculatorConversion,
  trackPageViewConversion
} from './googleAdsTracking';

// Define window with gtag
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
 * Track a page view with Google Ads conversion
 * @param path - The current page path
 * @param title - The page title
 */
export const trackPageView = (path: string, title?: string) => {
  if (!window.gtag) {
    console.warn('Google Analytics not loaded');
    return;
  }

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href
  });

  // Track Google Ads page view conversion for key pages
  const keyPages = ['/shop', '/calculator', '/products'];
  if (keyPages.some(page => path.includes(page))) {
    trackPageViewConversion(path);
  }
};

/**
 * Track a custom event
 * @param action - The event action
 * @param category - The event category
 * @param label - The event label
 * @param value - Optional numeric value
 */
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (!window.gtag) {
    console.warn('Google Analytics not loaded');
    return;
  }

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value
  });
};

/**
 * Track ecommerce events with Google Ads conversion tracking
 * @param actionType - The ecommerce action (view_item, add_to_cart, etc.)
 * @param items - The items involved
 * @param value - The monetary value (if applicable)
 * @param orderId - Optional order ID for purchase events
 */
export const trackEcommerce = (
  actionType: string, 
  items: any[], 
  value?: number,
  orderId?: string
) => {
  if (!window.gtag) {
    console.warn('Google Analytics not loaded');
    return;
  }

  const eventParams: any = {
    currency: 'USD',
    value: value,
    items: items
  };

  if (orderId) {
    eventParams.transaction_id = orderId;
  }

  window.gtag('event', actionType, eventParams);

  // Track corresponding Google Ads conversions
  switch (actionType) {
    case 'purchase':
      if (value && orderId) {
        trackPurchaseConversion(orderId, value, 'USD', items);
      }
      break;
    case 'add_to_cart':
      if (value && items.length > 0) {
        trackAddToCartConversion(items[0], value);
      }
      break;
    case 'begin_checkout':
      if (value) {
        trackBeginCheckoutConversion(value, items);
      }
      break;
    case 'view_item':
      // Track product view conversion
      if (items.length > 0) {
        trackEvent('product_view', 'Engagement', items[0].item_name || items[0].name);
      }
      break;
  }
};

/**
 * Track quote form submission with lead conversion
 * @param formType - Type of quote form
 * @param productType - Product being quoted
 * @param estimatedValue - Estimated order value
 */
export const trackQuoteSubmission = (
  formType: string,
  productType?: string,
  estimatedValue?: number
) => {
  // Track GA4 event
  trackEvent('quote_form_submit', 'Lead Generation', formType, estimatedValue);
  
  // Track Google Ads lead conversion
  trackLeadConversion('quote_request', estimatedValue);
  
  console.log('Quote submission tracked:', {
    formType,
    productType,
    estimatedValue
  });
};

/**
 * Track calculator usage with conversion
 * @param calculatorType - Type of calculator
 * @param productType - Product being calculated
 * @param calculatedValue - Calculated material value
 */
export const trackCalculatorUsage = (
  calculatorType: string,
  productType?: string,
  calculatedValue?: number
) => {
  // Track GA4 event
  trackEvent('calculator_used', 'Engagement', calculatorType, calculatedValue);
  
  // Track Google Ads calculator conversion
  trackCalculatorConversion(calculatorType, productType);
  
  console.log('Calculator usage tracked:', {
    calculatorType,
    productType,
    calculatedValue
  });
};

/**
 * Track contact form submission
 * @param formType - Type of contact form
 * @param source - Source page of the submission
 */
export const trackContactSubmission = (
  formType: string,
  source?: string
) => {
  // Track GA4 event
  trackEvent('contact_form_submit', 'Lead Generation', formType);
  
  // Track Google Ads lead conversion
  trackLeadConversion('contact_form');
  
  console.log('Contact submission tracked:', {
    formType,
    source
  });
};

/**
 * Track product interactions
 * @param productName - Name of the product
 * @param action - Action taken (view, calculate, quote)
 * @param value - Optional value
 */
export const trackProductInteraction = (
  productName: string,
  action: 'view' | 'calculate' | 'quote',
  value?: number
) => {
  // Track GA4 event
  trackEvent(`product_${action}`, 'Product Engagement', productName, value);
  
  // Track Google Ads conversions based on action
  if (action === 'calculate') {
    trackCalculatorConversion('product_calculator', productName);
  } else if (action === 'quote') {
    trackLeadConversion('product_quote', value);
  }
  
  console.log('Product interaction tracked:', {
    productName,
    action,
    value
  });
};

/**
 * Track add to cart action
 * @param product - Product being added
 * @param quantity - Quantity added
 * @param price - Price per unit
 */
export const trackAddToCart = (
  product: any,
  quantity: number,
  price: number
) => {
  const value = quantity * price;
  const items = [{
    item_id: product.id,
    item_name: product.name,
    category: 'Landscape Materials',
    quantity: quantity,
    price: price
  }];

  // Track GA4 ecommerce event
  trackEcommerce('add_to_cart', items, value);
  
  console.log('Add to cart tracked:', {
    product: product.name,
    quantity,
    value
  });
};

/**
 * Track checkout initiation
 * @param cartItems - Items in cart
 * @param totalValue - Total cart value
 */
export const trackCheckoutBegin = (
  cartItems: any[],
  totalValue: number
) => {
  // Track GA4 ecommerce event
  trackEcommerce('begin_checkout', cartItems, totalValue);
  
  console.log('Checkout begin tracked:', {
    items: cartItems.length,
    totalValue
  });
};
