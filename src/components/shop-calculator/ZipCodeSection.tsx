
import React, { useState, useEffect } from 'react';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { validateZipCode, getPriceForZipCode } from '@/services/productService';
import { Product } from '@/services/productTypes';
import TonSelector from '../products/TonSelector';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ZipCodeSectionProps {
  product: Product | null;
}

const ZipCodeSection: React.FC<ZipCodeSectionProps> = ({ product }) => {
  const { zipCode, setZipCode } = useZipCode();
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; inServiceArea: boolean }>({ 
    valid: false, 
    inServiceArea: false 
  });
  const [inputZip, setInputZip] = useState(zipCode || '');
  const [inServiceArea, setInServiceArea] = useState(false);
  const [priceAdjustment, setPriceAdjustment] = useState(0);
  const [selectedTons, setSelectedTons] = useState('10');
  const [basePrice, setBasePrice] = useState(0);
  const [adjustedPrice, setAdjustedPrice] = useState(0);
  const { toast } = useToast();

  // When product changes, update the base price
  useEffect(() => {
    if (product) {
      setBasePrice(product.price);
      console.log(`ZipCodeSection: Product changed to ${product.name}, price: $${product.price}/ton`);
    } else {
      // Default price if no product selected
      setBasePrice(46);
    }
  }, [product]);

  // Validate ZIP code whenever it changes
  useEffect(() => {
    if (!zipCode) return;
    
    const checkZipCode = async () => {
      setLoading(true);
      try {
        const result = await validateZipCode(zipCode);
        setValidation(result);
        setInServiceArea(result.inServiceArea);
        
        // Get price adjustment for this ZIP code
        if (result.inServiceArea) {
          const adjustment = result.priceAdjustment || 0;
          setPriceAdjustment(adjustment);
          console.log(`ZipCodeSection: ZIP code ${zipCode} has price adjustment: ${adjustment}%`);
        }
      } catch (error) {
        console.error('Error validating ZIP code:', error);
        setValidation({ valid: false, inServiceArea: false });
      } finally {
        setLoading(false);
      }
    };
    
    checkZipCode();
  }, [zipCode]);

  // Calculate adjusted price when base price, price adjustment, or quantity changes
  useEffect(() => {
    const adjustmentFactor = 1 + (priceAdjustment / 100);
    const pricePerTon = basePrice * adjustmentFactor;
    setAdjustedPrice(pricePerTon);
    console.log(`ZipCodeSection: Calculated price per ton: $${pricePerTon.toFixed(2)} (base: $${basePrice}, adjustment: ${priceAdjustment}%)`);
  }, [basePrice, priceAdjustment]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Handle ZIP code submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputZip.length >= 5) {
      setZipCode(inputZip);
    } else {
      toast({
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code.",
        variant: "destructive"
      });
    }
  };

  // Calculate total price
  const totalPrice = adjustedPrice * parseInt(selectedTons);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <h3 className="font-medium">Check Price & Delivery</h3>
      </div>
      <div className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <div className="flex-1">
            <label htmlFor="zipCode" className="block text-sm font-medium mb-1">Enter Delivery ZIP Code</label>
            <Input
              id="zipCode"
              type="text"
              value={inputZip}
              onChange={(e) => setInputZip(e.target.value.trim().slice(0, 5))}
              placeholder="Enter ZIP code"
              maxLength={5}
              pattern="[0-9]*"
              className="w-full"
            />
          </div>
          <Button type="submit" disabled={loading || inputZip.length < 5}>
            {loading ? 'Checking...' : 'Check'}
          </Button>
        </form>

        {zipCode && (
          <div className="mt-4">
            {inServiceArea ? (
              <div className="p-3 bg-green-50 border border-green-100 rounded-md text-green-700 text-sm">
                <strong>Good news!</strong> We deliver to {zipCode}.
                {priceAdjustment !== 0 && (
                  <div className="mt-1 text-xs">
                    {priceAdjustment > 0 
                      ? `Note: This location has a ${priceAdjustment}% delivery surcharge.`
                      : `You qualify for a ${Math.abs(priceAdjustment)}% regional discount!`
                    }
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-red-50 border border-red-100 rounded-md text-red-700 text-sm">
                Sorry, we don't currently deliver to {zipCode}.
              </div>
            )}
          </div>
        )}

        {inServiceArea && (
          <div className="space-y-6">
            <div className="border-t pt-6">
              <div className="mb-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Selected Material</span>
                  {priceAdjustment !== 0 && (
                    <Badge variant={priceAdjustment > 0 ? "outline" : "secondary"}>
                      {priceAdjustment > 0 
                        ? `${priceAdjustment}% surcharge` 
                        : `${Math.abs(priceAdjustment)}% discount`}
                    </Badge>
                  )}
                </div>
                <div className="font-medium">
                  {product ? product.name : 'Standard Aggregate'} - {formatCurrency(adjustedPrice)}/ton
                </div>
              </div>
            </div>
            
            <TonSelector 
              value={selectedTons} 
              onValueChange={setSelectedTons}
            />

            <div className="border-t border-b py-4 space-y-2">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total for {selectedTons} tons:</span>
                <span className="text-primary">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Total includes delivery to {zipCode}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ZipCodeSection;
