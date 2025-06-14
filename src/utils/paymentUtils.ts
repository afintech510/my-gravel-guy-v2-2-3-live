
interface CheckoutBackup {
  orderId: string;
  items: any[];
  total: number;
  timestamp: number;
  cartItems: any[];
  customerInfo?: {
    email?: string;
    name?: string;
  };
}

// Enhanced interface for order data with all required fields that match orders table schema
export interface OrderItemData {
  id: string | number;
  name: string;
  category?: string;
  materialCategory?: string;
  price: number;
  quantity: number;
  tons?: number;
  yards?: number;
  size?: string;
  materialSize?: string;
  image?: string;
  metadata?: {
    deliveryDate?: string;
    deliveryAddress?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    deliveryTimePreference?: string;
    deliveryInstructions?: string;
  };
}

// New interface for processing state management
export interface ProcessingState {
  orderId: string;
  stage: 'payment_detected' | 'verification_started' | 'db_insert_started' | 'db_insert_completed' | 'email_started' | 'email_completed' | 'processing_complete';
  timestamp: number;
  error?: string;
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

// New processing state management functions
export const setProcessingState = (state: ProcessingState) => {
  try {
    localStorage.setItem('processing-state', JSON.stringify(state));
    console.log('Processing state updated:', state.stage);
  } catch (error) {
    console.error('Failed to set processing state:', error);
  }
};

export const getProcessingState = (): ProcessingState | null => {
  try {
    const state = localStorage.getItem('processing-state');
    return state ? JSON.parse(state) : null;
  } catch (error) {
    console.error('Failed to get processing state:', error);
    return null;
  }
};

export const clearProcessingState = () => {
  try {
    localStorage.removeItem('processing-state');
    console.log('Processing state cleared');
  } catch (error) {
    console.error('Failed to clear processing state:', error);
  }
};

export const isProcessingComplete = (orderId: string): boolean => {
  const state = getProcessingState();
  return state?.orderId === orderId && state?.stage === 'processing_complete';
};

export const isProcessingInProgress = (orderId: string): boolean => {
  const state = getProcessingState();
  return state?.orderId === orderId && state?.stage !== 'processing_complete';
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
  paymentIntentId?: string;
  orderId?: string; 
  success?: boolean; 
  checkStatus?: boolean 
} => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    paymentIntentId: urlParams.get('payment_intent') || urlParams.get('payment_intent_id') || undefined,
    orderId: urlParams.get('order_id') || undefined,
    success: urlParams.get('success') === 'true',
    checkStatus: urlParams.get('check_status') === 'true'
  };
};

// Enhanced helper function to prepare cart items for Stripe with comprehensive backup data
export const prepareItemsForStripe = (cartItems: any[]): OrderItemData[] => {
  return cartItems.map(item => {
    // Build comprehensive metadata object
    const metadata: any = {};
    
    if (item.deliveryDate) {
      metadata.deliveryDate = item.deliveryDate instanceof Date ? 
        item.deliveryDate.toISOString() : item.deliveryDate;
    }
    
    if (item.deliveryAddress) {
      metadata.deliveryAddress = typeof item.deliveryAddress === 'string' ? 
        item.deliveryAddress : JSON.stringify(item.deliveryAddress);
    }
    
    if (item.contactInfo) {
      metadata.contactName = item.contactInfo.name;
      metadata.contactPhone = item.contactInfo.phone;
      metadata.contactEmail = item.contactInfo.email;
    }
    
    if (item.deliveryTimePreference) {
      metadata.deliveryTimePreference = item.deliveryTimePreference;
    }
    
    if (item.deliveryInstructions) {
      metadata.deliveryInstructions = item.deliveryInstructions;
    }

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      materialCategory: item.materialCategory || item.category,
      price: item.price,
      quantity: item.tons || item.quantity,
      tons: item.tons,
      yards: item.yards,
      size: item.size,
      materialSize: item.materialSize || item.size,
      image: item.image || item.images?.[0],
      metadata
    };
  });
};

// Enhanced function to create comprehensive backup data
export const createEnhancedBackup = (orderId: string, cartItems: any[], customerInfo?: any): CheckoutBackup => {
  const preparedItems = prepareItemsForStripe(cartItems);
  const total = preparedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  return {
    orderId,
    items: preparedItems,
    total,
    timestamp: Date.now(),
    cartItems,
    customerInfo: customerInfo || {
      email: 'guest@mygravelguy.com',
      name: 'Guest User'
    }
  };
};

// Enhanced session cleanup that preserves order history
export const completeOrderProcessing = (orderId: string) => {
  try {
    // Mark processing as complete
    setProcessingState({
      orderId,
      stage: 'processing_complete',
      timestamp: Date.now()
    });

    // Store order completion in history for reference
    const completedOrders = JSON.parse(localStorage.getItem('completed-orders') || '[]');
    completedOrders.push({
      orderId,
      completedAt: Date.now()
    });
    localStorage.setItem('completed-orders', JSON.stringify(completedOrders));

    // Clear checkout session data
    clearCheckoutBackup();

    console.log('Order processing completed and session data cleared:', orderId);
  } catch (error) {
    console.error('Failed to complete order processing:', error);
  }
};

// Function to check if order was already completed
export const wasOrderCompleted = (orderId: string): boolean => {
  try {
    const completedOrders = JSON.parse(localStorage.getItem('completed-orders') || '[]');
    return completedOrders.some((order: any) => order.orderId === orderId);
  } catch (error) {
    console.error('Failed to check completed orders:', error);
    return false;
  }
};
