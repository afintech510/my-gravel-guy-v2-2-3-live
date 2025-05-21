
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useCalculator } from "@/hooks/useCalculator";

interface MiniCalculatorProps {
  onQuantityCalculated: (tons: number) => void;
  pricePerTon: number;
}

const MiniCalculator = ({ onQuantityCalculated, pricePerTon }: MiniCalculatorProps) => {
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [depth, setDepth] = useState<number>(2); // Default 2 inches
  const [extraPercentage, setExtraPercentage] = useState<number>(10); // Default 10% extra
  
  const { totalSquareFeet, totalCubicYards, totalTons } = useCalculator(
    [{ length, width }],
    depth,
    extraPercentage,
    pricePerTon
  );

  const handleCalculate = () => {
    // Round to integer value
    onQuantityCalculated(Math.round(totalTons));
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-50 p-4 border-b">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          <h3 className="font-semibold">Calculate Amount Needed</h3>
        </div>
      </div>
      
      <div className="p-4 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm mb-1 block">Length (feet)</label>
            <Input
              type="number"
              min="0"
              value={length || ''}
              onChange={(e) => setLength(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-sm mb-1 block">Width (feet)</label>
            <Input
              type="number"
              min="0"
              value={width || ''}
              onChange={(e) => setWidth(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm">Depth (inches)</label>
            <span className="text-sm font-semibold">{depth}</span>
          </div>
          <Slider
            value={[depth]}
            onValueChange={([value]) => setDepth(value)}
            min={1}
            max={24}
            step={1}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>1"</span>
            <span>12"</span>
            <span>24"</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm">Order Extra %</label>
            <span className="text-sm font-semibold">{extraPercentage}%</span>
          </div>
          <Slider
            value={[extraPercentage]}
            onValueChange={([value]) => setExtraPercentage(value)}
            min={0}
            max={30}
            step={1}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>0%</span>
            <span>15%</span>
            <span>30%</span>
          </div>
        </div>

        {totalSquareFeet > 0 && (
          <div className="py-3 space-y-1">
            <p className="text-sm text-gray-600">Results:</p>
            <p className="text-base"><strong>{Math.round(totalSquareFeet)}</strong> sq ft</p>
            <p className="text-base"><strong>{totalCubicYards.toFixed(2)}</strong> cu yards</p>
            <p className="text-base"><strong>{Math.round(totalTons)}</strong> tons</p>
          </div>
        )}

        <Button 
          onClick={handleCalculate} 
          className="w-full"
        >
          Use This Amount
        </Button>
      </div>
    </div>
  );
};

export default MiniCalculator;
