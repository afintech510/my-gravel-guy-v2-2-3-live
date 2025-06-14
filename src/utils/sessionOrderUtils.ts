
/**
 * Utilities for preventing duplicate order processing and email sending via sessionStorage.
 * The key is always based on orderID or sessionID to isolate per session/order.
 */

export const getOrderProcessFlag = (orderId: string) => {
  if (!orderId) return false;
  return sessionStorage.getItem(`order-processed-${orderId}`) === "true";
};

export const setOrderProcessFlag = (orderId: string) => {
  if (!orderId) return;
  sessionStorage.setItem(`order-processed-${orderId}`, "true");
};

export const clearOrderProcessFlag = (orderId: string) => {
  if (!orderId) return;
  sessionStorage.removeItem(`order-processed-${orderId}`);
};

export const getEmailSentFlag = (orderId: string) => {
  if (!orderId) return false;
  return sessionStorage.getItem(`email-sent-${orderId}`) === "true";
};

export const setEmailSentFlag = (orderId: string) => {
  if (!orderId) return;
  sessionStorage.setItem(`email-sent-${orderId}`, "true");
};

export const clearEmailSentFlag = (orderId: string) => {
  if (!orderId) return;
  sessionStorage.removeItem(`email-sent-${orderId}`);
};

/**
 * Short-term lock to prevent parallel reloads or race conditions.
 * Expires after 8 seconds by default.
 */
export const acquireOrderProcessingLock = (orderId: string, ttlMs: number = 8000) => {
  if (!orderId) return false;
  const key = `processing-lock-${orderId}`;
  const now = Date.now();
  const lockExpiry = sessionStorage.getItem(key);
  if (lockExpiry && now < Number(lockExpiry)) {
    // Lock is still valid
    return false;
  }
  // Set lock
  sessionStorage.setItem(key, String(now + ttlMs));
  return true;
};

export const clearOrderProcessingLock = (orderId: string) => {
  if (!orderId) return;
  sessionStorage.removeItem(`processing-lock-${orderId}`);
};
