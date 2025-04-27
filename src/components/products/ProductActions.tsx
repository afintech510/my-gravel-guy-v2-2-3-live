
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import TonSelector from './TonSelector';
import DeliveryDatePicker from './DeliveryDatePicker';
import { Product } from '@/services/productTypes';

interface ProductActionsProps {
  product: Product;
  adjustedPrice: number;
  onAddToCart: (product: Product & { quantity: number, deliveryDate: Date }) => void;
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
      quantity: parseInt(selectedTons),
      deliveryDate
    });
  };

  return (
    <div className="space-y-8">
      <TonSelector 
        value={selectedTons} 
        onValueChange={setSelectedTons} 
      />

      <DeliveryDatePicker 
        selectedDate={deliveryDate}
        onDateSelect={setDeliveryDate}
      />

      <div className="space-y-4">
        <p className="text-2xl font-bold">
          Total: ${totalPrice.toFixed(2)}
        </p>
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
