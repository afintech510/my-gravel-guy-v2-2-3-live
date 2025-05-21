
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TonSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  tonYardRatio?: number;
}

const TonSelector = ({ value, onValueChange, tonYardRatio = 1.2 }: TonSelectorProps) => {
  const tonOptions = ["3", "5", "7", "10", "12", "15", "20", "23"];
  const selectedTons = parseInt(value);
  const yards = tonYardRatio ? (selectedTons / tonYardRatio).toFixed(1) : "N/A";

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Amount</label>
      
      <div className="grid grid-cols-5 gap-2">
        {tonOptions.map((tons) => (
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
          onClick={() => onValueChange((parseInt(value) + 1).toString())}
          className="h-10 min-w-[2.5rem]"
        >
          +1
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onValueChange((parseInt(value) + 5).toString())}
          className="h-10 min-w-[2.5rem]"
        >
          +5
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
