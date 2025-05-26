
import React from 'react';
import { Info } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface PriceDetailsDisplayProps {
  priceDetails: {
    basePrice: number;
    multiplier: number;
    zipAdjustment: number;
    finalPrice: number;
    pricePerTon: number;
  };
}

export default function PriceDetailsDisplay({ priceDetails }: PriceDetailsDisplayProps) {
  // Format percentage difference for display
  const formatPercentage = (value: number) => {
    if (value === 1) return "0%";
    return value < 1 
      ? `-${((1 - value) * 100).toFixed(0)}%` 
      : `+${((value - 1) * 100).toFixed(0)}%`;
  };

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm">Base Price:</span>
        <span className="text-sm">${priceDetails.basePrice.toFixed(2)}/ton</span>
      </div>
      
      {priceDetails.multiplier !== 1 && (
        <div className="flex justify-between items-center">
          <span className="text-sm">Volume {priceDetails.multiplier < 1 ? 'Discount' : 'Adjustment'}:</span>
          <span className={`text-sm ${priceDetails.multiplier < 1 ? 'text-green-600' : 'text-amber-600'}`}>
            {formatPercentage(priceDetails.multiplier)}
          </span>
        </div>
      )}
      
      {priceDetails.zipAdjustment !== 1 && (
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-sm">Location Adjustment:</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="ml-1">
                    <Info className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-xs">
                    Pricing may vary based on delivery location due to distance and other factors.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <span className={`text-sm ${priceDetails.zipAdjustment < 1 ? 'text-green-600' : 'text-amber-600'}`}>
            {formatPercentage(priceDetails.zipAdjustment)}
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-center pt-1 mt-1 border-t border-gray-200">
        <span className="font-medium">Final Price:</span>
        <span className="font-medium text-primary">${priceDetails.pricePerTon.toFixed(2)}/ton</span>
      </div>
    </div>
  );
}
