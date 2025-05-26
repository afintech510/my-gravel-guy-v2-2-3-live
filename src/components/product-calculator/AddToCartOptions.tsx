
import React, { useState } from 'react';
import { Product } from '@/services/productTypes';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Info, EqualApproximately, Plus, Minus } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { useToast } from '@/components/ui/use-toast';
import { calculateFinalPrice } from '@/services/products/pricingUtils';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface AddToCartOptionsProps {
  product: Product;
  calculatedTons: number;
  priceDetails: {
    basePrice: number;
    multiplier: number;
    zipAdjustment: number;
    finalPrice: number;
    pricePerTon: number;
  } | null;
}

export default function AddToCartOptions({ 
  product, 
  calculatedTons,
  priceDetails
}: AddToCartOptionsProps) {
  const { addToCart } = useCart();
  const { zipCode, zipCodeData } = useZipCode();
  const { toast } = useToast();
  
  // State for adjustable quantity with minimum of 3 tons
  const [adjustedTons, setAdjustedTons] = useState(() => Math.max(3, Math.round(calculatedTons)));
  
  // Generate three options based on adjusted tons
  const options = [
    { tons: Math.max(3, adjustedTons - 1), label: 'Conservative' },
    { tons: adjustedTons, label: 'Recommended' },
    { tons: adjustedTons + 1, label: 'Extra Buffer' }
  ];

  // Handle increment/decrement
  const handleIncrement = () => {
    setAdjustedTons(prev => prev + 1);
  };

  const handleDecrement = () => {
    setAdjustedTons(prev => Math.max(3, prev - 1));
  };

  // Handle adding product to cart
  const handleAddToCart = async (tons: number) => {
    try {
      console.log(`AddToCartOptions: Adding ${tons} tons of ${product.name} (ID: ${product.id}) to cart`);
      
      // Recalculate price for the selected tons
      const pricing = await calculateFinalPrice(product, tons, zipCode || undefined);
      console.log('AddToCartOptions: Recalculated price for cart:', pricing);
      
      addToCart({ 
        ...product, 
        price: pricing.pricePerTon, // Use adjusted price per ton
        tons,
        yards: tons / (product.tonYardRatio || 1.5)
      });
      
      toast({
        title: "Added to cart",
        description: `${tons} tons of ${product.name} has been added to your cart.`,
      });
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error adding to cart",
        description: "There was a problem adding this item to your cart. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Format percentage difference for display
  const formatPercentage = (value: number) => {
    if (value === 1) return "0%";
    return value < 1 
      ? `-${((1 - value) * 100).toFixed(0)}%` 
      : `+${((value - 1) * 100).toFixed(0)}%`;
  };

  // Determine if we show pricing details
  const showPricingDetails = priceDetails && (
    priceDetails.multiplier !== 1 || 
    priceDetails.zipAdjustment !== 1
  );

  // Calculate cubic yards for each ton option based on the product's conversion ratio
  const calculateCubicYards = (tons: number) => {
    const tonYardRatio = product.tonYardRatio || 1.5;
    return (tons / tonYardRatio).toFixed(2);
  };

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-3">Add to Cart</h3>
      
      {zipCodeData && (
        <div className="mb-3 text-sm text-gray-600">
          <span className="font-medium">FREE delivery</span> to {zipCodeData.city}, {zipCodeData.state_id}
        </div>
      )}
      
      {showPricingDetails && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm">Base Price:</span>
            <span className="text-sm">${priceDetails.basePrice.toFixed(2)}/ton</span>
          </div>
          
          {priceDetails.multiplier !== 1 && (
            <div className="flex justify-between items-center">
              <span className="text-sm">Volume {priceDetails.multiplier < 1 ? 'Discount' : 'Adjustment'}:</span>
              <span className={`text-sm ${priceDetails.multiplier < 1 ? 'text-green-600' : 'text-amber-600'}`}>
                {formatPercentage(priceDetails.multiplier)}
              </span>
            </div>
          )}
          
          {priceDetails.zipAdjustment !== 1 && (
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-sm">Location Adjustment:</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="ml-1">
                        <Info className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        Pricing may vary based on delivery location due to distance and other factors.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className={`text-sm ${priceDetails.zipAdjustment < 1 ? 'text-green-600' : 'text-amber-600'}`}>
                {formatPercentage(priceDetails.zipAdjustment)}
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center pt-1 mt-1 border-t border-gray-200">
            <span className="font-medium">Final Price:</span>
            <span className="font-medium text-primary">${priceDetails.pricePerTon.toFixed(2)}/ton</span>
          </div>
        </div>
      )}

      {/* Top increment/decrement buttons */}
      <div className="mb-4 flex justify-center">
        <div className="flex items-center bg-green-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDecrement}
            disabled={adjustedTons <= 3}
            className="h-8 w-8 p-0 hover:bg-green-200"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="mx-3 text-sm font-medium">Adjust Amount</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleIncrement}
            className="h-8 w-8 p-0 hover:bg-green-200"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        {options.map((option) => {
          // Calculate price for each option based on priceDetails
          const price = priceDetails 
            ? priceDetails.pricePerTon * option.tons 
            : product.price * option.tons;
          
          // Calculate cubic yards equivalent
          const cubicYards = calculateCubicYards(option.tons);
          
          return (
            <div 
              key={option.label} 
              className={`border rounded-lg p-4 hover:border-primary transition-colors ${
                option.label === 'Recommended' ? 'bg-primary/5 border-primary/30' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{option.tons} tons</p>
                    <p className="flex items-center">
                      <EqualApproximately className="h-3 w-3 mr-1 text-black-300" />
                      <span>{cubicYards} yd³</span>
                    </p>
                  <p className="text-sm text-black font-medium mb-1">{product.name}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <span>{option.label}</span> 
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-xl">${price.toFixed(2)}</p>
                  <Button 
                    onClick={() => handleAddToCart(option.tons)}
                    className="mt-2"
                    variant={option.label === 'Recommended' ? 'default' : 'outline'}
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" /> Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom increment/decrement buttons */}
      <div className="mt-4 flex justify-center">
        <div className="flex items-center bg-green-100 rounded-lg p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDecrement}
            disabled={adjustedTons <= 3}
            className="h-8 w-8 p-0 hover:bg-green-200"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="mx-3 text-sm font-medium">Adjust Amount</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleIncrement}
            className="h-8 w-8 p-0 hover:bg-green-200"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
