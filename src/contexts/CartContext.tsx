
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Product } from '../services/productTypes';

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
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product & { 
    tons?: number, 
    yards?: number,
    deliveryDate?: Date,
    contactInfo?: ContactInfo 
  }) => void;
  removeFromCart: (productId: string | number) => void;
  updateDeliveryDetails: (
    productId: string | number, 
    details: Partial<Omit<CartItem, keyof Product | 'tons'>>
  ) => void;
  clearCart: () => void;
  total: number;
  isDeliveryInfoComplete: (item: CartItem) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // Modified to add each product as a new cart item (never combine)
  const addToCart = useCallback((product: Product & { 
    tons?: number, 
    yards?: number,
    deliveryDate?: Date,
    contactInfo?: ContactInfo 
  }) => {
    const tons = product.tons || 3; // Default to 3 tons if not specified
    // Use the provided yards or calculate yards based on tonYardRatio if available
    const yards = product.yards || (product.tonYardRatio ? tons / product.tonYardRatio : undefined);
    
    setItems(currentItems => [
      ...currentItems,
      {
        ...product,
        tons,
        yards
      }
    ]);
  }, []);

  const removeFromCart = useCallback((productId: string | number) => {
    setItems(currentItems => currentItems.filter(item => item.id !== productId));
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

  const total = items.reduce((sum, item) => sum + item.price * item.tons, 0);

  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateDeliveryDetails,
      clearCart, 
      total,
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
