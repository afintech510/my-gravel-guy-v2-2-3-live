
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";
import { useCalculator } from "@/hooks/useCalculator";

interface MiniCalculatorProps {
  onQuantityCalculated: (tons: number) => void;
  pricePerTon: number;
}

const MiniCalculator = ({ onQuantityCalculated, pricePerTon }: MiniCalculatorProps) => {
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [depth, setDepth] = useState<number>(2); // Default 2 inches
  
  const { totalTons } = useCalculator(
    [{ length, width }],
    depth,
    10, // Extra percentage
    pricePerTon
  );

  const handleCalculate = () => {
    // Round to integer value
    onQuantityCalculated(Math.round(totalTons));
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Calculator className="h-5 w-5" />
        <h3>Calculate Amount Needed</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm">Length (feet)</label>
          <Input
            type="number"
            min="0"
            value={length || ''}
            onChange={(e) => setLength(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-sm">Width (feet)</label>
          <Input
            type="number"
            min="0"
            value={width || ''}
            onChange={(e) => setWidth(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="text-sm">Depth (inches)</label>
          <Input
            type="number"
            min="1"
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
          />
        </div>
      </div>

      {totalTons > 0 && (
        <p className="text-sm">
          Estimated amount needed: <strong>{Math.round(totalTons)} tons</strong>
        </p>
      )}

      <Button onClick={handleCalculate} className="w-full">
        Use This Amount
      </Button>
    </div>
  );
};

export default MiniCalculator;
