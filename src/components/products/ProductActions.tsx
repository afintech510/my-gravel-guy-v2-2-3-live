
import React from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from 'react-router-dom';
import DeliveryDatePicker from './DeliveryDatePicker';
import { Product } from '@/services/productTypes';
import AmountSelector from './AmountSelector';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { Minus, Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductActionsProps {
  product: Product;
  adjustedPrice: number;
  priceDetails?: {
    basePrice: number;
    multiplier: number;
    zipAdjustment: number;
    pricePerTon: number;
  };
  onQuantityChange?: (tons: number) => void;
  selectedTons: number;
}

const ProductActions = ({ 
  product, 
  adjustedPrice, 
  priceDetails,
  onQuantityChange,
  selectedTons
}: ProductActionsProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const isMobile = useIsMobile();
  const [deliveryDate, setDeliveryDate] = React.useState<Date>();
  
  const totalPrice = adjustedPrice * selectedTons;
  
  // Calculate cubic yards equivalent based on the product's ton-yard ratio
  const cubicYards = React.useMemo(() => {
    const tonYardRatio = product?.tonYardRatio || 1.5;
    return Math.round((selectedTons / tonYardRatio) * 100) / 100;
  }, [selectedTons, product]);
  
  // Handle local quantity change - directly pass to parent with 3 ton minimum
  const handleQuantityChange = (tons: number) => {
    const adjustedTons = Math.max(3, tons);
    if (onQuantityChange) {
      onQuantityChange(adjustedTons);
    }
  };

  // Handle increment/decrement with 3 ton minimum
  const handleIncrement = () => {
    handleQuantityChange(selectedTons + 1);
  };

  const handleDecrement = () => {
    if (selectedTons > 3) {
      handleQuantityChange(selectedTons - 1);
    }
  };

  const handleAddToCart = () => {
    // Add to cart with current selections
    addToCart({
      ...product,
      price: adjustedPrice,
      tons: selectedTons,
      deliveryDate,
      yards: cubicYards
    });

    /*toast({
      title: "Added to cart",
      description: `${selectedTons} tons of ${product.name} has been added to your cart.`,
    });*/

    // Navigate to cart page for delivery info completion
    navigate('/cart');
    
    // Scroll to top on mobile after navigation
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  // Determine if volume discount is applied
  const hasVolumeDiscount = priceDetails && priceDetails.multiplier !== 1;
  
  // Determine if ZIP code adjustment is applied
  const hasZipAdjustment = priceDetails && priceDetails.zipAdjustment !== 1;
  
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
      
      {/* Product name and tons/cubic yards display with increment/decrement buttons */}
      <div className="flex flex-col items-center justify-center text-center my-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleDecrement}
            disabled={selectedTons <= 3}
            className="h-12 w-12"
          >
            <Minus className="h-6 w-6" />
          </Button>
          
          <div className="flex flex-col items-center justify-center">
            <span className="text-4xl font-bold">{selectedTons} tons</span>
            <span className="text-xl text-gray-500">
              ≈ {cubicYards} yd³
            </span>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleIncrement}
            className="h-12 w-12"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <DeliveryDatePicker 
        selectedDate={deliveryDate}
        onDateSelect={setDeliveryDate}
      />

      <div className="space-y-4">
        <div className="border-t border-b py-4 space-y-2">
          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total:</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>${adjustedPrice.toFixed(2)} per ton</span>
            <span></span>
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
