
import React from 'react';
import { Button } from '@/components/ui/button';

interface PriceDisplayProps {
  showDiscountedPrice: boolean;
  discountedCost: number;
  totalTons: number;
  onAddToCart: () => void;
}

export const PriceDisplay = ({ 
  showDiscountedPrice, 
  discountedCost, 
  totalTons, 
  onAddToCart 
}: PriceDisplayProps) => {
  if (!showDiscountedPrice) return null;

  return (
    <div className="text-center space-y-4">
      <div className="text-2xl font-bold text-green-600">
        Discounted Price: ${discountedCost.toFixed(2)}
        <div className="text-sm font-normal text-green-700">
          You save: $50.00
        </div>
      </div>
      <Button
        type="button"
        onClick={onAddToCart}
        className="w-full"
      >
        Add {totalTons.toFixed(1)} tons to Cart
      </Button>
    </div>
  );
};
