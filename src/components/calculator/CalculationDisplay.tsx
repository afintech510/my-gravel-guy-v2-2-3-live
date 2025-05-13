
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
      onTonsChange(+(tons + 0.5).toFixed(1));
    }
  };

  const handleDecrement = () => {
    if (onTonsChange && tons > 0.5) {
      onTonsChange(+(tons - 0.5).toFixed(1));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (onTonsChange && !isNaN(value) && value >= 0) {
      onTonsChange(+value.toFixed(1));
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
              disabled={tons <= 0.5}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input 
              type="number" 
              value={tons.toFixed(1)}
              onChange={handleInputChange}
              className="w-20 text-center" 
              min="0.5"
              step="0.5"
            />
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleIncrement}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-2xl font-bold">{tons.toFixed(1)}</p>
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
