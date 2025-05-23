
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

interface AreaInput {
  length: number;
  width: number;
}

interface AreaInputsProps {
  areas: AreaInput[];
  onAreaChange: (areas: AreaInput[]) => void;
}

const AreaInputs = ({ areas, onAreaChange }: AreaInputsProps) => {
  const updateAreaValue = (index: number, field: keyof AreaInput, value: string) => {
    const newValue = parseFloat(value) || 0;
    const newAreas = [...areas];
    newAreas[index] = { ...newAreas[index], [field]: newValue };
    onAreaChange(newAreas);
  };

  const addArea = () => {
    onAreaChange([...areas, { length: 10, width: 10 }]);
  };

  const removeArea = (index: number) => {
    if (areas.length > 1) {
      const newAreas = areas.filter((_, i) => i !== index);
      onAreaChange(newAreas);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Areas to Cover</h3>
      {areas.map((area, index) => (
        <div key={index} className="flex gap-4 items-center">
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Length (ft)"
              value={area.length}
              onChange={(e) => updateAreaValue(index, 'length', e.target.value)}
              step="0.1"
              min="0"
            />
          </div>
          <div className="flex-1">
            <Input
              type="number"
              placeholder="Width (ft)"
              value={area.width}
              onChange={(e) => updateAreaValue(index, 'width', e.target.value)}
              step="0.1"
              min="0"
            />
          </div>
          <div className="flex gap-2">
            {areas.length > 1 && index !== 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeArea(index)}
                type="button"
              >
                <Minus className="h-4 w-4" />
              </Button>
            )}
            {index === 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={addArea}
                type="button"
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AreaInputs;
