
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface TonSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  tonYardRatio?: number;
}

const TonSelector = ({ value, onValueChange, tonYardRatio = 1.2 }: TonSelectorProps) => {
  const tonOptions = ["3", "5", "7", "10", "14"];
  const selectedTons = parseInt(value);
  const yards = tonYardRatio ? (selectedTons / tonYardRatio).toFixed(1) : "N/A";

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Amount</label>
      <ToggleGroup 
        type="single" 
        value={value} 
        onValueChange={onValueChange}
        className="justify-start"
      >
        {tonOptions.map((tons) => (
          <ToggleGroupItem 
            key={tons} 
            value={tons}
            className="px-6 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {tons}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{selectedTons} tons</span>
        <span>≈ {yards} cubic yards</span>
      </div>
    </div>
  );
};

export default TonSelector;
