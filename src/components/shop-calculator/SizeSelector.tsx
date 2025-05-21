
import React from 'react';
import { MaterialSize } from './ShopCalculator';
import { cn } from "@/lib/utils";

type SizeSelectorProps = {
  selectedSize: MaterialSize;
  setSelectedSize: (size: MaterialSize) => void;
};

const SizeSelector: React.FC<SizeSelectorProps> = ({
  selectedSize,
  setSelectedSize
}) => {
  const sizes: MaterialSize[] = ['3/8"', '3/4"', '1"', '1½"', '2-3"'];
  
  return (
    <div className="space-y-4">
      {/* Size buttons with improved layout and styling */}
      <div className="flex justify-between gap-2">
        {sizes.map(size => (
          <button
            key={size}
            onClick={() => setSelectedSize(size)}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors font-montserrat font-bold text-base",
              selectedSize === size 
                ? 'bg-green-500 text-black' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            )}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SizeSelector;
