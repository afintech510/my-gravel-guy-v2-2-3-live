
import React from 'react';
import { Slider } from '@/components/ui/slider';

type ExtraSliderProps = {
  extraPercentage: number;
  setExtraPercentage: (percentage: number) => void;
};

const ExtraSlider: React.FC<ExtraSliderProps> = ({ extraPercentage, setExtraPercentage }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <label className="text-sm font-medium">Order Extra for Compaction</label>
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
  );
};

export default ExtraSlider;
