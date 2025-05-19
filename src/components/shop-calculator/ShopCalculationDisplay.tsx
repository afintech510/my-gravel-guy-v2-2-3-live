
import React from 'react';

type ShopCalculationDisplayProps = {
  totalArea: number;
  cubicYards: number;
  tons: number;
};

const ShopCalculationDisplay: React.FC<ShopCalculationDisplayProps> = ({
  totalArea,
  cubicYards,
  tons
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-md">
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">Total Area</p>
        <p className="text-2xl font-bold">{totalArea.toFixed(0)} sq. ft.</p>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">Cubic Yards Needed</p>
        <p className="text-2xl font-bold">{cubicYards.toFixed(2)} cu. yds.</p>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-500 mb-1">Estimated Tons</p>
        <p className="text-2xl font-bold">{tons.toFixed(0)} tons</p>
      </div>
    </div>
  );
};

export default ShopCalculationDisplay;
