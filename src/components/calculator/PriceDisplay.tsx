
import React from 'react';
import { Button } from "@/components/ui/button";
import { ShoppingCart, AlertCircle, Tag } from "lucide-react";

interface PriceDisplayProps {
  showDiscountedPrice: boolean;
  discountedCost: number;
  totalTons: number;
  originalPrice?: number;
  adjustedPrice?: number;
  priceAdjustment?: number;
  onAddToCart: () => void;
  isAvailable?: boolean;
  productName?: string; // New prop for product name
}

export function PriceDisplay({ 
  showDiscountedPrice, 
  discountedCost, 
  totalTons,
  originalPrice,
  adjustedPrice,
  priceAdjustment = 0,
  onAddToCart,
  isAvailable = true,
  productName = "Material" // Default to "Material" if no product name provided
}: PriceDisplayProps) {
  const formattedTons = Math.floor(totalTons);
  const hasZipAdjustment = priceAdjustment !== 0;
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      {showDiscountedPrice ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-black">Your Estimated Total</h3>
            <div className="text-xl font-bold text-black">${discountedCost.toFixed(2)}</div>
          </div>
          
          {/* Display product name */}
          {productName && (
            <div className="bg-gray-100 p-2 rounded text-center mb-2">
              <p className="font-medium text-primary">{productName}</p>
            </div>
          )}
          
          {hasZipAdjustment && originalPrice && adjustedPrice && (
            <div className="text-sm">
              <div className="flex justify-between text-black">
                <span>Base price:</span>
                <span>${originalPrice.toFixed(2)} per ton</span>
              </div>
              <div className="flex justify-between text-black">
                <span>Location adjustment:</span>
                <span className={priceAdjustment > 0 ? "text-red-600" : "text-green-600"}>
                  {priceAdjustment > 0 ? "+" : ""}{priceAdjustment}%
                </span>
              </div>
              <div className="flex justify-between font-medium mt-1 text-black">
                <span>Final price:</span>
                <span>${adjustedPrice.toFixed(2)} per ton</span>
              </div>
            </div>
          )}
          
          {/* Coupon Discount Information */}
          <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start">
            <Tag className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-black">$50 Discount Applied</p>
              <p className="text-xs text-black">
                A $50 discount will be automatically applied to your order when you add to cart.
              </p>
            </div>
          </div>
          
          <p className="text-sm text-black">
            {hasZipAdjustment 
              ? `Price includes location-based ${priceAdjustment > 0 ? 'increase' : 'discount'} for your delivery ZIP code.` 
              : "Price includes online ordering discount."} 
            Final price may vary based on exact tons delivered.
          </p>
          
          {!isAvailable ? (
            <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                <div>
                  <p className="text-sm font-medium text-black">
                    Delivery Not Available
                  </p>
                  <p className="text-xs text-black">
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
              Add {formattedTons} tons of {productName} to Cart
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-center py-2">
          <p className="text-sm text-black">
            Complete the form above to see your final price.
          </p>
        </div>
      )}
    </div>
  );
}
