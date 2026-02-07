
import React from 'react';

const SecurePay = () => {
  return (
    <div className="flex flex-col gap-4 py-6 px-4 bg-card rounded-lg border border-border">
      <img 
        src="https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//visa-mc-amex-disc_pay-logos.png" 
        alt="Visa, Mastercard, American Express, Discover"
        className="w-full h-16 object-contain"
      />
      <img 
        src="https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//app-goog-link_pay-logos.png" 
        alt="Apple Pay, Google Pay, Link"
        className="w-full h-16 object-contain"
      />
    </div>
  );
};

export default SecurePay;
