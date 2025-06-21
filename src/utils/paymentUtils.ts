
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
  // Enhanced delivery information properties
  deliveryDate?: string | Date;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  contactInfo?: {
    name: string;
    email: string;
    phone: string;
  };
  deliveryTimePreference?: string;
  deliveryInstructions?: string;
  locationPhotoUrl?: string;
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
    console.log('Enhanced checkout backup stored:', data.orderId);
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

// Enhanced helper function to extract customer information from cart items
export const extractCustomerInfo = (cartItems: any[]): { email?: string; name?: string } => {
  console.log('=== EXTRACTING CUSTOMER INFO ===');
  console.log('Cart items count:', cartItems.length);
  
  for (const item of cartItems) {
    console.log('Checking item for customer info:', {
      id: item.id,
      name: item.name,
      hasContactInfo: !!item.contactInfo,
      contactInfo: item.contactInfo
    });
    
    if (item.contactInfo?.email) {
      console.log('Found customer info:', {
        email: item.contactInfo.email,
        name: item.contactInfo.name
      });
      return {
        email: item.contactInfo.email,
        name: item.contactInfo.name || 'Customer'
      };
    }
  }
  
  console.log('No customer info found in cart items');
  return {};
};

// Enhanced helper function to prepare cart items for Stripe with comprehensive backup data
export const prepareItemsForStripe = (cartItems: any[]): OrderItemData[] => {
  console.log('=== PREPARING ITEMS FOR STRIPE ===');
  console.log('Input cart items:', cartItems.length);
  
  return cartItems.map((item, index) => {
    console.log(`Processing item ${index + 1}:`, {
      id: item.id,
      name: item.name,
      hasDeliveryDate: !!item.deliveryDate,
      hasDeliveryAddress: !!item.deliveryAddress,
      hasContactInfo: !!item.contactInfo
    });
    
    // Build comprehensive metadata object for backwards compatibility
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

    const processedItem: OrderItemData = {
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
      // Enhanced: Include delivery information directly on the item
      deliveryDate: item.deliveryDate,
      deliveryAddress: item.deliveryAddress,
      contactInfo: item.contactInfo,
      deliveryTimePreference: item.deliveryTimePreference,
      deliveryInstructions: item.deliveryInstructions,
      locationPhotoUrl: item.locationPhotoUrl,
      metadata
    };
    
    console.log(`Processed item ${index + 1}:`, {
      id: processedItem.id,
      hasDirectDeliveryInfo: !!processedItem.deliveryDate,
      hasDirectContactInfo: !!processedItem.contactInfo,
      hasMetadata: Object.keys(processedItem.metadata || {}).length > 0
    });
    
    return processedItem;
  });
};

// Enhanced function to create comprehensive backup data
export const createEnhancedBackup = (orderId: string, cartItems: any[], customerInfo?: any): CheckoutBackup => {
  console.log('=== CREATING ENHANCED BACKUP ===');
  console.log('Order ID:', orderId);
  console.log('Cart items count:', cartItems.length);
  console.log('Provided customer info:', customerInfo);
  
  const preparedItems = prepareItemsForStripe(cartItems);
  const total = preparedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Extract customer info from cart items if not provided
  const extractedCustomerInfo = customerInfo || extractCustomerInfo(cartItems);
  
  console.log('Final customer info for backup:', extractedCustomerInfo);
  
  const backup = {
    orderId,
    items: preparedItems,
    total,
    timestamp: Date.now(),
    cartItems, // Keep original cart items for reference
    customerInfo: extractedCustomerInfo.email ? extractedCustomerInfo : {
      email: 'guest@mygravelguy.com',
      name: 'Guest User'
    }
  };
  
  console.log('Enhanced backup created:', {
    orderId: backup.orderId,
    itemsCount: backup.items.length,
    hasCustomerEmail: !!backup.customerInfo?.email,
    customerEmail: backup.customerInfo?.email
  });
  
  return backup;
};
