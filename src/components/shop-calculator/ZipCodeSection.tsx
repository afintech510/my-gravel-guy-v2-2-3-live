
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CircleCheck, AlertTriangle, TrendingDown, Minus, Plus } from 'lucide-react';
import { useZipCode } from '@/contexts/ZipCodeContext';
import ZipCodeSearch from '../zip-code/ZipCodeSearch';

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

  useEffect(() => {
    // Update input value if zipCode changes from context
    if (zipCode) {
      setZipCodeInput(zipCode);
    }
  }, [zipCode]);

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

  // Handler for increasing/decreasing tons
  const adjustTons = (increment: number) => {
    const newValue = Math.max(1, totalTons + increment); // Ensure minimum of 1 ton
    handleTonsChange(newValue);
  };

  return (
    <Card className="bg-gray-50">
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left section - ZIP Code */}
          <div className="md:col-span-5">
            <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
            
            {/* Amount (tons) selector - Mobile version for small screens */}
            <div className="mb-6 md:hidden">
              <div className="flex items-center justify-between">
                <Label htmlFor="tons-mobile" className="font-bold text-lg">Amount</Label>
                <div className="flex items-center border rounded-lg bg-white overflow-hidden">
                  <Button 
                    type="button" 
                    variant="ghost"
                    size="icon"
                    className="rounded-none h-10 w-10 flex items-center justify-center focus:ring-0"
                    onClick={() => adjustTons(-1)}
                    disabled={totalTons <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <Input 
                    id="tons-mobile"
                    type="number"
                    min="1"
                    value={totalTons}
                    onChange={(e) => handleTonsChange(parseInt(e.target.value) || 1)}
                    className="w-16 text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  
                  <Button 
                    type="button"
                    variant="ghost"
                    size="icon" 
                    className="rounded-none h-10 w-10 flex items-center justify-center focus:ring-0"
                    onClick={() => adjustTons(1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                tons
              </div>
            </div>
            
            {/* ZIP Code Input - Using ZipCodeSearch component instead of raw input */}
            <div className="space-y-4">
              <Label htmlFor="zipCode" className="mb-1 block">Enter ZIP Code for Delivery</Label>
              <ZipCodeSearch 
                variant="minimal" 
                className="w-full"
                onZipCodeSelected={() => {
                  if (zipCode) {
                    validateZipCodeAndGetPrice(zipCode);
                  }
                }}
              />
              
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
          </div>
          
          {/* Right section - Price & Add to Cart */}
          <div className="md:col-span-7 space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="text-lg font-semibold">Price Summary</h3>
              
              {/* Amount (tons) selector - Desktop version */}
              <div className="hidden md:block">
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full h-8 w-8"
                    onClick={() => adjustTons(-1)}
                    disabled={totalTons <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-center">
                    <span className="text-3xl font-bold font-montserrat">{totalTons}</span>
                    <div className="text-xs text-muted-foreground mt-1">tons</div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="rounded-full h-8 w-8"
                    onClick={() => adjustTons(1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Price displays */}
            <div className="space-y-1 mt-4">
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
                className="w-full bg-green-500 hover:bg-green-600 text-white"
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
