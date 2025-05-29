
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';

interface QuantityAdjusterProps {
  adjustedTons: number;
  onIncrement: () => void;
  onDecrement: () => void;
  className?: string;
}

export default function QuantityAdjuster({ 
  adjustedTons, 
  onIncrement, 
  onDecrement, 
  className = "" 
}: QuantityAdjusterProps) {
  return (
    <div className={`flex justify-end ${className}`}>
      <div className="flex items-center bg-green-100 rounded-lg p-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDecrement}
          disabled={adjustedTons <= 3}
          className="h-8 w-8 p-0 hover:bg-green-200"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="mx-3 text-sm font-medium">Ton</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onIncrement}
          className="h-8 w-8 p-0 hover:bg-green-200"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
