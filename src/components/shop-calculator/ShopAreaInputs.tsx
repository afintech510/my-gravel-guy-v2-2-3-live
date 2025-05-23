
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Area {
  length: number;
  width: number;
}

interface ShopAreaInputsProps {
  areas: Area[];
  setAreas: React.Dispatch<React.SetStateAction<Area[]>>;
}

const ShopAreaInputs: React.FC<ShopAreaInputsProps> = ({ areas, setAreas }) => {
  const addArea = () => {
    setAreas([...areas, { length: 10, width: 10 }]);
  };

  const removeArea = (index: number) => {
    if (areas.length > 1) {
      setAreas(areas.filter((_, i) => i !== index));
    }
  };

  const updateArea = (index: number, field: 'length' | 'width', value: number) => {
    const newAreas = [...areas];
    newAreas[index][field] = value;
    setAreas(newAreas);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium">Project Dimensions</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addArea}
          className="text-xs"
        >
          Add Area
        </Button>
      </div>

      {areas.map((area, index) => (
        <div key={index} className="mb-4 p-3 border rounded-md bg-gray-50">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-500">Area {index + 1}</span>
            {areas.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeArea(index)}
                className="h-6 w-6"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Length (ft)</label>
              <Input
                type="number"
                min="1"
                value={area.length}
                onChange={(e) => updateArea(index, 'length', parseInt(e.target.value) || 0)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Width (ft)</label>
              <Input
                type="number"
                min="1"
                value={area.width}
                onChange={(e) => updateArea(index, 'width', parseInt(e.target.value) || 0)}
                className="h-9 text-sm"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ShopAreaInputs;
