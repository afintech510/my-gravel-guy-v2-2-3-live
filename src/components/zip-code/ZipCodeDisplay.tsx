
import React from 'react';
import { Button } from "@/components/ui/button";
import { MapPin, X } from 'lucide-react';
import { ZipCodeData } from '../../services/productTypes';

interface ZipCodeDisplayProps {
  zipCode: string | null;
  zipCodeData: ZipCodeData | null;
  onUnlock: () => void;
}

const ZipCodeDisplay = ({ 
  zipCode, 
  zipCodeData, 
  onUnlock 
}: ZipCodeDisplayProps) => {
  if (!zipCode || !zipCodeData) return null;

  return (
    <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
      <div className="flex items-center">
        <MapPin className="h-4 w-4 mr-2 text-primary" />
        <div>
          <span className="font-medium">{zipCodeData.city}, {zipCodeData.state_id}</span>
          <div className="text-xs text-gray-500">ZIP: {zipCode}</div>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="ml-2 h-8 w-8 p-0" 
        onClick={onUnlock}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ZipCodeDisplay;
