
import React from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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
  // Common predefined amounts that users might frequently choose
  const commonAmounts = [3, 5, 7, 10, 14, 20, 30, 40, 50].filter(
    amount => amount >= minAmount && amount <= maxAmount
  );
  
  return (
    <div className="space-y-2 font-montserrat">
      <label className="text-sm font-medium">Select Amount (tons)</label>
      
      <ScrollArea className="w-full whitespace-nowrap pb-2">
        <div className="flex space-x-2">
          {commonAmounts.map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="sm"
              onClick={() => onSelectAmount(amount)}
              className={cn(
                "min-w-[3rem] font-montserrat",
                selectedAmount === amount && "bg-primary text-primary-foreground"
              )}
            >
              {amount}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default AmountSelector;
