
import React from 'react';
import { MaterialSize } from './ShopCalculator';
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';

type SizeSelectorProps = {
  selectedSize: MaterialSize;
  setSelectedSize: (size: MaterialSize) => void;
};

const SizeSelector: React.FC<SizeSelectorProps> = ({
  selectedSize,
  setSelectedSize
}) => {
  const sizes: MaterialSize[] = ['3/8"', '3/4"', '1"', '1½"', '2-3"'];
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-4">
      {/* Size buttons with improved layout and styling for mobile */}
      <div className={cn(
        "flex gap-2",
        isMobile ? "flex-wrap justify-center" : "justify-between"
      )}>
        {sizes.map(size => (
          <button
            key={size}
            onClick={() => setSelectedSize(size)}
            className={cn(
              "px-4 py-2 rounded-lg transition-colors font-montserrat font-bold",
              selectedSize === size 
                ? 'bg-primary text-black' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
              isMobile ? "flex-grow min-w-[30%] text-sm" : "text-base" 
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
