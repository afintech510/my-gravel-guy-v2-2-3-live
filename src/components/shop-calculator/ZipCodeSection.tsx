
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Product } from '@/services/productTypes';
import ZipCodeSearchInput from '@/components/zip-code/ZipCodeSearchInput';
import { useZipCode } from '@/contexts/ZipCodeContext';

interface ZipCodeSectionProps {
  product: Product | null;
}

const ZipCodeSection: React.FC<ZipCodeSectionProps> = ({ product }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { zipCode, setZipCode, zipCodeData } = useZipCode();

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Check Delivery Availability</h2>
      <p className="text-sm text-gray-600 mb-4">
        Enter your ZIP code to check if we deliver to your area and get accurate pricing.
      </p>
      
      <ZipCodeSearchInput 
        inputValue={zipCode || ''}
        onInputChange={(e) => {}} 
        onSearch={(e) => {
          e.preventDefault();
          const inputElement = e.currentTarget.querySelector('input');
          if (inputElement && inputElement.value) {
            setZipCode(inputElement.value);
          }
        }}
        variant="default"
      />
      
      {zipCode && zipCodeData && (
        <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
          <p className="text-sm text-green-700">
            Delivery is available to {zipCodeData.city} ({zipCode})
          </p>
        </div>
      )}
    </Card>
  );
};

export default ZipCodeSection;
