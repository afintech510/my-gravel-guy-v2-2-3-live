
import React from 'react';
import EnhancedDeliveryForm, { EnhancedDeliveryFormData } from './EnhancedDeliveryForm';
import { CartItem } from '../../contexts/CartContext';

export type DeliveryFormData = {
  street: string;
  city: string;
  state: string;
  zip: string;
  contactPhone: string;
  deliveryTimePreference?: "morning" | "afternoon";
  deliveryInstructions?: string;
};

interface DeliveryFormProps {
  initialData?: Partial<DeliveryFormData>;
  zipCode?: string;
  onSubmit: (data: DeliveryFormData) => void;
  lockZipCode?: boolean;
  item?: CartItem;
}

const DeliveryForm = ({ onSubmit, item }: DeliveryFormProps) => {
  const handleEnhancedSubmit = (data: EnhancedDeliveryFormData) => {
    // Convert enhanced form data to legacy format for compatibility
    const legacyData: DeliveryFormData = {
      street: data.street,
      city: data.city,
      state: data.state,
      zip: data.zip,
      contactPhone: data.phone,
      deliveryTimePreference: data.deliveryTimePreference,
      deliveryInstructions: data.deliveryInstructions
    };
    onSubmit(legacyData);
  };

  return <EnhancedDeliveryForm item={item} onSubmit={handleEnhancedSubmit} />;
};

export default DeliveryForm;
