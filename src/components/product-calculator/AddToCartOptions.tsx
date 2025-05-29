
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { Product } from '@/services/productTypes';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { useZipCode } from '@/contexts/ZipCodeContext';

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
  const navigate = useNavigate();
  const { zipCode } = useZipCode();
  
  // State for user-selected quantity (starts with calculated amount)
  const [selectedTons, setSelectedTons] = useState<number>(Math.max(3, Math.ceil(calculatedTons)));

  const handleQuantityChange = (change: number) => {
    setSelectedTons(prev => Math.max(1, prev + change));
  };

  const handleAddToCart = (option: 'conservative' | 'recommended') => {
    const tons = option === 'conservative' ? selectedTons : Math.ceil(selectedTons * 1.1);
    const finalPrice = priceDetails ? priceDetails.pricePerTon : product.price;
    
    addToCart({
      ...product,
      tons,
      price: finalPrice
    });

    navigate('/cart');
  };

  const calculatePrice = (tons: number) => {
    if (!priceDetails) return tons * product.price;
    return tons * priceDetails.pricePerTon;
  };

  const cubicYards = selectedTons / (product.tonYardRatio || 1.5);

  return (
    <div className="space-y-4">
      {/* Quantity Adjuster */}
      <div className="flex items-center justify-center bg-green-100 rounded-lg p-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleQuantityChange(-1)}
          disabled={selectedTons <= 1}
          className="h-8 w-8"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="mx-4 text-lg font-medium">Adjust Amount</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleQuantityChange(1)}
          className="h-8 w-8"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Conservative Option */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{selectedTons} tons</h3>
            <p className="text-sm text-gray-600">≈ {cubicYards.toFixed(1)} yd³</p>
            <p className="text-sm font-medium text-primary">{product.name}</p>
            <p className="text-xs text-gray-500">Conservative</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">${calculatePrice(selectedTons).toFixed(2)}</p>
          </div>
        </div>
        <Button 
          onClick={() => handleAddToCart('conservative')}
          variant="outline"
          className="w-full"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </div>

      {/* Recommended Option */}
      <div className="border-2 border-green-400 rounded-lg p-4 bg-green-50">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{Math.ceil(selectedTons * 1.1)} tons</h3>
            <p className="text-sm text-gray-600">≈ {(cubicYards * 1.1).toFixed(1)} yd³</p>
            <p className="text-sm font-medium text-primary">{product.name}</p>
            <p className="text-xs text-green-600 font-medium">Recommended</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">${calculatePrice(Math.ceil(selectedTons * 1.1)).toFixed(2)}</p>
          </div>
        </div>
        <Button 
          onClick={() => handleAddToCart('recommended')}
          className="w-full bg-green-500 hover:bg-green-600"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
