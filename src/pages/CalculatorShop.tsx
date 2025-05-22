
import React, { useState, useEffect } from 'react';
import ShopCalculator from '../components/shop-calculator/ShopCalculator';
import QuoteFormProduct from '../components/forms/QuoteFormProduct';
import TrustBanner from '../components/products/trust/TrustBanner';
import DatabaseSetupHelper from '../components/setup/DatabaseSetupHelper';
import { checkRequiredTables } from '../utils/dbSetup';

const CalculatorShop = () => {
  const [showSetupHelper, setShowSetupHelper] = useState(false);
  
  useEffect(() => {
    const checkDbSetup = async () => {
      const { hasPriceTiersTable } = await checkRequiredTables();
      setShowSetupHelper(!hasPriceTiersTable);
    };
    
    checkDbSetup();
  }, []);
  
  return (
    <div className="py-8 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-3 font-montserrat">Material Calculator</h1>
        <p className="text-center text-gray-600 mb-2 font-montserrat">
          Choose your material type and calculate how much you need for your project
        </p>
        <p className="text-center text-primary font-medium mb-8 font-montserrat">
          Volume discounts available - The more you order, the more you save!
        </p>
        
        {showSetupHelper && (
          <div className="mb-8">
            <DatabaseSetupHelper />
          </div>
        )}
        
        <ShopCalculator />
        
        {/* Quote Form Component */}
        <div className="mt-16">
          <QuoteFormProduct />
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
