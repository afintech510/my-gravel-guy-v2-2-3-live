
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
