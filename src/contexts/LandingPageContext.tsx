import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { Product } from '@/services/productTypes';
import { DeliveryAddress, ContactInfo } from '@/contexts/CartContext';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { trackEvent, trackEcommerce } from '@/utils/analytics';

export interface UTMParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
}

export interface PriceData {
  normalPrice: number;
  discountedPrice: number;
  discountAmount: number;
  depositEstimate: number;
  cashPriceEstimate: number;
  cardPriceEstimate: number;
}

export interface LandingPageState {
  selectedMaterial: Product | null;
  quantity: number;
  deliveryAddress: Partial<DeliveryAddress>;
  contactInfo: ContactInfo | null;
  discountUnlocked: boolean;
  utmParams: UTMParams;
  priceData: PriceData | null;
  isCalculatingPrice: boolean;
  formStep: 'material' | 'contact' | 'review';
  paymentPath: 'deposit' | 'buy_now' | null;
}

interface LandingPageContextType {
  state: LandingPageState;
  setSelectedMaterial: (material: Product | null) => void;
  setQuantity: (quantity: number) => void;
  setDeliveryAddress: (address: Partial<DeliveryAddress>) => void;
  setContactInfo: (info: ContactInfo | null) => void;
  unlockDiscount: () => void;
  calculatePricing: () => Promise<void>;
  setFormStep: (step: LandingPageState['formStep']) => void;
  setPaymentPath: (path: LandingPageState['paymentPath']) => void;
  trackFormInteraction: (action: string, data?: any) => void;
  initiateCheckout: (path: 'deposit' | 'buy_now') => void;
}

const LandingPageContext = createContext<LandingPageContextType | undefined>(undefined);

const initialState: LandingPageState = {
  selectedMaterial: null,
  quantity: 10,
  deliveryAddress: {},
  contactInfo: null,
  discountUnlocked: false,
  utmParams: {},
  priceData: null,
  isCalculatingPrice: false,
  formStep: 'material',
  paymentPath: null,
};

export const LandingPageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useLocalStorage<LandingPageState>('landingPageState', initialState);

  // Capture UTM parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmParams: UTMParams = {
      utm_source: urlParams.get('utm_source') || undefined,
      utm_medium: urlParams.get('utm_medium') || undefined,
      utm_campaign: urlParams.get('utm_campaign') || undefined,
      utm_term: urlParams.get('utm_term') || undefined,
      utm_content: urlParams.get('utm_content') || undefined,
      gclid: urlParams.get('gclid') || undefined,
    };

    // Only update if we have UTM params and they're different
    const hasUTM = Object.values(utmParams).some(value => value !== undefined);
    if (hasUTM) {
      setState(prev => ({ ...prev, utmParams }));
    }
  }, [setState]);

  const setSelectedMaterial = useCallback((material: Product | null) => {
    setState(prev => ({ ...prev, selectedMaterial: material, formStep: material ? 'contact' : 'material' }));
    
    if (material) {
      trackEvent('view_item', 'landing_page', material.name, state.quantity);
      
      // Track ecommerce view_item event
      trackEcommerce('view_item', [{
        item_id: material.id,
        item_name: material.name,
        item_category: material.category,
        quantity: state.quantity,
        price: material.price
      }]);
    }
  }, [setState, state.quantity]);

  const setQuantity = useCallback((quantity: number) => {
    setState(prev => ({ ...prev, quantity }));
  }, [setState]);

  const setDeliveryAddress = useCallback((address: Partial<DeliveryAddress>) => {
    setState(prev => ({ 
      ...prev, 
      deliveryAddress: { ...prev.deliveryAddress, ...address } 
    }));
  }, [setState]);

  const setContactInfo = useCallback((info: ContactInfo | null) => {
    setState(prev => ({ ...prev, contactInfo: info }));
  }, [setState]);

  const unlockDiscount = useCallback(() => {
    setState(prev => ({ ...prev, discountUnlocked: true, formStep: 'review' }));
    
    // Track lead generation
    trackEvent('generate_lead', 'landing_page', 'discount_unlocked');
    
    // Push to dataLayer for GTM
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'generate_lead',
        lead_value: 0,
        ...state.utmParams
      });
    }
  }, [setState, state.utmParams]);

  const calculatePricing = useCallback(async () => {
    if (!state.selectedMaterial || !state.deliveryAddress.zip) return;

    setState(prev => ({ ...prev, isCalculatingPrice: true }));

    try {
      // Import pricing functions dynamically to avoid circular dependencies
      const { calculateProductExponentialPrice } = await import('@/services/products/exponentialPricing');
      const { getPriceAdjustmentForZipCode } = await import('@/services/products/pricingUtils');

      // Calculate exponential price
      const exponentialResult = calculateProductExponentialPrice(state.selectedMaterial, state.quantity);
      
      // Apply ZIP adjustment if available
      let zipAdjustment = 1;
      if (state.deliveryAddress.zip) {
        zipAdjustment = await getPriceAdjustmentForZipCode(state.deliveryAddress.zip);
      }

      const normalPrice = Math.round(exponentialResult.pricePerTon * zipAdjustment * state.quantity * 100) / 100;
      const discountAmount = Math.min(normalPrice * 0.05, 50);
      const discountedPrice = normalPrice - discountAmount;

      const priceData: PriceData = {
        normalPrice,
        discountedPrice,
        discountAmount,
        depositEstimate: 199,
        cashPriceEstimate: Math.round(discountedPrice * 0.95 * 100) / 100, // 5% cash discount estimate
        cardPriceEstimate: discountedPrice,
      };

      setState(prev => ({ ...prev, priceData, isCalculatingPrice: false }));
    } catch (error) {
      console.error('Error calculating pricing:', error);
      setState(prev => ({ ...prev, isCalculatingPrice: false }));
    }
  }, [state.selectedMaterial, state.quantity, state.deliveryAddress.zip, setState]);

  const setFormStep = useCallback((step: LandingPageState['formStep']) => {
    setState(prev => ({ ...prev, formStep: step }));
  }, [setState]);

  const setPaymentPath = useCallback((path: LandingPageState['paymentPath']) => {
    setState(prev => ({ ...prev, paymentPath: path }));
  }, [setState]);

  const trackFormInteraction = useCallback((action: string, data?: any) => {
    trackEvent(action, 'landing_form', JSON.stringify(data));
  }, []);

  const initiateCheckout = useCallback((path: 'deposit' | 'buy_now') => {
    const price = path === 'deposit' ? 199 : (state.discountUnlocked ? state.priceData?.discountedPrice : state.priceData?.normalPrice);
    
    trackEvent('begin_checkout', 'landing_page', path, price);
    
    // Track ecommerce begin_checkout event
    if (state.selectedMaterial && state.priceData) {
      trackEcommerce('begin_checkout', [{
        item_id: state.selectedMaterial.id,
        item_name: state.selectedMaterial.name,
        item_category: state.selectedMaterial.category,
        quantity: state.quantity,
        price: price || 0
      }], price);
    }

    // Push to dataLayer for GTM
    if (typeof window !== 'undefined' && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: 'begin_checkout',
        checkout_path: path,
        price_shown: price,
        discount_applied: state.discountUnlocked,
        material: state.selectedMaterial?.name,
        quantity_tons: state.quantity,
        ...state.utmParams
      });
    }

    setPaymentPath(path);
  }, [state, setPaymentPath]);

  // Recalculate pricing when relevant data changes
  useEffect(() => {
    if (state.selectedMaterial && state.deliveryAddress.zip) {
      calculatePricing();
    }
  }, [state.selectedMaterial, state.quantity, state.deliveryAddress.zip, calculatePricing]);

  const contextValue: LandingPageContextType = {
    state,
    setSelectedMaterial,
    setQuantity,
    setDeliveryAddress,
    setContactInfo,
    unlockDiscount,
    calculatePricing,
    setFormStep,
    setPaymentPath,
    trackFormInteraction,
    initiateCheckout,
  };

  return (
    <LandingPageContext.Provider value={contextValue}>
      {children}
    </LandingPageContext.Provider>
  );
};

export const useLandingPage = () => {
  const context = useContext(LandingPageContext);
  if (context === undefined) {
    throw new Error('useLandingPage must be used within a LandingPageProvider');
  }
  return context;
};