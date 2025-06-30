
import React from 'react';
import { Check, Shield, Package } from 'lucide-react';

const ProductTrustModule = () => {
  return (
    <div className="flex items-center justify-center gap-4 md:gap-8 py-4 px-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <Package className="h-5 w-5 text-green-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">In Stock</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
          <Check className="h-5 w-5 text-yellow-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">Premium Quality Guaranteed</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <Shield className="h-5 w-5 text-blue-600" />
        </div>
        <span className="text-sm font-medium text-gray-700">Secure Checkout</span>
      </div>
    </div>
  );
};

export default ProductTrustModule;
