
// Google Analytics Utility

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
 * Track a page view
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
 * Track ecommerce events
 * @param actionType - The ecommerce action (view_item, add_to_cart, etc.)
 * @param items - The items involved
 * @param value - The monetary value (if applicable)
 */
export const trackEcommerce = (
  actionType: string, 
  items: any[], 
  value?: number
) => {
  if (!window.gtag) {
    console.warn('Google Analytics not loaded');
    return;
  }

  window.gtag('event', actionType, {
    currency: 'USD',
    value: value,
    items: items
  });
};

// ============================================
// Market Landing Page Analytics
// ============================================

// Re-export OrderModuleState type for analytics functions
export interface OrderModuleStateForAnalytics {
  tons: number;
  zipCode: string | null;
  email: string | null;
  phone: string | null;
}

interface UTMData {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landing_page_url?: string;
  referrer?: string;
  user_agent?: string;
  captured_at: string;
}

// Use sessionStorage for add_to_cart deduplication (persists across refresh)
const getAddToCartFiredKeys = (): Set<string> => {
  try {
    const stored = sessionStorage.getItem('mgg_atc_fired_keys');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const markAddToCartFired = (key: string): void => {
  try {
    const keys = getAddToCartFiredKeys();
    keys.add(key);
    sessionStorage.setItem('mgg_atc_fired_keys', JSON.stringify([...keys]));
  } catch {
    console.warn('Failed to store add_to_cart key in sessionStorage');
  }
};

/**
 * Capture and store all UTM parameters for attribution
 */
export const captureAndStoreUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  const utmData: UTMData = {
    gclid: params.get('gclid') || undefined,
    gbraid: params.get('gbraid') || undefined,
    wbraid: params.get('wbraid') || undefined,
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_term: params.get('utm_term') || undefined,
    utm_content: params.get('utm_content') || undefined,
    landing_page_url: window.location.href,
    referrer: document.referrer || undefined,
    user_agent: navigator.userAgent || undefined,
    captured_at: new Date().toISOString()
  };

  const hasParams = Object.values(utmData).some(v => v && v !== utmData.captured_at);
  if (hasParams) {
    localStorage.setItem('mgg_utm_params', JSON.stringify(utmData));
  }
};

export const getStoredUTMParams = (): Partial<UTMData> => {
  try {
    const stored = localStorage.getItem('mgg_utm_params');
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

/**
 * Detect traffic type from stored attribution data
 */
export const getTrafficType = (): 'paid' | 'organic' | 'direct' => {
  const params = getStoredUTMParams();

  // Any click ID = paid traffic
  if (params.gclid || params.gbraid || params.wbraid) {
    return 'paid';
  }

  // UTM source with medium containing paid indicators
  if (params.utm_source && params.utm_medium) {
    const paidMediums = ['cpc', 'ppc', 'paid', 'paidsearch', 'paidsocial'];
    if (paidMediums.includes(params.utm_medium.toLowerCase())) {
      return 'paid';
    }
  }

  // Has referrer = organic
  if (params.referrer) {
    return 'organic';
  }

  return 'direct';
};

/**
 * Check if add_to_cart should fire based on precise conditions
 */
export const shouldFireAddToCart = (state: OrderModuleStateForAnalytics, materialSlug: string): boolean => {
  const sessionKey = `${materialSlug}-${state.tons}`;

  // Already fired for this material + quantity combination
  if (getAddToCartFiredKeys().has(sessionKey)) {
    return false;
  }

  // PRECISE CONDITIONS (all must be true):
  const validQuantity = state.tons >= 20 && state.tons <= 500;
  const hasZip = !!state.zipCode && state.zipCode.length >= 5;
  const hasContact = !!state.email || !!state.phone;

  return validQuantity && hasZip && hasContact;
};

/**
 * Track add_to_cart event for market landing pages
 */
export const trackAddToCart = (
  canonicalSlug: string,
  materialSlug: string,
  materialName: string,
  tons: number,
  value?: number
) => {
  if (!window.gtag) return;

  const sessionKey = `${materialSlug}-${tons}`;

  // Check sessionStorage to prevent duplicates
  if (getAddToCartFiredKeys().has(sessionKey)) {
    console.log('add_to_cart already fired for:', sessionKey);
    return;
  }

  // Mark as fired in sessionStorage
  markAddToCartFired(sessionKey);

  const eventParams: Record<string, unknown> = {
    currency: 'USD',
    items: [{
      item_id: materialSlug,
      item_name: materialName,
      item_category: 'aggregate',
      quantity: tons
    }],
    market_slug: canonicalSlug,
    material_slug: materialSlug
  };

  // Only include value if it's a real computed price
  if (value && value > 0) {
    eventParams.value = value;
    (eventParams.items as { price?: number }[])[0].price = value / tons;
  }

  window.gtag('event', 'add_to_cart', eventParams);
  console.log('add_to_cart fired:', sessionKey);
};

/**
 * Track market landing page view
 */
export const trackMarketLandingView = (
  canonicalSlug: string,
  materialSlug: string,
  materialName: string,
  marketName: string
) => {
  if (!window.gtag) return;

  const utmParams = getStoredUTMParams();

  window.gtag('event', 'view_item', {
    currency: 'USD',
    items: [{
      item_id: materialSlug,
      item_name: materialName,
      item_category: 'aggregate',
      affiliation: marketName
    }],
    market_slug: canonicalSlug,
    material_slug: materialSlug,
    page_type: 'market_material',
    gclid_present: !!(utmParams.gclid || utmParams.gbraid || utmParams.wbraid),
    traffic_type: getTrafficType(),
    ...utmParams
  });
};

/**
 * Track begin_checkout for market landing pages
 */
export const trackMarketBeginCheckout = (
  canonicalSlug: string,
  materialSlug: string,
  materialName: string,
  tons: number,
  value: number,
  expediteEnabled: boolean,
  saturdayEnabled: boolean
) => {
  if (!window.gtag) return;

  const utmParams = getStoredUTMParams();

  window.gtag('event', 'begin_checkout', {
    currency: 'USD',
    value: value,
    items: [{
      item_id: materialSlug,
      item_name: materialName,
      item_category: 'aggregate',
      quantity: tons,
      price: value / tons
    }],
    market_slug: canonicalSlug,
    material_slug: materialSlug,
    expedite_enabled: expediteEnabled,
    saturday_enabled: saturdayEnabled,
    ...utmParams
  });
};

/**
 * Track quote submission for managed quotes
 */
export const trackMarketQuoteSubmit = (
  canonicalSlug: string,
  materialSlug: string,
  hasSpecReference: boolean
) => {
  if (!window.gtag) return;

  const utmParams = getStoredUTMParams();

  window.gtag('event', 'generate_lead', {
    market_slug: canonicalSlug,
    material_slug: materialSlug,
    has_spec_reference: hasSpecReference,
    lead_type: 'managed_quote',
    ...utmParams
  });
};

/**
 * Track purchase event with deduplication
 */
export const trackMarketPurchase = (
  transactionId: string,
  value: number,
  canonicalSlug: string,
  materialSlug: string,
  materialName: string,
  tons: number
) => {
  if (!window.gtag) return;

  // Deduplication: Check if we've already fired for this transaction
  const firedKey = `mgg_purchase_fired_${transactionId}`;
  if (localStorage.getItem(firedKey)) {
    console.log('Purchase event already fired for:', transactionId);
    return;
  }

  const utmParams = getStoredUTMParams();

  window.gtag('event', 'purchase', {
    transaction_id: transactionId,
    value: value,
    currency: 'USD',
    items: [{
      item_id: materialSlug,
      item_name: materialName,
      item_category: 'aggregate',
      quantity: tons,
      price: value / tons
    }],
    market_slug: canonicalSlug,
    material_slug: materialSlug,
    ...utmParams
  });

  // Mark as fired
  localStorage.setItem(firedKey, 'true');
};
