
import React, { useState } from 'react';
import { Product } from '@/services/productTypes';
import { useCart } from '@/contexts/CartContext';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { calculateFinalPrice } from '@/services/products/pricingUtils';
import PriceDetailsDisplay from './PriceDetailsDisplay';
import QuantityAdjuster from './QuantityAdjuster';
import CartOptionCard from './CartOptionCard';

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
  const navigate = useNavigate();
  
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

      // Navigate to quick checkout
      navigate('/quick-checkout');
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error adding to cart",
        description: "There was a problem adding this item to your cart. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Determine if we show pricing details
  const showPricingDetails = priceDetails && (
    priceDetails.multiplier !== 1 || 
    priceDetails.zipAdjustment !== 1
  );

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-800 mb-3">Add to Cart</h3>
      
      {zipCodeData && (
        <div className="mb-3 text-sm text-gray-600">
          <span className="font-medium">FREE delivery</span> to {zipCodeData.city}, {zipCodeData.state_id}
        </div>
      )}
      
      {showPricingDetails && priceDetails && (
        <PriceDetailsDisplay priceDetails={priceDetails} />
      )}

      <QuantityAdjuster
        adjustedTons={adjustedTons}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        className="mb-4"
      />
      
      <div className="space-y-3">
        {options.map((option) => {
          // Calculate price for each option based on priceDetails
          const price = priceDetails 
            ? priceDetails.pricePerTon * option.tons 
            : product.price * option.tons;
          
          return (
            <CartOptionCard
              key={option.label}
              option={option}
              product={product}
              price={price}
              onAddToCart={handleAddToCart}
            />
          );
        })}
      </div>

      <QuantityAdjuster
        adjustedTons={adjustedTons}
        onIncrement={handleIncrement}
        onDecrement={handleDecrement}
        className="mt-4"
      />
    </div>
  );
}
