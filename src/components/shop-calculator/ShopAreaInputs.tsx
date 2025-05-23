
import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import DepthSlider from './DepthSlider';
import ExtraSlider from './ExtraSlider';

export interface Area {
  length: number;
  width: number;
}

export interface AreaDimensions {
  areas: Area[];
  depth: number;
  extra: number;
}

interface ShopAreaInputsProps {
  dimensions: AreaDimensions;
  onDimensionsChange: React.Dispatch<React.SetStateAction<AreaDimensions>>;
}

const ShopAreaInputs: React.FC<ShopAreaInputsProps> = ({ dimensions, onDimensionsChange }) => {
  const updateDimension = (field: 'depth' | 'extra', value: number) => {
    onDimensionsChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateArea = (index: number, field: keyof Area, value: number) => {
    const newAreas = [...dimensions.areas];
    newAreas[index] = { ...newAreas[index], [field]: value };
    onDimensionsChange(prev => ({
      ...prev,
      areas: newAreas
    }));
  };

  const addArea = () => {
    onDimensionsChange(prev => ({
      ...prev,
      areas: [...prev.areas, { length: 10, width: 10 }]
    }));
  };

  const removeArea = (index: number) => {
    if (dimensions.areas.length > 1) {
      const newAreas = dimensions.areas.filter((_, i) => i !== index);
      onDimensionsChange(prev => ({
        ...prev,
        areas: newAreas
      }));
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-medium">Project Dimensions</h3>
      </div>

      <div className="p-3 border rounded-md bg-gray-50">
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Areas to Cover</p>
          {dimensions.areas.map((area, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <div className="flex-1">
                <Input
                  type="number"
                  min="1"
                  value={area.length}
                  onChange={(e) => updateArea(index, 'length', parseInt(e.target.value) || 0)}
                  className="h-9 text-sm"
                  placeholder="Length (ft)"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  min="1"
                  value={area.width}
                  onChange={(e) => updateArea(index, 'width', parseInt(e.target.value) || 0)}
                  className="h-9 text-sm"
                  placeholder="Width (ft)"
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9"
                onClick={() => dimensions.areas.length > 1 ? removeArea(index) : null}
                disabled={dimensions.areas.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addArea}
            className="mt-1"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Area
          </Button>
        </div>
        
        <div className="space-y-6">
          <DepthSlider depth={dimensions.depth} setDepth={(value) => updateDimension('depth', value)} />
          <ExtraSlider extraPercentage={dimensions.extra} setExtraPercentage={(value) => updateDimension('extra', value)} />
        </div>
      </div>
    </div>
  );
};

export default ShopAreaInputs;
