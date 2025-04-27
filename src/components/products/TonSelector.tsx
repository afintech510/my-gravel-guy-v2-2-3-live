
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface TonSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

const TonSelector = ({ value, onValueChange }: TonSelectorProps) => {
  const tonOptions = ["3", "5", "7", "10", "14"];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Quantity (tons)</label>
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
    </div>
  );
};

export default TonSelector;
