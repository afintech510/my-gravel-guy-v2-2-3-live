
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';

interface AreaCalculatorProps {
  areas: Array<{length: number, width: number}>;
  setAreas: React.Dispatch<React.SetStateAction<Array<{length: number, width: number}>>>;
  depth: number;
  setDepth: React.Dispatch<React.SetStateAction<number>>;
  extraPercentage: number;
  setExtraPercentage: React.Dispatch<React.SetStateAction<number>>;
  calculationResult: {
    totalSquareFeet: number;
    totalCubicYards: number;
    totalTons: number;
  };
}

export default function AreaCalculator({
  areas,
  setAreas,
  depth,
  setDepth,
  extraPercentage,
  setExtraPercentage,
  calculationResult
}: AreaCalculatorProps) {
  // Add a new area
  const handleAddArea = () => {
    setAreas([...areas, { length: 10, width: 10 }]);
  };

  // Remove an area
  const handleRemoveArea = (index: number) => {
    if (areas.length > 1) {
      setAreas(areas.filter((_, i) => i !== index));
    }
  };

  // Update area dimensions
  const updateAreaDimension = (index: number, dimension: 'length' | 'width', value: number) => {
    const newAreas = [...areas];
    newAreas[index] = {
      ...newAreas[index],
      [dimension]: value
    };
    setAreas(newAreas);
  };

  return (
    <div className="space-y-6">
      {/* Area inputs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Project Areas</h3>
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
            <span className="text-gray-500">×</span>
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

      {/* Depth slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <h3 className="text-sm font-medium text-gray-700">Material Depth</h3>
          <span className="text-sm font-bold">{depth} inches</span>
        </div>
        <Slider
          value={[depth]}
          onValueChange={([value]) => setDepth(value)}
          min={1}
          max={24}
          step={1}
          className="[&>.relative>.absolute]:bg-primary"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>1"</span>
          <span>24"</span>
        </div>
      </div>

      {/* Extra percentage slider */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <h3 className="text-sm font-medium text-gray-700">Order Extra for Compaction</h3>
          <span className="text-sm font-bold">{extraPercentage}%</span>
        </div>
        <Slider
          value={[extraPercentage]}
          onValueChange={([value]) => setExtraPercentage(value)}
          min={0}
          max={30}
          step={1}
          className="[&>.relative>.absolute]:bg-primary"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0%</span>
          <span>30%</span>
        </div>
      </div>

      {/* Results display */}
      <Card className="p-4 bg-gray-50 mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Calculation Results</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Total Area</p>
            <p className="text-lg font-medium">{calculationResult.totalSquareFeet} ft²</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Cubic Yards</p>
            <p className="text-lg font-medium">{calculationResult.totalCubicYards.toFixed(2)} yd³</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tons Needed</p>
            <p className="text-lg font-medium">{calculationResult.totalTons.toFixed(2)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
