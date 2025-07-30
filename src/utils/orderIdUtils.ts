/**
 * Utility functions for handling order ID operations
 */

/**
 * Extract base order ID from a potentially suffixed order ID
 * For timestamp-based IDs like CART-1753829165052 or QUOTE-20250730-1753905424, the whole ID is the base
 * For traditional suffixed IDs like CART-123-1, CART-123-2, extract base by removing numeric suffix
 */
export function extractBaseOrderId(orderId: string): string {
  const parts = orderId.split('-');
  
  // If this looks like a timestamp-based order ID (prefix + timestamp), return as-is
  if (parts.length === 2 && parts[1].length >= 10 && !isNaN(parseInt(parts[1]))) {
    return orderId;
  }
  
  // For date-timestamp format like QUOTE-20250730-1753905424, return as-is
  if (parts.length === 3 && parts[1].length === 8 && parts[2].length >= 10 && 
      !isNaN(parseInt(parts[1])) && !isNaN(parseInt(parts[2]))) {
    return orderId;
  }
  
  // For traditional suffixed IDs like CART-123-1, CART-123-2, extract base
  if (parts.length > 2) {
    const lastPart = parts[parts.length - 1];
    // If last part is a short number (likely a suffix), remove it
    if (!isNaN(parseInt(lastPart)) && lastPart.length <= 3) {
      return parts.slice(0, -1).join('-');
    }
  }
  
  return orderId;
}

/**
 * Check if an order ID has a numeric suffix indicating it's a related record
 */
export function hasOrderSuffix(orderId: string): boolean {
  const parts = orderId.split('-');
  if (parts.length <= 2) return false;
  
  const lastPart = parts[parts.length - 1];
  return !isNaN(parseInt(lastPart)) && lastPart.length <= 3;
}

/**
 * Generate SQL pattern for finding all related order records
 */
export function getOrderPatternQuery(baseOrderId: string): string {
  return `order_id.eq.${baseOrderId},order_id.like.${baseOrderId}-%`;
}