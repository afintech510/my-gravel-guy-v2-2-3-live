
import React from 'react';
import { MaterialSize } from './ShopCalculator';

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
    <div className="flex flex-wrap gap-2">
      {sizes.map(size => (
        <button
          key={size}
          onClick={() => setSelectedSize(size)}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedSize === size 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {size}
        </button>
      ))}
    </div>
  );
};

export default SizeSelector;
