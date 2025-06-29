
import React from 'react';
import { CreditCard } from 'lucide-react';

const PaymentMethodLogos = () => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-3 pt-3 border-t border-gray-200">
      <div className="text-xs text-gray-500 w-full text-center mb-2">
        Accepted payment methods:
      </div>
      
      {/* Payment Method Images */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {/* Credit Cards (Visa, MC, Amex, Discover) */}
        <img 
          src="https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//visa-mc-amex-disc_pay-logos.png" 
          alt="Visa, Mastercard, American Express, Discover"
          className="h-8 object-contain"
        />
        
        {/* Digital Payment Methods (Apple Pay, Google Pay, Link) */}
        <img 
          src="https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//app-goog-link_pay-logos.png" 
          alt="Apple Pay, Google Pay, Link"
          className="h-8 object-contain"
        />
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
