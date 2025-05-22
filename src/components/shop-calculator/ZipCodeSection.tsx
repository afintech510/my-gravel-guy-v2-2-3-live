
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleCheck, AlertTriangle, TrendingDown } from 'lucide-react';
import { useZipCode } from '@/contexts/ZipCodeContext';

interface ZipCodeSectionProps {
  zipCode: string | null;
  validateZipCodeAndGetPrice: (zipCode: string) => Promise<boolean>;
  totalTons: number;
  handleTonsChange: (tons: number) => void;
  estimatedCost: number;
  discountedCost: number;
  onAddToCart: () => void;
  zipCodeValid: boolean;
  discountApplied: boolean;
  originalCost?: number;
  savings?: number;
  appliedMultiplier?: number;
}

const ZipCodeSection = ({
  zipCode,
  validateZipCodeAndGetPrice,
  totalTons,
  handleTonsChange,
  estimatedCost,
  discountedCost,
  onAddToCart,
  zipCodeValid,
  discountApplied,
  originalCost,
  savings,
  appliedMultiplier
}: ZipCodeSectionProps) => {
  const { setZipCode } = useZipCode();
  const [zipCodeInput, setZipCodeInput] = useState(zipCode || '');
  const [validating, setValidating] = useState(false);

  const handleZipCodeUpdate = async () => {
    if (zipCodeInput.trim()) {
      setValidating(true);
      const isValid = await validateZipCodeAndGetPrice(zipCodeInput);
      if (isValid) {
        setZipCode(zipCodeInput);
      }
      setValidating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleZipCodeUpdate();
    }
  };

  // Format prices for display
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  };

  return (
    <Card className="bg-gray-50">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left section - ZIP Code */}
          <div className="md:col-span-5">
            <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
            
            <div className="space-y-4">
              {/* ZIP Code Input */}
              <div>
                <Label htmlFor="zipCode" className="mb-1 block">Enter ZIP Code for Delivery</Label>
                <div className="flex space-x-2">
                  <Input
                    id="zipCode"
                    type="text"
                    placeholder="ZIP Code"
                    value={zipCodeInput}
                    onChange={(e) => setZipCodeInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1"
                    maxLength={5}
                  />
                  <Button 
                    onClick={handleZipCodeUpdate}
                    disabled={validating}
                    variant="outline"
                  >
                    {validating ? 'Checking...' : 'Check'}
                  </Button>
                </div>
                
                {/* ZIP Code validation status */}
                {zipCode && (
                  <div className="mt-2 flex items-center">
                    {zipCodeValid ? (
                      <>
                        <CircleCheck className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm text-green-600">Delivery available to {zipCode}</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
                        <span className="text-sm text-amber-600">Delivery not available to this area</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Tons Input */}
              <div>
                <Label htmlFor="tons" className="mb-1 block">Amount (tons)</Label>
                <Input
                  id="tons"
                  type="number"
                  min="1"
                  value={totalTons}
                  onChange={(e) => handleTonsChange(parseInt(e.target.value) || 1)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          
          {/* Right section - Price & Add to Cart */}
          <div className="md:col-span-7 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Price Summary</h3>
            
            {/* Price displays */}
            <div className="space-y-1">
              {/* If volume discount is applied, show original price and discount */}
              {savings && savings > 0 && originalCost && (
                <>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Regular price:</span>
                    <span className="line-through">{formatPrice(originalCost)}</span>
                  </div>
                
                  <div className="flex justify-between text-sm">
                    <div className="flex items-center">
                      <TrendingDown className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-green-600">Volume discount ({(100 * (1 - (appliedMultiplier || 1))).toFixed(0)}%):</span>
                    </div>
                    <span className="text-green-600">-{formatPrice(savings)}</span>
                  </div>
                </>
              )}
              
              {/* Always show the current price */}
              <div className="flex justify-between text-lg font-semibold">
                <span>Total price:</span>
                <span>{formatPrice(estimatedCost)}</span>
              </div>
              
              {/* Show promotional discount if applied */}
              {discountApplied && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Promotional discount:</span>
                    <span className="text-green-600">-$50.00</span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold mt-2">
                    <span>Final price:</span>
                    <span>{formatPrice(discountedCost)}</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Add to Cart button */}
            <div className="pt-4">
              <Button 
                onClick={onAddToCart}
                disabled={!zipCodeValid}
                className="w-full"
                size="lg"
              >
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ZipCodeSection;
