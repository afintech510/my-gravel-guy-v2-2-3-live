
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calculator } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useCalculator } from "@/hooks/useCalculator";

interface MiniCalculatorProps {
  onQuantityCalculated: (tons: number) => void;
  pricePerTon: number;
  tonYardRatio?: number;
  onPriceUpdate?: (tons: number) => void;
  currentTons?: number; // Add currentTons prop to sync with external state
}

const MiniCalculator = ({ 
  onQuantityCalculated, 
  pricePerTon,
  tonYardRatio = 1.5, // Default if not provided
  onPriceUpdate,
  currentTons
}: MiniCalculatorProps) => {
  const [length, setLength] = useState<number>(0);
  const [width, setWidth] = useState<number>(0);
  const [depth, setDepth] = useState<number>(2); // Default 2 inches
  const [extraPercentage, setExtraPercentage] = useState<number>(10); // Default 10% extra
  
  const { totalSquareFeet, totalCubicYards, totalTons } = useCalculator(
    [{ length, width }],
    depth,
    extraPercentage,
    pricePerTon,
    tonYardRatio
  );

  // Sync with external tons value when it changes
  useEffect(() => {
    // Only update prices when totalTons is significant (user has entered dimensions)
    if (totalTons > 0 && onPriceUpdate) {
      onPriceUpdate(Math.round(totalTons));
    }
  }, [totalTons, onPriceUpdate]);

  const handleCalculate = () => {
    // Don't calculate if no dimensions entered
    if (length <= 0 || width <= 0) {
      return;
    }
    
    // Round to integer value
    const roundedTons = Math.round(totalTons);
    onQuantityCalculated(roundedTons);
    
    // Also update the price if the callback exists
    if (onPriceUpdate) {
      onPriceUpdate(roundedTons);
    }
  };

  return (
    <div className="border rounded-lg overflow-hidden font-montserrat">
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
          <div className="py-3 bg-gray-50 rounded-md p-3">
            <p className="text-sm text-gray-600 mb-2">Results:</p>
            <div className="flex justify-between items-end">
              <div className="text-center">
                <span className="text-xl font-bold">{Math.round(totalSquareFeet)}</span>
                <span className="text-xs block text-gray-500">sq ft</span>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold">{Math.round(totalTons)}</span>
                <span className="text-xs block text-gray-500">tons</span>
              </div>
              <div className="text-center">
                <span className="text-xl font-bold">{totalCubicYards.toFixed(2)}</span>
                <span className="text-xs block text-gray-500">cu yards</span>
              </div>
            </div>
            {pricePerTon > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Estimated Total:</span>
                  <span className="font-bold">${(pricePerTon * Math.round(totalTons)).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Price per ton:</span>
                  <span>${pricePerTon.toFixed(2)}/ton</span>
                </div>
              </div>
            )}
          </div>
        )}

        <Button 
          onClick={handleCalculate} 
          className="w-full font-montserrat"
          disabled={length <= 0 || width <= 0}
        >
          Use This Amount
        </Button>
      </div>
    </div>
  );
};

export default MiniCalculator;
