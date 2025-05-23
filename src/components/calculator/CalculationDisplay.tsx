
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CalculationDisplayProps {
  totalArea: number;
  cubicYards: number;
  tons: number;
  estimatedCost: number;
  onTonsChange: (tons: number) => void;
  isManualTons: boolean;
}

const CalculationDisplay = ({
  totalArea,
  cubicYards,
  tons,
  estimatedCost,
  onTonsChange,
  isManualTons
}: CalculationDisplayProps) => {
  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold">Calculation Results</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label className="text-sm font-medium">Total Area</Label>
          <div className="text-2xl font-bold">{totalArea.toFixed(2)} sq ft</div>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Cubic Yards</Label>
          <div className="text-2xl font-bold">{cubicYards.toFixed(2)} cu yd</div>
        </div>
        
        <div>
          <Label className="text-sm font-medium">Tons Needed</Label>
          <Input
            type="number"
            value={tons}
            onChange={(e) => onTonsChange(Number(e.target.value))}
            className="text-xl font-bold"
            min="1"
          />
        </div>
      </div>
      
      <div className="pt-4 border-t">
        <div className="flex justify-between text-lg">
          <span>Estimated Cost:</span>
          <span className="font-bold">${estimatedCost.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default CalculationDisplay;
