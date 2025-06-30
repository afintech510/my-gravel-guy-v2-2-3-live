
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuantityInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  cubicYards?: number;
}

const QuantityInput = ({ 
  value, 
  onChange, 
  min = 3, 
  max = 100,
  cubicYards 
}: QuantityInputProps) => {
  const [inputValue, setInputValue] = useState(value.toString());

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // Parse and validate the input
    const numValue = parseInt(newValue);
    if (!isNaN(numValue) && numValue >= min && numValue <= max) {
      onChange(numValue);
    }
  };

  const handleInputBlur = () => {
    // Ensure valid value on blur
    const numValue = parseInt(inputValue);
    if (isNaN(numValue) || numValue < min) {
      setInputValue(min.toString());
      onChange(min);
    } else if (numValue > max) {
      setInputValue(max.toString());
      onChange(max);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center my-4">
      <div className="flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={value <= min}
          className="h-12 w-12"
        >
          <Minus className="h-6 w-6" />
        </Button>
        
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              min={min}
              max={max}
              className="w-20 h-12 text-center text-4xl font-bold border-0 shadow-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="text-4xl font-bold">tons</span>
          </div>
          {cubicYards && (
            <span className="text-xl text-gray-500">
              ≈ {cubicYards} yd³
            </span>
          )}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={value >= max}
          className="h-12 w-12"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export default QuantityInput;
