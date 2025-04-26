
import React from 'react';
import MaterialCalculator from '../components/MaterialCalculator';

const Calculator = () => {
  return (
    <div className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-12">Material Calculator</h1>
        <MaterialCalculator />
      </div>
    </div>
  );
};

export default Calculator;
