
import { ZipCodeData } from '../services/productTypes';

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
