
import React from 'react';
import { useZipCode } from '@/contexts/ZipCodeContext';
import ZipCodeSearchInput from '@/components/zip-code/ZipCodeSearchInput';
import { Product } from '@/services/productTypes';
import { getPriceForProduct } from '@/services/productService';

interface ZipCodeSectionProps {
  product: Product | null;
}

const ZipCodeSection: React.FC<ZipCodeSectionProps> = ({ product }) => {
  const { zipCode, zipCodeData } = useZipCode();

  const getDeliveryStatus = () => {
    if (!zipCode) return null;
    
    // Determine if we can deliver to this ZIP code
    // Here we assume any zipCodeData means it's a valid delivery location
    const canDeliver = !!zipCodeData;
    
    if (canDeliver) {
      return { canDeliver: true, message: "We deliver to your area!" };
    }
    
    return { canDeliver: false, message: "Sorry, we don't deliver to this area yet." };
  };

  const deliveryStatus = getDeliveryStatus();

  // Get price based on product and zip code
  const getPrice = () => {
    if (!product || !zipCode) return null;
    
    try {
      // Calculate price using product service
      const price = getPriceForProduct(product);
      return price;
    } catch (error) {
      console.error('Error getting price:', error);
      return null;
    }
  };

  const price = getPrice();

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h3 className="font-medium mb-3">Check Delivery Availability</h3>
      
      <div className="mb-4">
        <ZipCodeSearchInput />
      </div>
      
      {zipCode && deliveryStatus && (
        <div className={`p-3 rounded-md ${deliveryStatus.canDeliver ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p className="text-sm">{deliveryStatus.message}</p>
          
          {deliveryStatus.canDeliver && product && price && (
            <p className="mt-2 text-sm font-medium">
              Estimated delivery price: ${price.toFixed(2)}/ton
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ZipCodeSection;
