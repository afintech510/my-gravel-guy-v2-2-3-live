
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Check } from 'lucide-react';
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
};

const ZipCodeSection: React.FC<ZipCodeSectionProps> = ({
  zipCode,
  validateZipCodeAndGetPrice,
  totalTons,
  handleTonsChange,
  estimatedCost,
  discountedCost,
  onAddToCart,
  zipCodeValid
}) => {
  const [inputZip, setInputZip] = useState(zipCode || '');
  
  const handleZipCodeSelected = () => {
    if (zipCode) {
      validateZipCodeAndGetPrice(zipCode);
    }
  };

  const handleCheckZipCode = async () => {
    if (inputZip && inputZip.length >= 5) {
      await validateZipCodeAndGetPrice(inputZip);
    }
  };

  const adjustTons = (amount: number) => {
    const currentTons = Math.floor(totalTons);
    const newTons = Math.max(1, currentTons + amount);
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
              {zipCodeValid && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              )}
            </div>
            <Button 
              onClick={handleCheckZipCode}
              disabled={!inputZip || inputZip.length < 5}
              className="whitespace-nowrap"
            >
              Check
            </Button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Total Tons</label>
          <div className="flex items-center">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => adjustTons(-1)}
              className="h-10 px-3 rounded-r-none"
              disabled={Math.floor(totalTons) <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              min="1"
              value={Math.floor(totalTons)}
              onChange={(e) => handleTonsChange(parseInt(e.target.value) || 1)}
              className="h-10 text-center rounded-none border-x-0"
            />
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => adjustTons(1)}
              className="h-10 px-3 rounded-l-none"
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
              <p className="text-sm text-gray-500">Original Price</p>
              <p className="text-2xl font-bold line-through text-gray-400">${estimatedCost.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-primary">Your Price</p>
              <p className="text-3xl font-bold text-primary">${discountedCost.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Button 
            onClick={onAddToCart}
            size="lg"
            disabled={!zipCodeValid}
            className="px-8"
          >
            Add to Cart
          </Button>
          <p className="text-xs font-semibold text-primary mt-1">FREE SHIPPING!!</p>
        </div>
      </div>
    </div>
  );
};

export default ZipCodeSection;
