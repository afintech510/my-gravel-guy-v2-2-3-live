
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface AreaDimensions {
  length: number;
  width: number;
  depth: number;
  extra: number;
}

interface ShopAreaInputsProps {
  dimensions: AreaDimensions;
  onDimensionsChange: React.Dispatch<React.SetStateAction<AreaDimensions>>;
}

const ShopAreaInputs: React.FC<ShopAreaInputsProps> = ({ dimensions, onDimensionsChange }) => {
  const updateDimension = (field: keyof AreaDimensions, value: number) => {
    onDimensionsChange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-sm font-medium">Project Dimensions</h3>
      </div>

      <div className="p-3 border rounded-md bg-gray-50">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Length (ft)</label>
            <Input
              type="number"
              min="1"
              value={dimensions.length}
              onChange={(e) => updateDimension('length', parseInt(e.target.value) || 0)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Width (ft)</label>
            <Input
              type="number"
              min="1"
              value={dimensions.width}
              onChange={(e) => updateDimension('width', parseInt(e.target.value) || 0)}
              className="h-9 text-sm"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Depth (inches)</label>
            <Input
              type="number"
              min="0.5"
              step="0.5"
              value={dimensions.depth}
              onChange={(e) => updateDimension('depth', parseFloat(e.target.value) || 0)}
              className="h-9 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Extra (%) for waste</label>
            <Input
              type="number"
              min="0"
              max="30"
              value={dimensions.extra}
              onChange={(e) => updateDimension('extra', parseInt(e.target.value) || 0)}
              className="h-9 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopAreaInputs;
