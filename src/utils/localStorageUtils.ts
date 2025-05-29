
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
