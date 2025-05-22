
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import DeliveryDatePicker from './DeliveryDatePicker';
import { Product } from '@/services/productTypes';
import AmountSelector from './AmountSelector';
import { Badge } from '@/components/ui/badge';

interface ProductActionsProps {
  product: Product;
  adjustedPrice: number;
  priceDetails?: {
    basePrice: number;
    multiplier: number;
    zipAdjustment: number;
    pricePerTon: number;
  };
  onAddToCart: (product: Product & { tons: number, deliveryDate: Date }) => void;
  onQuantityChange?: (tons: number) => void; // Callback for quantity changes
  selectedTons: number; // Current selected tons (renamed from initialTons)
}

const ProductActions = ({ 
  product, 
  adjustedPrice, 
  priceDetails,
  onAddToCart,
  onQuantityChange,
  selectedTons
}: ProductActionsProps) => {
  const { toast } = useToast();
  const [deliveryDate, setDeliveryDate] = React.useState<Date>();
  
  const totalPrice = adjustedPrice * selectedTons;
  
  // Handle local quantity change - directly pass to parent
  const handleQuantityChange = (tons: number) => {
    if (onQuantityChange) {
      onQuantityChange(tons);
    }
  };

  const handleAddToCart = () => {
    if (!deliveryDate) {
      toast({
        title: "Please select a delivery date",
        description: "A delivery date is required to continue.",
        variant: "destructive",
      });
      return;
    }

    onAddToCart({
      ...product,
      price: adjustedPrice,
      tons: selectedTons,
      deliveryDate
    });
  };

  // Determine if volume discount is applied
  const hasVolumeDiscount = priceDetails && priceDetails.multiplier !== 1;
  
  // Determine if ZIP code adjustment is applied
  const hasZipAdjustment = priceDetails && priceDetails.zipAdjustment !== 0;
  
  // Format the discount/surcharge percentage for display
  const formatPercentage = (value: number) => {
    if (value === 1) return "0%";
    return value < 1 
      ? `-${((1 - value) * 100).toFixed(0)}%` 
      : `+${((value - 1) * 100).toFixed(0)}%`;
  };

  return (
    <div className="space-y-6">
      <AmountSelector 
        selectedAmount={selectedTons}
        onSelectAmount={handleQuantityChange}
      />

      {/* Volume discount information banner */}
      {hasVolumeDiscount && (
        <div className={`p-3 rounded-md ${priceDetails && priceDetails.multiplier < 1 ? 'bg-green-50 border border-green-100' : 'bg-amber-50 border border-amber-100'}`}>
          <div className="flex items-center gap-2">
            {priceDetails && priceDetails.multiplier < 1 ? (
              <Badge className="bg-green-500">Volume Discount</Badge>
            ) : (
              <Badge variant="outline">Volume Pricing</Badge>
            )}
            <span className="text-sm">
              {priceDetails && priceDetails.multiplier < 1 
                ? `You're receiving a ${formatPercentage(priceDetails.multiplier)} discount for ordering ${selectedTons} tons`
                : `Volume pricing applied to your ${selectedTons} ton order`}
            </span>
          </div>
        </div>
      )}

      <DeliveryDatePicker 
        selectedDate={deliveryDate}
        onDateSelect={setDeliveryDate}
      />

      <div className="space-y-4">
        {/* Display pricing breakdown if we have price details */}
        {priceDetails && (
          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <h3 className="font-semibold text-sm uppercase tracking-wider">Pricing Details</h3>
            
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Base Price:</span>
                <span>${priceDetails.basePrice.toFixed(2)}/ton</span>
              </div>
              
              {hasVolumeDiscount && (
                <div className="flex justify-between">
                  <span>Volume Discount ({selectedTons} tons):</span>
                  <span className={priceDetails.multiplier < 1 ? "text-green-600" : "text-amber-600"}>
                    {formatPercentage(priceDetails.multiplier)}
                  </span>
                </div>
              )}
              
              {hasZipAdjustment && (
                <div className="flex justify-between">
                  <span>Location Adjustment:</span>
                  <span className={priceDetails.zipAdjustment < 0 ? "text-green-600" : "text-amber-600"}>
                    {priceDetails.zipAdjustment > 0 ? "+" : ""}{priceDetails.zipAdjustment.toFixed(0)}%
                  </span>
                </div>
              )}
              
              <div className="flex justify-between font-medium pt-1 border-t">
                <span>Final Price:</span>
                <span className="text-primary">${priceDetails.pricePerTon.toFixed(2)}/ton</span>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-b py-4 space-y-2">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>Shipping:</span>
            <span className="text-green-600 font-medium">FREE</span>
          </div>
        </div>
        
        <Button 
          onClick={handleAddToCart} 
          size="lg" 
          className="w-full"
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
};

export default ProductActions;
