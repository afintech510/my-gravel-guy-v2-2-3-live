
import React from 'react';
import ShopCalculator from '../components/shop-calculator/ShopCalculator';

const CalculatorShop = () => {
  return (
    <div className="py-8 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">Material Calculator</h1>
        <p className="text-center text-gray-600 mb-8">Calculate how much material you need for your project</p>
        <ShopCalculator />
      </div>
    </div>
  );
};

export default CalculatorShop;
