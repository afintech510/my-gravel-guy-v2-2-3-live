import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product } from '../services/productTypes';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Undo } from 'lucide-react';

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
  deliveryTimePreference?: 'morning' | 'afternoon';
  deliveryInstructions?: string;
  locationPhotoUrl?: string;
  contactInfo?: ContactInfo;
  basePrice?: number; // Original product price before ZIP code adjustments
  couponApplied?: boolean; // Track if a coupon has been applied
  couponAmount?: number; // Amount of the coupon discount
  
  // Additional material properties
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
    couponApplied?: boolean,
    couponAmount?: number,
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
  clearCart: () => void;
  total: number;
  discountTotal: number;
  isDeliveryInfoComplete: (item: CartItem) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [lastRemovedItem, setLastRemovedItem] = useState<CartItem | null>(null);
  const { toast } = useToast();

  // Modified to add each product as a new cart item (never combine)
  const addToCart = useCallback((product: Product & { 
    tons?: number, 
    yards?: number,
    deliveryDate?: Date,
    contactInfo?: ContactInfo,
    couponApplied?: boolean,
    couponAmount?: number,
    materialCategory?: string,
    materialSubcategory?: string,
    materialSize?: string,
    applicationType?: string,
    depth?: number,
    deliveryAddress?: DeliveryAddress
  }) => {
    const tons = product.tons || 3; // Default to 3 tons if not specified
    // Use the provided yards or calculate yards based on tonYardRatio if available
    const yards = product.yards || (product.tonYardRatio ? tons / product.tonYardRatio : undefined);
    
    setItems(currentItems => [
      ...currentItems,
      {
        ...product,
        tons,
        yards,
        basePrice: product.price, // Store original price for potential adjustments later
        couponApplied: product.couponApplied || false,
        couponAmount: product.couponAmount || 0,
        materialCategory: product.materialCategory,
        materialSubcategory: product.materialSubcategory,
        materialSize: product.materialSize,
        applicationType: product.applicationType,
        depth: product.depth,
        deliveryAddress: product.deliveryAddress
      }
    ]);
  }, []);

  // New function to restore the last removed item
  const restoreLastRemovedItem = useCallback(() => {
    if (lastRemovedItem) {
      setItems(currentItems => [...currentItems, lastRemovedItem]);
      setLastRemovedItem(null);
    }
  }, [lastRemovedItem]);

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
  }, [toast, restoreLastRemovedItem]);

  // New function to update quantity for a specific cart item
  const updateQuantity = useCallback((productId: string | number, newTons: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === productId
          ? { 
              ...item, 
              tons: newTons,
              yards: item.tonYardRatio ? newTons / item.tonYardRatio : undefined
            }
          : item
      )
    );
  }, []);

  // New function to update delivery details for a specific cart item
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
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

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

  // Calculate the total before any discounts
  const total = items.reduce((sum, item) => sum + item.price * item.tons, 0);
  
  // Calculate the total after applying any coupon discounts
  const discountTotal = items.reduce((sum, item) => {
    const itemTotal = item.price * item.tons;
    const discount = item.couponApplied && item.couponAmount ? item.couponAmount : 0;
    return sum + (itemTotal - discount);
  }, 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateDeliveryDetails,
      updateQuantity,
      clearCart, 
      total,
      discountTotal,
      isDeliveryInfoComplete
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
