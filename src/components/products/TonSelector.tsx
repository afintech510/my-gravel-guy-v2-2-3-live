
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TonSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  tonYardRatio?: number;
}

const TonSelector = ({ value, onValueChange, tonYardRatio = 1.2 }: TonSelectorProps) => {
  // First row amounts
  const firstRowAmounts = ["3", "5", "7", "10"];
  // Second row amounts
  const secondRowAmounts = ["12", "15", "20", "23"];
  // Third row amounts
  const thirdRowAmounts = ["25", "30", "35", "40"];
  
  // Define increment buttons for each row
  const rowIncrements = [
    { label: "+1", amount: 1 },
    { label: "+5", amount: 5 },
    { label: "+10", amount: 10 },
  ];
  
  const selectedTons = parseInt(value);
  const yards = tonYardRatio ? (selectedTons / tonYardRatio).toFixed(1) : "N/A";

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Amount</label>
      
      <div className="grid grid-cols-5 gap-2">
        {/* First row */}
        {firstRowAmounts.map((tons) => (
          <Button 
            key={tons} 
            variant="outline"
            size="sm"
            onClick={() => onValueChange(tons)}
            className={cn(
              "h-10 min-w-[2.5rem]",
              value === tons && "bg-primary text-primary-foreground"
            )}
          >
            {tons}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onValueChange((parseInt(value) + rowIncrements[0].amount).toString())}
          className="h-10 min-w-[2.5rem]"
        >
          {rowIncrements[0].label}
        </Button>
        
        {/* Second row */}
        {secondRowAmounts.map((tons) => (
          <Button 
            key={tons} 
            variant="outline"
            size="sm"
            onClick={() => onValueChange(tons)}
            className={cn(
              "h-10 min-w-[2.5rem]",
              value === tons && "bg-primary text-primary-foreground"
            )}
          >
            {tons}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onValueChange((parseInt(value) + rowIncrements[1].amount).toString())}
          className="h-10 min-w-[2.5rem]"
        >
          {rowIncrements[1].label}
        </Button>
        
        {/* Third row */}
        {thirdRowAmounts.map((tons) => (
          <Button 
            key={tons} 
            variant="outline"
            size="sm"
            onClick={() => onValueChange(tons)}
            className={cn(
              "h-10 min-w-[2.5rem]",
              value === tons && "bg-primary text-primary-foreground"
            )}
          >
            {tons}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onValueChange((parseInt(value) + rowIncrements[2].amount).toString())}
          className="h-10 min-w-[2.5rem]"
        >
          {rowIncrements[2].label}
        </Button>
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>{selectedTons} tons</span>
        <span>≈ {yards} cubic yards</span>
      </div>
      
      <h1 className="text-4xl font-bold mt-4">{selectedTons} tons</h1>
    </div>
  );
};

export default TonSelector;
