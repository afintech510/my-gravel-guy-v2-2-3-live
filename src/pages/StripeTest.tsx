
import React from 'react';
import StripeTest from '@/components/payment/StripeTest';

const StripeTestPage = () => {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Stripe Integration Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Test Stripe Checkout</h2>
            <StripeTest />
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Troubleshooting Guide</h2>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="font-medium mb-2">Common Issues:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Edge function not deployed correctly</li>
                <li>Incorrect Stripe secret key format</li>
                <li>Supabase configuration issues</li>
                <li>Network connectivity problems</li>
              </ul>
              
              <h3 className="font-medium mt-4 mb-2">Solutions:</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li>Verify the Stripe secret key format in Supabase secrets</li>
                <li>Check Edge Function logs in Supabase dashboard</li>
                <li>Ensure cors headers are properly configured</li>
                <li>Try with a different product or price value</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeTestPage;
