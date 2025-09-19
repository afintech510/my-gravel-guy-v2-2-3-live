import React, { createContext, useContext, useCallback, useEffect } from 'react';
import { Product } from '../services/productTypes';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Undo } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { trackEcommerce } from '../utils/analytics';

export interface DeliveryAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface ContactInfo {
  name: string;
  email: string;
  phone: string;
  zipCode: string;
}

export interface CartItem extends Product {
  tons: number; // Renamed from quantity for clarity
  yards?: number; // Calculated based on tonYardRatio
  deliveryDate?: Date;
  deliveryAddress?: DeliveryAddress;
  contactPhone?: string;
  deliveryTimePreference?: 'anytime' | 'morning' | 'afternoon';
  deliveryInstructions?: string;
  contactInfo?: ContactInfo;
  basePrice?: number; // Original product price before ZIP code adjustments
  
  // Additional material properties that map to orders table
  materialCategory?: string;
  materialSubcategory?: string;
  materialSize?: string;
  applicationType?: string;
  depth?: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product & { 
    tons?: number, 
    yards?: number,
    deliveryDate?: Date,
    contactInfo?: ContactInfo,
    materialCategory?: string,
    materialSubcategory?: string,
    materialSize?: string,
    applicationType?: string,
    depth?: number,
    deliveryAddress?: DeliveryAddress
  }) => void;
  removeFromCart: (productId: string | number) => void;
  updateDeliveryDetails: (
    productId: string | number, 
    details: Partial<Omit<CartItem, keyof Product | 'tons'>>
  ) => void;
  updateQuantity: (productId: string | number, newTons: number) => void;
  updateItemPrice: (productId: string | number, newPrice: number) => void;
  clearCart: () => void;
  total: number;
  discountTotal: number;
  isDeliveryInfoComplete: (item: CartItem) => boolean;
  // Cart-level coupon state
  appliedCoupon: string | null;
  couponDiscount: number;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  // Deposit payment option
  depositOption: boolean;
  toggleDepositOption: () => void;
  isDepositPayment: () => boolean;
  getPaymentTotal: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper function to deserialize dates from localStorage
const deserializeCartItems = (items: CartItem[]): CartItem[] => {
  return items.map(item => ({
    ...item,
    deliveryDate: item.deliveryDate ? new Date(item.deliveryDate) : undefined
  }));
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useLocalStorage<CartItem[]>('cart-items', []);
  const [lastRemovedItem, setLastRemovedItem] = useLocalStorage<CartItem | null>('last-removed-item', null);
  const [appliedCoupon, setAppliedCoupon] = useLocalStorage<string | null>('applied-coupon-code', null);
  const [couponDiscount, setCouponDiscount] = useLocalStorage<number>('coupon-discount', 0);
  const [depositOption, setDepositOption] = useLocalStorage<boolean>('deposit-option', false);
  const { toast } = useToast();

  // Deserialize dates whenever items change from localStorage
  useEffect(() => {
    if (items.length > 0) {
      const needsDeserialization = items.some(item => 
        item.deliveryDate && typeof item.deliveryDate === 'string'
      );
      if (needsDeserialization) {
        const deserializedItems = deserializeCartItems(items);
        setItems(deserializedItems);
      }
    }
  }, [setItems]); // Run when setItems changes (but avoid infinite loops)

  // Modified to add each product as a new cart item (never combine) with analytics tracking
  const addToCart = useCallback((product: Product & { 
    tons?: number, 
    yards?: number,
    deliveryDate?: Date,
    contactInfo?: ContactInfo,
    materialCategory?: string,
    materialSubcategory?: string,
    materialSize?: string,
    applicationType?: string,
    depth?: number,
    deliveryAddress?: DeliveryAddress
  }) => {
    const tons = Math.max(3, product.tons || 3); // Enforce minimum of 3 tons
    // Use the provided yards or calculate yards based on tonYardRatio if available
    const yards = product.yards || (product.tonYardRatio ? tons / product.tonYardRatio : undefined);
    
    // Track the add to cart event
    try {
      console.log('CartContext: Tracking add_to_cart event for:', product.name);
      trackEcommerce('add_to_cart', [{
        item_id: product.id.toString(),
        item_name: product.name,
        item_category: product.category || 'Bulk Materials',
        item_category2: product.materialSubcategory,
        quantity: tons,
        price: product.price
      }], product.price * tons);
    } catch (error) {
      console.error('CartContext: Failed to track add_to_cart event:', error);
    }
    
    setItems(currentItems => [
      ...currentItems,
      {
        ...product,
        tons,
        yards,
        basePrice: product.price, // Store original price for potential adjustments later
        // Map category to materialCategory for orders table compatibility
        materialCategory: product.materialCategory || product.category,
        materialSubcategory: product.materialSubcategory,
        materialSize: product.materialSize || product.size,
        applicationType: product.applicationType,
        depth: product.depth,
        deliveryAddress: product.deliveryAddress
      }
    ]);
  }, [setItems]);

  // New function to restore the last removed item
  const restoreLastRemovedItem = useCallback(() => {
    if (lastRemovedItem) {
      setItems(currentItems => [...currentItems, lastRemovedItem]);
      setLastRemovedItem(null);
    }
  }, [lastRemovedItem, setItems, setLastRemovedItem]);

  // Modified to store the removed item and display toast with undo action
  const removeFromCart = useCallback((productId: string | number) => {
    setItems(currentItems => {
      const itemToRemove = currentItems.find(item => item.id === productId);
      if (itemToRemove) {
        setLastRemovedItem(itemToRemove);
        
        // Show toast with undo button
        const itemDescription = itemToRemove.materialCategory 
          ? `${itemToRemove.tons} tons of ${itemToRemove.materialCategory}`
          : itemToRemove.name;
          
        toast({
          title: "Item Removed",
          description: `${itemDescription} has been removed from your cart.`,
          action: (
            <ToastAction altText="Undo" onClick={restoreLastRemovedItem}>
              <span className="flex items-center">
                <Undo className="mr-1 h-4 w-4" /> Undo
              </span>
            </ToastAction>
          ),
          className: "border-green-500 border-2 shadow-[0_0_15px_rgba(20,255,106,0.5)]"
        });
      }
      return currentItems.filter(item => item.id !== productId);
    });
  }, [toast, restoreLastRemovedItem, setItems, setLastRemovedItem]);

  // New function to update quantity for a specific cart item with 3 ton minimum
  const updateQuantity = useCallback((productId: string | number, newTons: number) => {
    const adjustedTons = Math.max(3, newTons); // Enforce minimum of 3 tons
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === productId
          ? { 
              ...item, 
              tons: adjustedTons,
              yards: item.tonYardRatio ? adjustedTons / item.tonYardRatio : undefined
            }
          : item
      )
    );
  }, [setItems]);

  // Modified updateDeliveryDetails to handle price updates
  const updateDeliveryDetails = useCallback((
    productId: string | number,
    details: Partial<Omit<CartItem, keyof Product | 'tons'>>
  ) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === productId
          ? { ...item, ...details }
          : item
      )
    );
  }, [setItems]);

  // New function to update item price specifically
  const updateItemPrice = useCallback((productId: string | number, newPrice: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === productId
          ? { ...item, price: newPrice }
          : item
      )
    );
  }, [setItems]);

  // Modified to store the removed item and display toast with undo action
  const clearCart = useCallback(() => {
    setItems([]);
    setLastRemovedItem(null);
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setDepositOption(false);
  }, [setItems, setLastRemovedItem, setAppliedCoupon, setCouponDiscount, setDepositOption]);

  // Helper function to check if delivery info is complete for an item
  const isDeliveryInfoComplete = useCallback((item: CartItem) => {
    return !!(
      item.deliveryDate &&
      item.deliveryAddress?.street &&
      item.deliveryAddress?.city &&
      item.deliveryAddress?.state &&
      item.deliveryAddress?.zip &&
      item.contactPhone
    );
  }, []);

  // Cart-level coupon functions
  const applyCoupon = useCallback((code: string, discount: number) => {
    setAppliedCoupon(code);
    setCouponDiscount(discount);
  }, [setAppliedCoupon, setCouponDiscount]);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
  }, [setAppliedCoupon, setCouponDiscount]);

  // Calculate the total before any discounts
  const total = items.reduce((sum, item) => sum + item.price * item.tons, 0);
  
  // Calculate the total after applying cart-level coupon discount
  const discountTotal = Math.max(0, total - couponDiscount);

  // Deposit option functions
  const toggleDepositOption = useCallback(() => {
    setDepositOption(prev => !prev);
  }, [setDepositOption]);

  const isDepositPayment = useCallback(() => {
    return depositOption;
  }, [depositOption]);

  const getPaymentTotal = useCallback(() => {
    const baseTotal = Math.max(0, total - couponDiscount);
    return depositOption ? 199 : baseTotal;
  }, [total, couponDiscount, depositOption]);

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateDeliveryDetails,
      updateQuantity,
      updateItemPrice, // Add the new function to context
      clearCart, 
      total,
      discountTotal,
      isDeliveryInfoComplete,
      appliedCoupon,
      couponDiscount,
      applyCoupon,
      removeCoupon,
      depositOption,
      toggleDepositOption,
      isDepositPayment,
      getPaymentTotal
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
