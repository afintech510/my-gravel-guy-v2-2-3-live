
import React from 'react';
import { Product } from '@/services/productTypes';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { useToast } from '@/components/ui/use-toast';

interface AddToCartOptionsProps {
  product: Product;
  calculatedTons: number;
}

export default function AddToCartOptions({ 
  product, 
  calculatedTons 
}: AddToCartOptionsProps) {
  const { addToCart } = useCart();
  const { zipCodeData } = useZipCode();
  const { toast } = useToast();
  
  // Round to nearest ton
  const roundedTons = Math.round(calculatedTons);
  
  // Generate three options: exact, -1, +1 (ensuring none go below 1 ton)
  const options = [
    { tons: Math.max(1, roundedTons - 1), label: 'Conservative' },
    { tons: roundedTons, label: 'Recommended' },
    { tons: roundedTons + 1, label: 'Extra Buffer' }
  ];

  // Handle adding product to cart
  const handleAddToCart = (tons: number) => {
    addToCart({ 
      ...product, 
      tons,
      yards: tons / (product.tonYardRatio || 1.5)
    });
    
    toast({
      title: "Added to cart",
      description: `${tons} tons of ${product.name} has been added to your cart.`,
    });
  };

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-3">Add to Cart</h3>
      
      {zipCodeData && (
        <div className="mb-3 text-sm text-gray-600">
          <span className="font-medium">Free delivery</span> to {zipCodeData.city}, {zipCodeData.state_id}
        </div>
      )}
      
      <div className="space-y-3">
        {options.map((option) => {
          const price = product.price * option.tons;
          
          return (
            <div 
              key={option.label} 
              className="border rounded-lg p-4 hover:border-primary transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{option.tons} tons</p>
                  <p className="text-sm text-gray-500">{option.label}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-xl">${price.toFixed(2)}</p>
                  <Button 
                    onClick={() => handleAddToCart(option.tons)}
                    className="mt-2"
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" /> Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
