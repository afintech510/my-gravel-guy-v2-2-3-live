import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Calculator, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useCalculator } from '@/hooks/useCalculator';

interface LandingAreaCalculatorProps {
  onCalculationChange: (result: { totalTons: number; totalCubicYards: number; totalSquareFeet: number }) => void;
  selectedMaterial?: { tonYardRatio?: number } | null;
  onClose?: () => void;
}

export const LandingAreaCalculator = ({ onCalculationChange, selectedMaterial, onClose }: LandingAreaCalculatorProps) => {
  const [areas, setAreas] = useState<Array<{ length: number; width: number }>>([
    { length: 10, width: 10 }
  ]);
  const [depth, setDepth] = useState<number>(2);
  const [extraPercentage, setExtraPercentage] = useState<number>(10);

  const tonYardRatio = selectedMaterial?.tonYardRatio || 1.5;
  const calculationResult = useCalculator(areas, depth, extraPercentage, 0, tonYardRatio);

  // Update parent component when calculation changes
  React.useEffect(() => {
    onCalculationChange(calculationResult);
  }, [calculationResult, onCalculationChange]);

  const handleAddArea = () => {
    setAreas([...areas, { length: 10, width: 10 }]);
  };

  const handleRemoveArea = (index: number) => {
    if (areas.length > 1) {
      setAreas(areas.filter((_, i) => i !== index));
    }
  };

  const updateAreaDimension = (index: number, dimension: 'length' | 'width', value: number) => {
    const newAreas = [...areas];
    newAreas[index] = {
      ...newAreas[index],
      [dimension]: value
    };
    setAreas(newAreas);
  };

  const handleUseCalculatedAmount = () => {
    // This will be handled by the parent component through onCalculationChange
    if (onClose) {
      onClose();
    }
  };

  return (
    <Card id="material-calculator" className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl">Material Calculator</CardTitle>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Calculate exactly how much material you need for your project areas
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Project Areas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Project Areas</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleAddArea}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Area
            </Button>
          </div>

          {areas.map((area, index) => (
            <div key={index} className="flex gap-2 items-center">
              <div className="flex-1">
                <Input
                  type="number"
                  min="1"
                  value={area.length}
                  onChange={(e) => updateAreaDimension(index, 'length', parseInt(e.target.value) || 0)}
                  className="h-9"
                  placeholder="Length (ft)"
                />
              </div>
              <span className="text-muted-foreground">×</span>
              <div className="flex-1">
                <Input
                  type="number"
                  min="1"
                  value={area.width}
                  onChange={(e) => updateAreaDimension(index, 'width', parseInt(e.target.value) || 0)}
                  className="h-9"
                  placeholder="Width (ft)"
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => handleRemoveArea(index)}
                disabled={areas.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Depth Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-foreground">Material Depth</h3>
            <Badge variant="secondary">{depth} inches</Badge>
          </div>
          <Slider
            value={[depth]}
            onValueChange={([value]) => setDepth(value)}
            min={1}
            max={24}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>1"</span>
            <span>24"</span>
          </div>
        </div>

        {/* Extra Percentage Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <h3 className="text-sm font-medium text-foreground">Order Extra for Compaction</h3>
            <Badge variant="secondary">{extraPercentage}%</Badge>
          </div>
          <Slider
            value={[extraPercentage]}
            onValueChange={([value]) => setExtraPercentage(value)}
            min={0}
            max={30}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>0%</span>
            <span>30%</span>
          </div>
        </div>

        {/* Results Display */}
        <Card className="p-4 bg-muted/50">
          <h3 className="text-sm font-medium text-foreground mb-3">Calculation Results</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total Area</p>
              <p className="text-lg font-medium">{calculationResult.totalSquareFeet} ft²</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Cubic Yards</p>
              <p className="text-lg font-medium">{calculationResult.totalCubicYards.toFixed(2)} yd³</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Est. Tons</p>
              <p className="text-2xl font-bold text-primary">{calculationResult.totalTons.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        {/* Use Calculated Amount Button */}
        <Button
          onClick={handleUseCalculatedAmount}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size="lg"
        >
          Use {calculationResult.totalTons.toFixed(2)} Tons in Quote
        </Button>
      </CardContent>
    </Card>
  );
};