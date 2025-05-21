
import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Checkout = () => {
  const { items, total, discountTotal, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check if any items are in cart
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  // Transform cart items to a format suitable for Stripe
  const formatCartItemsForStripe = () => {
    return items.map(item => {
      // Create metadata object for delivery details
      let metadata = {};
      
      if (item.deliveryAddress) {
        metadata = {
          deliveryDate: item.deliveryDate ? item.deliveryDate.toISOString() : undefined,
          deliveryAddress: item.deliveryAddress ? JSON.stringify(item.deliveryAddress) : undefined,
          contactPhone: item.contactPhone,
          deliveryTimePreference: item.deliveryTimePreference,
          deliveryInstructions: item.deliveryInstructions
        };
      }

      return {
        id: item.id,
        name: item.name,
        description: item.description?.substring(0, 100) || '',
        price: item.price,
        quantity: item.tons,
        image: item.image || item.images?.[0],
        metadata
      };
    });
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      // Format cart items for Stripe
      const formattedItems = formatCartItemsForStripe();
      
      // Call the create-payment Supabase Edge function
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: JSON.stringify({ items: formattedItems })
      });
      
      if (error) {
        throw new Error(`Payment error: ${error.message}`);
      }
      
      if (!data || !data.url) {
        throw new Error('Invalid response from payment service');
      }
      
      // Redirect to Stripe checkout
      window.location.href = data.url;
      
    } catch (error) {
      console.error('Checkout error:', error);
      
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: error instanceof Error ? error.message : "Failed to process checkout. Please try again.",
      });
      
      setIsLoading(false);
    }
  };

  return (
    <div className="py-8 px-4 max-w-6xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => navigate('/cart')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cart
      </Button>
      
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary Cards */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary ({items.length} items)</h2>
              
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex justify-between border-b pb-4">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.tons} tons {item.yards && `(${item.yards.toFixed(1)} cu. yds.)`}
                      </div>
                      
                      {/* Show delivery info if available */}
                      {item.deliveryAddress && (
                        <div className="text-sm mt-2">
                          <div className="text-muted-foreground">Delivery to:</div>
                          <div>{item.deliveryAddress.street}</div>
                          <div>{item.deliveryAddress.city}, {item.deliveryAddress.state} {item.deliveryAddress.zip}</div>
                          {item.deliveryDate && (
                            <div>
                              Scheduled: {new Date(item.deliveryDate).toLocaleDateString('en-US', {
                                weekday: 'long',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div>${(item.price * item.tons).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
            
            {/* Order summary details */}
            <div className="space-y-2 mb-4 pb-4 border-b">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              {/* Show discount if applied */}
              {total !== discountTotal && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${(total - discountTotal).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-sm">
                <span>Delivery</span>
                <span className="text-green-600 font-medium">FREE</span>
              </div>
            </div>
            
            <div className="flex justify-between font-semibold text-lg mb-6">
              <span>Total</span>
              <span>${discountTotal.toFixed(2)}</span>
            </div>
            
            <Button 
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Pay Now'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
