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

/** Generates an orderId like MGG-123456789 (MGG-, then 9 digits UTC timestamp + random last digit) */
export const generateOrderId = (): string => {
  const timestamp = Date.now().toString().slice(-9); // last 9 digits of ms ts
  const randDigit = Math.floor(Math.random() * 10); // random 0-9 digit for more uniqueness
  return `MGG-${timestamp}${randDigit}`;
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
