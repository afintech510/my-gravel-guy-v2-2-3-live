
import { ZipCodeData } from '../services/productTypes';
import { CartItem } from '../contexts/CartContext';

/**
 * Get ZIP code from localStorage
 */
export const getStoredZipCode = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('userZipCode');
};

/**
 * Get ZIP code data from localStorage
 */
export const getStoredZipCodeData = (): ZipCodeData | null => {
  if (typeof window === 'undefined') return null;
  
  const zipCodeDataStr = localStorage.getItem('userZipCodeData');
  if (!zipCodeDataStr) return null;
  
  try {
    return JSON.parse(zipCodeDataStr);
  } catch (e) {
    console.error("Error parsing ZIP code data from localStorage:", e);
    return null;
  }
};

/**
 * Store ZIP code in localStorage
 */
export const storeZipCode = (zipCode: string | null): void => {
  if (typeof window === 'undefined') return;
  
  if (zipCode) {
    localStorage.setItem('userZipCode', zipCode);
  } else {
    localStorage.removeItem('userZipCode');
  }
};

/**
 * Store ZIP code data in localStorage
 */
export const storeZipCodeData = (data: ZipCodeData | null): void => {
  if (typeof window === 'undefined') return;
  
  if (data) {
    localStorage.setItem('userZipCodeData', JSON.stringify(data));
  } else {
    localStorage.removeItem('userZipCodeData');
  }
};

/**
 * Get cart items from localStorage
 */
export const getStoredCartItems = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  
  const cartItemsStr = localStorage.getItem('cart-items');
  if (!cartItemsStr) return [];
  
  try {
    const items = JSON.parse(cartItemsStr);
    // Deserialize dates
    return items.map((item: CartItem) => ({
      ...item,
      deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : undefined
    }));
  } catch (e) {
    console.error("Error parsing cart items from localStorage:", e);
    return [];
  }
};

/**
 * Store cart items in localStorage
 */
export const storeCartItems = (items: CartItem[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('cart-items', JSON.stringify(items));
  } catch (e) {
    console.error("Error storing cart items to localStorage:", e);
  }
};

/**
 * Clear cart from localStorage
 */
export const clearStoredCart = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('cart-items');
  localStorage.removeItem('last-removed-item');
};

/**
 * Clear all checkout-related data from localStorage
 */
export const clearCheckoutData = (): void => {
  if (typeof window === 'undefined') return;
  
  // Clear cart data
  clearStoredCart();
  
  // Clear checkout backup data
  localStorage.removeItem('checkout-order-backup');
  localStorage.removeItem('checkout-in-progress');
  localStorage.removeItem('checkout-order-id');
  localStorage.removeItem('stripe-checkout-url');
  
  console.log('All checkout data cleared from localStorage');
};

/**
 * Mark an order as processed to prevent duplicate processing
 */
export const markOrderAsProcessed = (orderId: string): void => {
  if (typeof window === 'undefined') return;
  
  const processedOrders = getProcessedOrders();
  processedOrders.add(orderId);
  
  localStorage.setItem('processed-orders', JSON.stringify(Array.from(processedOrders)));
};

/**
 * Check if an order has already been processed
 */
export const isOrderProcessed = (orderId: string): boolean => {
  if (typeof window === 'undefined') return false;
  
  const processedOrders = getProcessedOrders();
  return processedOrders.has(orderId);
};

/**
 * Get set of processed order IDs
 */
export const getProcessedOrders = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  
  try {
    const processedOrdersStr = localStorage.getItem('processed-orders');
    if (!processedOrdersStr) return new Set();
    
    const processedOrdersArray = JSON.parse(processedOrdersStr);
    return new Set(processedOrdersArray);
  } catch (e) {
    console.error("Error parsing processed orders from localStorage:", e);
    return new Set();
  }
};
