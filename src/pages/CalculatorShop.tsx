
import React, { useState } from 'react';
import ShopCalculator from '../components/shop-calculator/ShopCalculator';
import QuoteFormProduct from '../components/forms/QuoteFormProduct';
import TrustBanner from '../components/products/trust/TrustBanner';
import { Product } from '@/services/productTypes';

const CalculatorShop = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleProductSelected = (product: Product | null) => {
    setSelectedProduct(product);
    console.log('CalculatorShop: Product selected:', product?.name || 'None');
  };

  return (
    <div className="py-8 px-4 sm:px-6 bg-muted">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 sm:mb-3 font-montserrat">Material Calculator</h1>
        <p className="text-center text-muted-foreground mb-6 sm:mb-8 font-montserrat text-sm sm:text-base">Choose your material type and calculate how much you need for your project</p>
        
        {/* Updated container for the calculator */}
        <div className="bg-card rounded-xl shadow-md overflow-hidden">
          <ShopCalculator />
        </div>
        
        {/* Quote Form Component */}
        <div className="mt-12 sm:mt-16">
          <QuoteFormProduct selectedProduct={selectedProduct} />
        </div>
        
        {/* Trust Banner */}
        <TrustBanner 
          badgeSize="normal"
          title="Why Choose My Gravel Guy" 
          className="my-12"
        />
      </div>
    </div>
  );
};

export default CalculatorShop;
