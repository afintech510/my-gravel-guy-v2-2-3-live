
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus } from 'lucide-react';

type AreaInput = {
  length: number;
  width: number;
};

interface AreaInputsProps {
  areas: AreaInput[];
  onAreaChange: (areas: AreaInput[]) => void;
}

const AreaInputs = ({ areas, onAreaChange }: AreaInputsProps) => {
  const addArea = () => {
    onAreaChange([...areas, { length: 10, width: 10 }]);
  };

  const removeArea = (index: number) => {
    if (areas.length > 1) {
      onAreaChange(areas.filter((_, i) => i !== index));
    }
  };

  const updateArea = (index: number, field: 'length' | 'width', value: number) => {
    const newAreas = [...areas];
    newAreas[index] = { ...newAreas[index], [field]: value };
    onAreaChange(newAreas);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Project Areas</h3>
      {areas.map((area, index) => (
        <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
          <div className="flex-1 grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Length (ft)</label>
              <Input
                type="number"
                value={area.length}
                onChange={(e) => updateArea(index, 'length', Number(e.target.value))}
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Width (ft)</label>
              <Input
                type="number"
                value={area.width}
                onChange={(e) => updateArea(index, 'width', Number(e.target.value))}
                min="0"
              />
            </div>
          </div>
          {areas.length > 1 && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => removeArea(index)}
            >
              <Minus className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button variant="outline" onClick={addArea} className="w-full">
        <Plus className="h-4 w-4 mr-2" />
        Add Another Area
      </Button>
    </div>
  );
};

export default AreaInputs;
