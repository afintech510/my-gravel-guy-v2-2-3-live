
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ZipCodeSearch from '@/components/zip-code/ZipCodeSearch';

type ZipCodeSectionProps = {
  zipCode: string | null;
  validateZipCodeAndGetPrice: (zipCode: string) => Promise<boolean>;
  totalTons: number;
  handleTonsChange: (tons: number) => void;
  estimatedCost: number;
  discountedCost: number;
  onAddToCart: () => void;
  zipCodeValid: boolean;
  discountApplied: boolean;
};

const ZipCodeSection: React.FC<ZipCodeSectionProps> = ({
  zipCode,
  validateZipCodeAndGetPrice,
  totalTons,
  handleTonsChange,
  estimatedCost,
  discountedCost,
  onAddToCart,
  zipCodeValid,
  discountApplied
}) => {
  const [inputZip, setInputZip] = useState(zipCode || '');
  
  // Round to nearest integer for display and calculations
  const roundedTons = Math.round(totalTons);
  
  // Calculate sale price based on per-ton price and rounded tons
  const perTonPrice = estimatedCost / totalTons;
  const perTonDiscountedPrice = discountedCost / totalTons;
  
  // Calculate final prices using the rounded tons value
  const actualEstimatedCost = perTonPrice * roundedTons;
  const actualDiscountedCost = perTonDiscountedPrice * roundedTons;
  
  const handleZipCodeSelected = () => {
    if (zipCode) {
      validateZipCodeAndGetPrice(zipCode);
    }
  };

  const adjustTons = (amount: number) => {
    const newTons = Math.max(1, roundedTons + amount);
    handleTonsChange(newTons);
  };

  return (
    <div className="border-2 border-primary rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Delivery ZIP Code</label>
          <div className="flex space-x-2">
            <div className="relative flex-grow">
              <ZipCodeSearch 
                onZipCodeSelected={handleZipCodeSelected}
                className="w-full" 
                variant="minimal"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Total Tons</label>
          <div className="flex items-center">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => adjustTons(-1)}
              className="h-10 w-10 rounded-full"
              disabled={roundedTons <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min="1"
              value={roundedTons}
              onChange={(e) => handleTonsChange(parseInt(e.target.value) || 1)}
              className="h-10 mx-2 text-center"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => adjustTons(1)}
              className="h-10 w-10 rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <div className="flex items-end gap-2">
            <div>
              <p className="text-sm text-black">Sale Price</p>
              {discountApplied ? (
                <>
                  <p className="text-3xl font-bold text-black line-through">${actualEstimatedCost.toFixed(2)}</p>
                  <p className="text-3xl font-bold text-black">Discount Price: ${actualDiscountedCost.toFixed(2)}</p>
                </>
              ) : (
                <p className="text-3xl font-bold text-black">${actualEstimatedCost.toFixed(2)}</p>
              )}
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button 
            onClick={onAddToCart}
            size="lg"
            disabled={!zipCode}
            className="px-8"
          >
            Add to Cart
          </Button>
          <p className="text-xs font-semibold text-black mt-1">FREE SHIPPING!!</p>
        </div>
      </div>
    </div>
  );
};

export default ZipCodeSection;
