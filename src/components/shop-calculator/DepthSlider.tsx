
import React from 'react';
import { Slider } from '@/components/ui/slider';

type DepthSliderProps = {
  depth: number;
  setDepth: (depth: number) => void;
};

const DepthSlider: React.FC<DepthSliderProps> = ({ depth, setDepth }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-sm font-medium">Material Depth</label>
        <span className="text-sm font-bold">{depth} inches</span>
      </div>
      <Slider
        value={[depth]}
        onValueChange={([value]) => setDepth(value)}
        min={1}
        max={36}
        step={1}
        className="[&>.relative>.absolute]:bg-green-500"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>1"</span>
        <span>36"</span>
      </div>
    </div>
  );
};

export default DepthSlider;
