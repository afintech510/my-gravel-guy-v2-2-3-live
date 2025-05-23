
import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, X } from 'lucide-react';

interface PriceDisplayProps {
  showDiscountedPrice: boolean;
  discountedCost: number;
  totalTons: number;
  onAddToCart: () => void;
  isAvailable: boolean;
  productName?: string;
}

export const PriceDisplay = ({ 
  showDiscountedPrice, 
  discountedCost, 
  totalTons, 
  onAddToCart, 
  isAvailable,
  productName 
}: PriceDisplayProps) => {
  if (!showDiscountedPrice) {
    return null;
  }

  if (!isAvailable) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
        <X className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-red-700">Delivery Not Available</h3>
        <p className="text-red-600">We don't currently deliver to your area.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
      <div className="text-center">
        <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
        <h3 className="text-lg font-semibold text-green-700">Great! We deliver to your area</h3>
        
        <div className="mt-4 space-y-2">
          <div className="text-2xl font-bold text-green-800">
            ${discountedCost.toFixed(2)}
          </div>
          <div className="text-sm text-green-600">
            {totalTons} tons of {productName} with $50 discount applied
          </div>
        </div>
        
        <Button onClick={onAddToCart} size="lg" className="mt-4 w-full">
          Add to Cart
        </Button>
      </div>
    </div>
  );
};
