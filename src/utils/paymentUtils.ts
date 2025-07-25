
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
  couponInfo?: {
    code: string;
    discount: number;
    applied: boolean;
  } | null;
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
  short_description?: string;
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
    localStorage.removeItem('applied-coupon-code'); // Clear stored coupon code
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
      short_description: item.short_description,
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

// Enhanced function to extract coupon information from cart items
export const extractCouponInfo = (cartItems: any[]): { hasCoupon: boolean; couponCode?: string; totalDiscount: number } => {
  console.log('=== EXTRACTING COUPON INFO ===');
  console.log('Cart items count:', cartItems.length);
  
  let totalDiscount = 0;
  let couponCode: string | undefined;
  let hasCoupon = false;
  
  for (const item of cartItems) {
    if (item.couponApplied && item.couponAmount && item.couponAmount > 0) {
      totalDiscount += item.couponAmount;
      hasCoupon = true;
      // Try to extract coupon code from the cart context or localStorage
      // For now, we'll look for common coupon patterns or use a default
      if (!couponCode) {
        // Check if there's a stored coupon code
        try {
          const storedCoupon = localStorage.getItem('applied-coupon-code');
          couponCode = storedCoupon || 'DISCOUNT_APPLIED';
        } catch {
          couponCode = 'DISCOUNT_APPLIED';
        }
      }
    }
  }
  
  console.log('Coupon info extracted:', { hasCoupon, couponCode, totalDiscount });
  return { hasCoupon, couponCode, totalDiscount };
};

// Helper function to format manual order items for Stripe
export const formatOrderItemsForStripe = (orderItems: any[], customerInfo: any, deliveryInfo: any): any[] => {
  return orderItems.map(item => ({
    id: item.id,
    name: item.productName,
    price: item.unitPrice,
    quantity: item.quantity,
    tons: item.quantity,
    unit: item.unit,
    contactInfo: {
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone
    },
    deliveryAddress: {
      street: deliveryInfo.street,
      city: deliveryInfo.city,
      state: deliveryInfo.state,
      zip: deliveryInfo.zip
    },
    deliveryDate: deliveryInfo.date,
    deliveryTimePreference: deliveryInfo.timePreference,
    deliveryInstructions: deliveryInfo.instructions
  }));
};

// Enhanced function for manual orders to match create-payment edge function expectations
export const formatManualOrderForStripe = async (orderItems: any[], customerInfo: any, deliveryInfo: any): Promise<any[]> => {
  // Import product service for product lookups
  const { getProductById } = await import('@/services/products/productQueries');
  
  const formattedItems = await Promise.all(orderItems.map(async (item) => {
    // Try to get product details for image and description
    let productImage = '';
    let productDescription = '';
    
    try {
      if (item.productId) {
        const product = await getProductById(item.productId);
        if (product) {
          productImage = product.images?.[0] || '';
          productDescription = product.short_description || product.description || '';
        }
      }
    } catch (error) {
      console.warn('Failed to fetch product details for:', item.productId, error);
    }
    
    return {
      name: item.productName,
      price: item.unitPrice,
      quantity: item.quantity,
      description: productDescription,
      image: productImage,
      metadata: {
        contactEmail: customerInfo.email,
        contactName: customerInfo.name,
        contactPhone: customerInfo.phone,
        deliveryAddress: JSON.stringify({
          street: deliveryInfo.street,
          city: deliveryInfo.city,
          state: deliveryInfo.state,
          zip: deliveryInfo.zip
        }),
        deliveryDate: deliveryInfo.date,
        deliveryTimePreference: deliveryInfo.timePreference,
        deliveryInstructions: deliveryInfo.instructions,
        productId: item.productId || item.id,
        unit: item.unit
      }
    };
  }));
  
  return formattedItems;
};

// Enhanced function to create comprehensive backup data
export const createEnhancedBackup = (orderId: string, cartItems: any[], customerInfo?: any): CheckoutBackup => {
  console.log('=== CREATING ENHANCED BACKUP ===');
  console.log('Order ID:', orderId);
  console.log('Cart items count:', cartItems.length);
  console.log('Provided customer info:', customerInfo);
  
  const preparedItems = prepareItemsForStripe(cartItems);
  const baseTotal = preparedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Extract coupon information
  const couponInfo = extractCouponInfo(cartItems);
  const finalTotal = baseTotal - couponInfo.totalDiscount;
  
  // Extract customer info from cart items if not provided
  const extractedCustomerInfo = customerInfo || extractCustomerInfo(cartItems);
  
  console.log('Final customer info for backup:', extractedCustomerInfo);
  console.log('Pricing info:', { baseTotal, couponDiscount: couponInfo.totalDiscount, finalTotal });
  
  const backup = {
    orderId,
    items: preparedItems,
    total: finalTotal, // Use the discounted total
    timestamp: Date.now(),
    cartItems, // Keep original cart items for reference
    customerInfo: extractedCustomerInfo.email ? extractedCustomerInfo : {
      email: 'guest@mygravelguy.com',
      name: 'Guest User'
    },
    // Add coupon information to backup
    couponInfo: couponInfo.hasCoupon ? {
      code: couponInfo.couponCode,
      discount: couponInfo.totalDiscount,
      applied: true
    } : null
  };
  
  console.log('Enhanced backup created:', {
    orderId: backup.orderId,
    itemsCount: backup.items.length,
    hasCustomerEmail: !!backup.customerInfo?.email,
    customerEmail: backup.customerInfo?.email,
    hasCoupon: !!backup.couponInfo,
    finalTotal: backup.total
  });
  
  return backup;
};
