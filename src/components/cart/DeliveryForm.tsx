
import React from 'react';
import EnhancedDeliveryForm, { EnhancedDeliveryFormData } from './EnhancedDeliveryForm';
import { CartItem } from '../../contexts/CartContext';

export type DeliveryFormData = {
  // Delivery date - required
  deliveryDate: Date;
  // Contact info - all required
  name: string;
  phone: string;
  email: string;
  // Delivery address - all required
  street: string;
  city: string;
  state: string;
  zip: string;
  // Optional fields
  deliveryTimePreference?: "anytime" | "morning" | "afternoon";
  deliveryInstructions?: string;
  locationPhotoUrl?: string;
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
    // The communication consent is handled internally in the enhanced form
    const legacyData: DeliveryFormData = {
      deliveryDate: data.deliveryDate,
      name: data.name,
      email: data.email,
      phone: data.phone,
      street: data.street,
      city: data.city,
      state: data.state,
      zip: data.zip,
      deliveryTimePreference: data.deliveryTimePreference,
      deliveryInstructions: data.deliveryInstructions,
      locationPhotoUrl: data.locationPhotoUrl
    };
    onSubmit(legacyData);
  };

  return <EnhancedDeliveryForm item={item} onSubmit={handleEnhancedSubmit} />;
};

export default DeliveryForm;
