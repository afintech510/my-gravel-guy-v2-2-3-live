
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import DeliveryDatePicker from './DeliveryDatePicker';
import { Product } from '@/services/productTypes';
import AmountSelector from './AmountSelector';

interface ProductActionsProps {
  product: Product;
  adjustedPrice: number;
  onAddToCart: (product: Product & { tons: number, deliveryDate: Date }) => void;
  initialTons?: number; // New prop to set initial tons from calculator
}

const ProductActions = ({ 
  product, 
  adjustedPrice, 
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

  return (
    <div className="space-y-8">
      <AmountSelector 
        selectedAmount={selectedTons}
        onSelectAmount={setSelectedTons}
      />

      <DeliveryDatePicker 
        selectedDate={deliveryDate}
        onDateSelect={setDeliveryDate}
      />

      <div className="space-y-4">
        <div className="border-t border-b py-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Price per ton:</span>
            <span className="font-medium">${adjustedPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Amount:</span>
            <span className="font-medium">{selectedTons} tons</span>
          </div>
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total:</span>
            <span>${totalPrice.toFixed(2)}</span>
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
