
import React from 'react';
import { MaterialSize } from '@/services/productTypes';
import { cn } from "@/lib/utils";

type SizeSelectorProps = {
  selectedSize: MaterialSize;
  setSelectedSize: (size: MaterialSize) => void;
  availableSizes?: MaterialSize[]; // New prop for available sizes
};

const SizeSelector: React.FC<SizeSelectorProps> = ({
  selectedSize,
  setSelectedSize,
  availableSizes // New prop
}) => {
  // Default sizes if none provided, matching the standard sizes in the database
  const defaultSizes: MaterialSize[] = ['3/8"', '3/4"', '1"', '1½"', '2-3"'];
  
  // Use available sizes if provided, otherwise fall back to defaults
  const sizes = availableSizes && availableSizes.length > 0 ? availableSizes : defaultSizes;
  
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Material Size</h3>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {sizes.map(size => (
          <button
            key={size}
            onClick={() => setSelectedSize(size)}
            className={cn(
              "px-3 py-2 rounded-md border text-sm transition-colors text-center",
              selectedSize === size 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
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
