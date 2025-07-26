/**
 * Date utility functions to handle timezone issues with DATE-only fields from database
 * 
 * Problem: When storing dates as DATE type in database (e.g., "2025-07-25"), 
 * JavaScript's new Date("2025-07-25") interprets this as UTC midnight,
 * which converts to the previous day in timezones behind UTC.
 * 
 * Solution: Parse DATE-only strings as local dates instead of UTC.
 */

/**
 * Parse a DATE-only string (YYYY-MM-DD) as a local date without timezone conversion
 * Use this for database DATE fields like: expense_date, delivery_date, fulfillment_eta
 */
export const parseLocalDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  // Handle empty strings
  if (typeof dateString === 'string' && dateString.trim() === '') return null;
  
  // If it's already a full datetime string (contains 'T' or space), parse normally
  if (typeof dateString === 'string' && (dateString.includes('T') || dateString.includes(' '))) {
    return new Date(dateString);
  }
  
  // For DATE-only strings (YYYY-MM-DD), parse as local date
  // Method 1: Add local timezone offset to treat as local
  const date = new Date(dateString + 'T00:00:00');
  return date;
};

/**
 * Parse a TIMESTAMP string (with time) - use for created_at, updated_at, etc.
 * These should preserve timezone information
 */
export const parseDateTime = (dateTimeString: string | null | undefined): Date | null => {
  if (!dateTimeString) return null;
  return new Date(dateTimeString);
};

/**
 * Format a DATE-only field for display using date-fns format
 * Handles the timezone parsing automatically
 */
export const formatLocalDate = (dateString: string | null | undefined, formatStr: string = 'MMM d, yyyy'): string => {
  const date = parseLocalDate(dateString);
  if (!date) return 'Not set';
  
  // Import format from date-fns dynamically to avoid circular imports
  const { format } = require('date-fns');
  return format(date, formatStr);
};

/**
 * Format a TIMESTAMP field for display using date-fns format
 */
export const formatDateTime = (dateTimeString: string | null | undefined, formatStr: string = 'MMM d, yyyy h:mm a'): string => {
  const date = parseDateTime(dateTimeString);
  if (!date) return 'Not set';
  
  // Import format from date-fns dynamically to avoid circular imports
  const { format } = require('date-fns');
  return format(date, formatStr);
};

/**
 * Convert a local Date object to YYYY-MM-DD string for database storage
 * Use this when saving DATE fields to ensure they save as the correct date
 */
export const formatDateForDatabase = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  
  // Get local date components to avoid timezone conversion
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Check if a date string is a DATE-only format (YYYY-MM-DD)
 */
export const isDateOnly = (dateString: string): boolean => {
  if (!dateString) return false;
  // Match YYYY-MM-DD format exactly
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString.trim());
};

/**
 * Get today's date as a YYYY-MM-DD string
 */
export const getTodayDateString = (): string => {
  return formatDateForDatabase(new Date()) || '';
};