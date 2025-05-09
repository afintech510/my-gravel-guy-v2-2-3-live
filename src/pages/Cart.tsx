
import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2 } from "lucide-react";
import CartItemCard from '@/components/cart/CartItemCard';

const Cart = () => {
  const { items, removeFromCart, updateDeliveryDetails, total, isDeliveryInfoComplete } = useCart();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to sanitize product data for Stripe
  const sanitizeProductData = (items) => {
    const origin = window.location.origin;
    
    return items.map(item => {
      // Process image URL to ensure it's absolute
      let imageUrl = item.image || '/placeholder.svg';
      
      // If image URL is relative (starts with / or is a local path), convert to absolute URL
      if (imageUrl && (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) || !imageUrl.includes('://')) {
        imageUrl = `${origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      }
      
      // Build a descriptive name with delivery info
      const deliveryDate = item.deliveryDate ? ` - Delivery on ${item.deliveryDate.toLocaleDateString()}` : '';
      const productName = `${String(item.name).replace(/['"\\]/g, '')} (${item.tons} tons${item.yards ? ` / ${item.yards.toFixed(1)} yards` : ''})${deliveryDate}`;
      
      // Return sanitized item with absolute image URL and enhanced metadata
      return {
        id: item.id,
        name: productName,
        price: parseFloat(item.price),
        quantity: item.tons, // Use tons as the quantity
        image: imageUrl,
        metadata: {
          deliveryDate: item.deliveryDate ? item.deliveryDate.toISOString() : null,
          deliveryAddress: item.deliveryAddress ? JSON.stringify(item.deliveryAddress) : null,
          contactPhone: item.contactPhone || null,
          deliveryTimePreference: item.deliveryTimePreference || null,
          deliveryInstructions: item.deliveryInstructions || null
        }
      };
    });
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add items to your cart before checkout.",
        variant: "destructive"
      });
      return;
    }

    // Check if all items have complete delivery information
    const incompleteItems = items.filter(item => !isDeliveryInfoComplete(item));
    if (incompleteItems.length > 0) {
      toast({
        title: "Missing delivery information",
        description: "Please complete delivery information for all items before checkout.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Sanitize product data for Stripe
      const sanitizedItems = sanitizeProductData(items);
      
      console.log('Checkout with sanitized items:', sanitizedItems);

      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: JSON.stringify({ items: sanitizedItems })
      });

      if (error) {
        console.error('Supabase Function Error:', error);
        throw new Error(error.message || "Failed to create checkout session");
      }
      
      if (!data?.url) {
        console.error('No checkout URL received:', data);
        throw new Error("No checkout URL received from payment service");
      }
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Checkout Error:", error);
      
      // More informative error handling
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Could not process checkout. Please try again.";
      
      setError(errorMessage);
      toast({
        title: "Checkout Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <Button asChild>
            <a href="/products">Continue Shopping</a>
          </Button>
        </div>
      </div>
    );
  }

  // Count how many items have complete delivery info
  const completeItems = items.filter(item => isDeliveryInfoComplete(item)).length;
  const totalItems = items.length;

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Delivery Orders</h1>
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {items.map((item) => (
              <CartItemCard
                key={`${item.id}-${item.deliveryDate?.getTime()}`}
                item={item}
                onRemove={removeFromCart}
                onUpdateDelivery={updateDeliveryDetails}
              />
            ))}
          </div>
          
          <div className="md:col-span-1">
            <div className="bg-gray-50 p-6 rounded-lg sticky top-24">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-2 border-b pb-4 mb-4">
                {items.map((item) => (
                  <div key={`summary-${item.id}-${item.deliveryDate?.getTime()}`} className="flex justify-between">
                    <span>{item.name} ({item.tons} tons)</span>
                    <span>${(item.price * item.tons).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between text-lg font-bold mb-6">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              {completeItems < totalItems ? (
                <div className="bg-amber-50 border border-amber-200 rounded p-3 mb-4 text-sm">
                  <p className="font-semibold text-amber-800">
                    Please complete delivery information for all items
                  </p>
                  <p className="text-amber-700 mt-1">
                    {completeItems} of {totalItems} items ready for checkout
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded p-3 mb-4 text-sm">
                  <div className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                    <p className="font-semibold text-green-800">
                      All delivery information complete
                    </p>
                  </div>
                </div>
              )}
              
              <Button 
                onClick={handleCheckout} 
                className="w-full mb-2"
                disabled={isLoading || completeItems < totalItems}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Proceed to Checkout"
                )}
              </Button>
              
              <p className="text-xs text-gray-500 text-center mt-2">
                Each item will be delivered as a separate order. 
                Please ensure delivery information is accurate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
