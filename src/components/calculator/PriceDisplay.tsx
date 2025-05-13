
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, AlertCircle } from "lucide-react";

interface PriceDisplayProps {
  showDiscountedPrice: boolean;
  discountedCost: number;
  totalTons: number;
  onAddToCart: () => void;
  isAvailable?: boolean;
}

export function PriceDisplay({ 
  showDiscountedPrice, 
  discountedCost, 
  totalTons,
  onAddToCart,
  isAvailable = true
}: PriceDisplayProps) {
  const formattedTons = Math.floor(totalTons);
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      {showDiscountedPrice ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Your Estimated Total</h3>
            <div className="text-xl font-bold">${discountedCost.toFixed(2)}</div>
          </div>
          <p className="text-sm text-gray-600">
            Price includes optional $50 discount for online ordering. Final price may vary based
            on exact tons delivered and delivery location.
          </p>
          
          {!isAvailable ? (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Delivery Not Available
                  </p>
                  <p className="text-xs text-amber-700">
                    Unfortunately, we don't currently deliver to this ZIP code.
                    Please try a different location or contact us for assistance.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Button 
              className="w-full"
              onClick={onAddToCart}
              disabled={!isAvailable}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add {formattedTons} tons to Cart
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-center py-2">
          <p className="text-sm text-gray-600">
            Complete the form above to see your final price.
          </p>
        </div>
      )}
    </div>
  );
}
