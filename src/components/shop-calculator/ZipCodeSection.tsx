
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
  const { zipCode, locationName, setZipCode } = useZipCode();

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Check Delivery Availability</h2>
      <p className="text-sm text-gray-600 mb-4">
        Enter your ZIP code to check if we deliver to your area and get accurate pricing.
      </p>
      
      <ZipCodeSearchInput 
        onZipCodeSelect={(zip) => setZipCode(zip)}
        defaultValue={zipCode}
      />
      
      {zipCode && locationName && (
        <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
          <p className="text-sm text-green-700">
            Delivery is available to {locationName} ({zipCode})
          </p>
        </div>
      )}
    </Card>
  );
};

export default ZipCodeSection;
