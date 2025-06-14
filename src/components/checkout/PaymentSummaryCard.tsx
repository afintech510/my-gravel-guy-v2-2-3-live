
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from "lucide-react";
import CouponCode from '../cart/CouponCode';

interface PaymentSummaryCardProps {
  total: number;
  discountTotal: number;
  hasDiscounts: boolean;
  totalDiscount: number;
  onCheckout: () => void;
  isLoading: boolean;
}

export const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({
  total,
  discountTotal,
  hasDiscounts,
  totalDiscount,
  onCheckout,
  isLoading
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
      <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
      
      <div className="space-y-2 mb-4 pb-4 border-b">
        <div className="flex justify-between text-sm">
          <span>Subtotal</span>
          <span>${total.toFixed(2)}</span>
        </div>
        
        {hasDiscounts && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-${totalDiscount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span>Delivery</span>
          <span className="text-green-600 font-medium">FREE</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span>Tax</span>
          <span className="text-green-600 font-medium">Included</span>
        </div>
      </div>
      
      <div className="flex justify-between font-semibold text-lg mb-6">
        <span>Total</span>
        <span>${discountTotal.toFixed(2)}</span>
      </div>

      <div className="mb-6">
        <CouponCode />
      </div>
      
      <Button 
        onClick={onCheckout}
        disabled={isLoading}
        className="w-full mb-4"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Continue to Payment'
        )}
      </Button>
      
      <p className="text-xs text-gray-500 mt-3 text-center">
        Secure checkout powered by Stripe
      </p>
    </div>
  );
};
