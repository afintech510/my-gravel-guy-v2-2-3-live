
import React from 'react';
import { Button } from "@/components/ui/button";
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
  // First row amounts
  const firstRowAmounts = [3, 5, 7, 10];
  // Second row amounts
  const secondRowAmounts = [12, 15, 20, 23];
  // Third row amounts
  const thirdRowAmounts = [25, 30, 35, 40];
  
  // Define increment buttons for each row
  const rowIncrements = [
    { label: "+1", amount: 1 },
    { label: "+5", amount: 5 },
    { label: "+10", amount: 10 },
  ];
  
  return (
    <div className="space-y-6 font-montserrat">
      <label className="text-sm font-medium">Select Amount (tons)</label>
      
      <div className="grid grid-cols-5 gap-2">
        {/* First row */}
        {firstRowAmounts.map((amount) => (
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
          onClick={() => onSelectAmount(selectedAmount + rowIncrements[0].amount)}
          className="h-10 min-w-[2.5rem] font-montserrat"
        >
          {rowIncrements[0].label}
        </Button>
        
        {/* Second row */}
        {secondRowAmounts.map((amount) => (
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
          onClick={() => onSelectAmount(selectedAmount + rowIncrements[1].amount)}
          className="h-10 min-w-[2.5rem] font-montserrat"
        >
          {rowIncrements[1].label}
        </Button>
        
        {/* Third row */}
        {thirdRowAmounts.map((amount) => (
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
          onClick={() => onSelectAmount(selectedAmount + rowIncrements[2].amount)}
          className="h-10 min-w-[2.5rem] font-montserrat"
        >
          {rowIncrements[2].label}
        </Button>
      </div>
      
      <div className="mt-4">
        <h1 className="text-5xl font-bold">{selectedAmount} tons</h1>
      </div>
    </div>
  );
};

export default AmountSelector;
