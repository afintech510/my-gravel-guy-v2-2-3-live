
import React, { useState, useEffect } from 'react';
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import QuickDeliveryForm from '../components/checkout/QuickDeliveryForm';

const QuickCheckout = () => {
  const { items, total, discountTotal, clearCart } = useCart();
  const [isDeliveryConfirmed, setIsDeliveryConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if no items in cart
  useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
  }, [items.length, navigate]);

  if (items.length === 0) {
    return null;
  }

  const handleDeliveryConfirmed = () => {
    setIsDeliveryConfirmed(true);
    toast({
      title: "Delivery Information Confirmed",
      description: "You can now proceed to payment.",
    });
  };

  const handlePayNow = async () => {
    setIsLoading(true);
    
    try {
      // Format cart items for Stripe
      const formattedItems = items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description?.substring(0, 100) || '',
        price: item.price,
        quantity: item.tons,
        image: item.image || item.images?.[0],
        metadata: {
          deliveryDate: item.deliveryDate ? item.deliveryDate.toISOString() : undefined,
          deliveryAddress: item.deliveryAddress ? JSON.stringify(item.deliveryAddress) : undefined,
          contactPhone: item.contactPhone,
          deliveryTimePreference: item.deliveryTimePreference,
          deliveryInstructions: item.deliveryInstructions
        }
      }));
      
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
    <div className="py-8 px-4 max-w-4xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      
      <h1 className="text-3xl font-bold mb-8">Complete Your Order</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column - Delivery Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
              <p className="text-muted-foreground">
                Please provide your delivery details to complete your order
              </p>
            </CardHeader>
            <CardContent>
              <QuickDeliveryForm
                items={items}
                onDeliveryConfirmed={handleDeliveryConfirmed}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Items */}
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex justify-between text-sm">
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground">
                        {item.tons} tons
                      </div>
                    </div>
                    <div className="font-medium">
                      ${(item.price * item.tons).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pricing Summary */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({items.length} items)</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                
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
                
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>${discountTotal.toFixed(2)}</span>
                </div>
              </div>
              
              {/* Payment Button */}
              <Button 
                onClick={handlePayNow}
                disabled={!isDeliveryConfirmed || isLoading}
                className="w-full mt-6"
                size="lg"
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
              
              {!isDeliveryConfirmed && (
                <p className="text-xs text-muted-foreground text-center">
                  Please confirm your delivery information to enable payment
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default QuickCheckout;
