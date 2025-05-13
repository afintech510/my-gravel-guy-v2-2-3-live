
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface CalculationDisplayProps {
  totalArea: number;
  cubicYards: number;
  tons: number;
  estimatedCost: number;
  onTonsChange?: (newTons: number) => void;
  isManualTons?: boolean;
}

const CalculationDisplay = ({ 
  totalArea, 
  cubicYards, 
  tons, 
  estimatedCost, 
  onTonsChange,
  isManualTons = false
}: CalculationDisplayProps) => {
  const handleIncrement = () => {
    if (onTonsChange) {
      // Changed to increment by 1 whole number
      onTonsChange(Math.floor(tons + 1));
    }
  };

  const handleDecrement = () => {
    if (onTonsChange && tons > 1) {
      // Changed to decrement by 1 whole number with minimum of 1
      onTonsChange(Math.floor(tons - 1));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-4 border-t border-b">
      <div>
        <p className="text-sm text-muted-foreground">Total Area sq. ft.</p>
        <p className="text-2xl font-bold">{totalArea.toFixed(2)}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Cubic Yards Needed</p>
        <p className="text-2xl font-bold">{cubicYards.toFixed(2)}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Total Tons</p>
        {onTonsChange ? (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleDecrement} 
              disabled={tons <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <div className="w-20 h-10 flex items-center justify-center border rounded-md bg-background text-2xl font-bold">
              {Math.floor(tons)}
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleIncrement}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-2xl font-bold">{Math.floor(tons)}</p>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Estimated Cost</p>
        <p className="text-2xl font-bold">${estimatedCost.toFixed(2)}</p>
      </div>
    </div>
  );
};

export default CalculationDisplay;
