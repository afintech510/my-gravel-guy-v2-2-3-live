
interface CheckoutBackup {
  orderId: string;
  items: any[];
  total: number;
  timestamp: number;
  cartItems: any[];
}

export const storeCheckoutBackup = (data: CheckoutBackup) => {
  try {
    localStorage.setItem('checkout-order-backup', JSON.stringify(data));
    localStorage.setItem('checkout-in-progress', 'true');
    localStorage.setItem('checkout-order-id', data.orderId);
    console.log('Checkout backup stored:', data.orderId);
  } catch (error) {
    console.error('Failed to store checkout backup:', error);
  }
};

export const getCheckoutBackup = (): CheckoutBackup | null => {
  try {
    const backup = localStorage.getItem('checkout-order-backup');
    return backup ? JSON.parse(backup) : null;
  } catch (error) {
    console.error('Failed to retrieve checkout backup:', error);
    return null;
  }
};

export const clearCheckoutBackup = () => {
  try {
    localStorage.removeItem('checkout-order-backup');
    localStorage.removeItem('checkout-in-progress');
    localStorage.removeItem('checkout-order-id');
    localStorage.removeItem('stripe-checkout-url');
    console.log('Checkout backup cleared');
  } catch (error) {
    console.error('Failed to clear checkout backup:', error);
  }
};

export const isCheckoutInProgress = (): boolean => {
  return localStorage.getItem('checkout-in-progress') === 'true';
};

export const getStoredOrderId = (): string | null => {
  return localStorage.getItem('checkout-order-id');
};

export const generateOrderId = (): string => {
  return `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const detectPaymentSuccess = (): { 
  sessionId?: string; 
  orderId?: string; 
  success?: boolean; 
  checkStatus?: boolean 
} => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    sessionId: urlParams.get('session_id') || undefined,
    orderId: urlParams.get('order_id') || undefined,
    success: urlParams.get('success') === 'true',
    checkStatus: urlParams.get('check_status') === 'true'
  };
};
