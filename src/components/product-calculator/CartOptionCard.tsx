
import React from 'react';
import { Product } from '@/services/productTypes';
import { Button } from '@/components/ui/button';
import { ShoppingBag, EqualApproximately } from 'lucide-react';

interface CartOption {
  tons: number;
  label: string;
}

interface CartOptionCardProps {
  option: CartOption;
  product: Product;
  price: number;
  onAddToCart: (tons: number) => void;
}

export default function CartOptionCard({ 
  option, 
  product, 
  price, 
  onAddToCart 
}: CartOptionCardProps) {
  // Calculate cubic yards equivalent
  const calculateCubicYards = (tons: number) => {
    const tonYardRatio = product.tonYardRatio || 1.5;
    return (tons / tonYardRatio).toFixed(2);
  };

  const cubicYards = calculateCubicYards(option.tons);

  return (
    <div 
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
            onClick={() => onAddToCart(option.tons)}
            className="mt-2"
            variant={option.label === 'Recommended' ? 'default' : 'outline'}
          >
            <ShoppingBag className="h-4 w-4 mr-2" /> Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
