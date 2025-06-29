
import React from 'react';
import { CreditCard } from 'lucide-react';

const PaymentMethodLogos = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-3 pt-3 border-t border-gray-200">
      <div className="text-xs text-gray-500 w-full text-center mb-2">
        Accepted payment methods:
      </div>
      
      {/* Credit Card Icons - Using simple styled divs since we can't use copyrighted logos */}
      <div className="flex items-center gap-2">
        {/* Visa */}
        <div className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">
          VISA
        </div>
        
        {/* Mastercard */}
        <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold">
          MC
        </div>
        
        {/* Amex */}
        <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
          AMEX
        </div>
        
        {/* Discover */}
        <div className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
          DISC
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {/* Apple Pay */}
        <div className="bg-black text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
          🍎 Pay
        </div>
        
        {/* Google Pay */}
        <div className="bg-gray-700 text-white px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
          G Pay
        </div>
        
        {/* Link */}
        <div className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
          Link
        </div>
      </div>
      
      {/* Alternative: Generic credit card icon */}
      <div className="flex items-center gap-1 text-gray-400 text-xs">
        <CreditCard className="h-4 w-4" />
        <span>& more</span>
      </div>
    </div>
  );
};

export default PaymentMethodLogos;
