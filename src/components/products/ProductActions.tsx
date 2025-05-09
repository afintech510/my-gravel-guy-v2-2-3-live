
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import TonSelector from './TonSelector';
import DeliveryDatePicker from './DeliveryDatePicker';
import { Product } from '@/services/productTypes';

interface ProductActionsProps {
  product: Product;
  adjustedPrice: number;
  onAddToCart: (product: Product & { tons: number, deliveryDate: Date }) => void;
}

const ProductActions = ({ product, adjustedPrice, onAddToCart }: ProductActionsProps) => {
  const { toast } = useToast();
  const [selectedTons, setSelectedTons] = React.useState("3");
  const [deliveryDate, setDeliveryDate] = React.useState<Date>();

  const totalPrice = adjustedPrice * parseInt(selectedTons);

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
      tons: parseInt(selectedTons),
      deliveryDate
    });
  };

  return (
    <div className="space-y-8">
      <TonSelector 
        value={selectedTons} 
        onValueChange={setSelectedTons} 
        tonYardRatio={product.tonYardRatio}
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
