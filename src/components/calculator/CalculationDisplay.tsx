
import React from 'react';

interface CalculationDisplayProps {
  totalArea: number;
  cubicYards: number;
  tons: number;
  estimatedCost: number;
}

const CalculationDisplay = ({ cubicYards, tons, estimatedCost }: CalculationDisplayProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-t border-b">
       <div>
        <p className="text-sm text-muted-foreground">Total Area</p>
        <p className="text-2xl font-bold">{cubicYards.toFixed(2)} sq. ft.</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Cubic Yards Needed</p>
        <p className="text-2xl font-bold">{cubicYards.toFixed(2)}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Total Tons</p>
        <p className="text-2xl font-bold">{tons.toFixed(1)}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Estimated Cost</p>
        <p className="text-2xl font-bold">${estimatedCost.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default CalculationDisplay;
