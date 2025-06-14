
// Utility functions for managing payment processing state to prevent duplicates

export const PROCESSING_COMPLETE_KEY = 'payment-processing-complete';
export const ORDER_DISPLAY_DATA_KEY = 'order-display-data';

export interface OrderDisplayData {
  orderId: string;
  orderItems: any[];
  verificationMethod: string;
  usedFallback: boolean;
  emailsSent: boolean;
  emailStatus: { customer: boolean; business: boolean } | null;
  timestamp: number;
}

export const isProcessingComplete = (orderId?: string): boolean => {
  if (!orderId) return false;
  
  const completedOrderId = localStorage.getItem(PROCESSING_COMPLETE_KEY);
  return completedOrderId === orderId;
};

export const markProcessingComplete = (orderId: string): void => {
  localStorage.setItem(PROCESSING_COMPLETE_KEY, orderId);
  console.log('Marked processing complete for order:', orderId);
};

export const clearProcessingState = (): void => {
  localStorage.removeItem(PROCESSING_COMPLETE_KEY);
  localStorage.removeItem(ORDER_DISPLAY_DATA_KEY);
  console.log('Cleared processing state');
};

export const storeOrderDisplayData = (data: OrderDisplayData): void => {
  try {
    localStorage.setItem(ORDER_DISPLAY_DATA_KEY, JSON.stringify(data));
    console.log('Stored order display data for:', data.orderId);
  } catch (error) {
    console.error('Failed to store order display data:', error);
  }
};

export const getOrderDisplayData = (): OrderDisplayData | null => {
  try {
    const data = localStorage.getItem(ORDER_DISPLAY_DATA_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to retrieve order display data:', error);
    return null;
  }
};

export const clearOrderDisplayData = (): void => {
  localStorage.removeItem(ORDER_DISPLAY_DATA_KEY);
};
