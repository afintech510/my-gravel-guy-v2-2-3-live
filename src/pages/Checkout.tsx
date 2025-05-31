import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MapPinIcon, PhoneIcon, MailIcon, ClockIcon, FileTextIcon, UserIcon, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  // Helper function to format delivery time preference
  const formatDeliveryTimePreference = (preference?: "anytime" | "morning" | "afternoon") => {
    switch (preference) {
      case 'anytime':
        return 'Anytime (7am-5pm)';
      case 'morning':
        return 'Morning (7am-12pm)';
      case 'afternoon':
        return 'Afternoon (12pm-5pm)';
      default:
        return 'Not specified';
    }
  };

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
              
              <div className="space-y-6">
                {items.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="border-b pb-6 last:border-b-0">
                    <div className="flex justify-between mb-4">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.tons} tons {item.yards && `(${item.yards.toFixed(1)} cu. yds.)`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div>${(item.price * item.tons).toFixed(2)}</div>
                      </div>
                    </div>
                    
                    {/* Delivery Details Section */}
                    {(item.deliveryAddress || item.contactInfo || item.deliveryDate) && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <h4 className="font-medium text-gray-900 mb-3">Delivery Details</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Contact Information */}
                          {item.contactInfo && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700 text-sm">Contact Information</h5>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <UserIcon className="h-3 w-3" />
                                  <span>{item.contactInfo.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <PhoneIcon className="h-3 w-3" />
                                  <span>{item.contactInfo.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <MailIcon className="h-3 w-3" />
                                  <span>{item.contactInfo.email}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Delivery Address */}
                          {item.deliveryAddress && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700 text-sm">Delivery Address</h5>
                              <div className="flex items-start gap-2 text-sm text-gray-600">
                                <MapPinIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <div>
                                  <div>{item.deliveryAddress.street}</div>
                                  <div>{item.deliveryAddress.city}, {item.deliveryAddress.state} {item.deliveryAddress.zip}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Delivery Date and Preferences */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                          {item.deliveryDate && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700 text-sm">Delivery Schedule</h5>
                              <div className="text-sm text-gray-600">
                                <div className="font-medium">
                                  {new Date(item.deliveryDate).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                {item.deliveryTimePreference && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <ClockIcon className="h-3 w-3" />
                                    <span>{formatDeliveryTimePreference(item.deliveryTimePreference)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Special Instructions */}
                          {item.deliveryInstructions && (
                            <div className="space-y-2">
                              <h5 className="font-medium text-gray-700 text-sm">Special Instructions</h5>
                              <div className="flex items-start gap-2 text-sm text-gray-600">
                                <FileTextIcon className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                <span>{item.deliveryInstructions}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment Options Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  We offer flexible payment options to make your purchase convenient:
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="font-medium text-sm">Credit/Debit</div>
                    <div className="text-xs text-gray-500 mt-1">Visa, Mastercard, Amex</div>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <div className="font-medium text-sm">Klarna</div>
                    <div className="text-xs text-gray-500 mt-1">Pay in 4 installments</div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <div className="font-medium text-sm">Afterpay</div>
                    <div className="text-xs text-gray-500 mt-1">Buy now, pay later</div>
                  </div>
                  
                  <div className="bg-purple-50 p-3 rounded-lg text-center">
                    <div className="font-medium text-sm">Affirm</div>
                    <div className="text-xs text-gray-500 mt-1">Monthly payments</div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500">
                  Payment options may vary based on order total and location. Final options will be displayed at checkout.
                </p>
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
              
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span className="text-green-600 font-medium">Included</span>
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
                'Continue to Payment'
              )}
            </Button>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              Secure checkout powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
