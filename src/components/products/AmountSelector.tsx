
import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface AmountSelectorProps {
  selectedAmount: number;
  onSelectAmount: (amount: number) => void;
  minAmount?: number;
  maxAmount?: number;
}

const AmountSelector = ({ 
  selectedAmount, 
  onSelectAmount,
  minAmount = 3,
  maxAmount = 50
}: AmountSelectorProps) => {
  // Fixed amounts as shown in the image
  const fixedAmounts = [3, 5, 7, 10, 12, 15, 20, 23];
  
  return (
    <div className="space-y-6 font-montserrat">
      <label className="text-sm font-medium">Select Amount (tons)</label>
      
      <div className="grid grid-cols-5 gap-2">
        {fixedAmounts.map((amount) => (
          <Button
            key={amount}
            variant="outline"
            size="sm"
            onClick={() => onSelectAmount(amount)}
            className={cn(
              "h-10 min-w-[2.5rem] font-montserrat",
              selectedAmount === amount && "bg-primary text-primary-foreground"
            )}
          >
            {amount}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectAmount(selectedAmount + 1)}
          className="h-10 min-w-[2.5rem] font-montserrat"
        >
          +1
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectAmount(selectedAmount + 5)}
          className="h-10 min-w-[2.5rem] font-montserrat"
        >
          +5
        </Button>
      </div>
      
      <div className="mt-4">
        <h1 className="text-5xl font-bold">{selectedAmount} tons</h1>
      </div>
    </div>
  );
};

export default AmountSelector;
