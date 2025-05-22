
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import DeliveryDatePicker from './DeliveryDatePicker';
import { Product } from '@/services/productTypes';
import AmountSelector from './AmountSelector';

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
  initialTons?: number; // New prop to set initial tons from calculator
}

const ProductActions = ({ 
  product, 
  adjustedPrice, 
  priceDetails,
  onAddToCart,
  initialTons 
}: ProductActionsProps) => {
  const { toast } = useToast();
  const [selectedTons, setSelectedTons] = React.useState<number>(initialTons || 10);
  const [deliveryDate, setDeliveryDate] = React.useState<Date>();

  // Update selectedTons when initialTons prop changes
  useEffect(() => {
    if (initialTons) {
      setSelectedTons(initialTons);
    }
  }, [initialTons]);

  const totalPrice = adjustedPrice * selectedTons;

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

  return (
    <div className="space-y-6">
      <AmountSelector 
        selectedAmount={selectedTons}
        onSelectAmount={setSelectedTons}
      />

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
                  <span>Volume Discount:</span>
                  <span className="text-green-600">
                    {priceDetails.multiplier < 1 
                      ? `-${((1 - priceDetails.multiplier) * 100).toFixed(0)}%` 
                      : `+${((priceDetails.multiplier - 1) * 100).toFixed(0)}%`}
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
