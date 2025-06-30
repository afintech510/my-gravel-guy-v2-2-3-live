
import React from 'react';

const SecurePay = () => {
  return (
    <div className="flex flex-col gap-3 py-3 px-4 bg-white rounded-lg border border-gray-100">
      <img 
        src="https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//visa-mc-amex-disc_pay-logos.png" 
        alt="Visa, Mastercard, American Express, Discover"
        className="w-full h-8 object-contain"
      />
      <img 
        src="https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//app-goog-link_pay-logos.png" 
        alt="Apple Pay, Google Pay, Link"
        className="w-full h-8 object-contain"
      />
    </div>
  );
};

export default SecurePay;
