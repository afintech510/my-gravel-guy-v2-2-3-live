import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MapPinIcon, PhoneIcon, MailIcon, ClockIcon, FileTextIcon, UserIcon, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { storeCheckoutBackup } from '../utils/paymentUtils';
import CouponCode from '../components/cart/CouponCode';

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

  // Calculate if discounts are applied
  const hasDiscounts = total !== discountTotal;
  const totalDiscount = total - discountTotal;

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

  // Helper function to get material size info
  const getMaterialSizeInfo = (item: any) => {
    // Check multiple possible sources for size information
    if (item.size) return `Size: ${item.size}`;
    if (item.specifications?.size) return `Size: ${item.specifications.size}`;
    if (item.materialSize) return `Size: ${item.materialSize}`;
    return null;
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

  // Send checkout confirmation email to internal team
  const sendCheckoutConfirmationEmail = async (orderId: string) => {
    try {
      console.log('=== CHECKOUT CONFIRMATION EMAIL DEBUG ===');
      console.log('Sending checkout confirmation email...');
      
      const orderData = {
        order_id: orderId,
        items: items.map(item => ({
          product_name: item.name,
          quantity: item.tons,
          total_price: item.price * item.tons,
          delivery_date: item.deliveryDate?.toISOString(),
          delivery_address: item.deliveryAddress,
          contact_info: item.contactInfo
        })),
        total_amount: discountTotal,
        customer_email: items[0]?.contactInfo?.email || 'checkout-confirmation@customer.com',
        customer_name: items[0]?.contactInfo?.name || 'Checkout Customer'
      };

      console.log('Checkout confirmation order data:', orderData);

      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'order.support@mygravelguy.com',
          subject: 'Continued to Payment - Customer Proceeded to Stripe',
          html: generateCheckoutConfirmationEmail(orderData),
          type: 'internal_notification',
          orderData
        }
      });

      if (error) {
        console.error('Checkout confirmation email error:', error);
      } else {
        console.log('Checkout confirmation email sent successfully:', data);
      }
    } catch (error) {
      console.error('Checkout confirmation email exception:', error);
    }
  };

  // Generate simple email template for checkout confirmation
  const generateCheckoutConfirmationEmail = (orderData: any) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Continued to Payment</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Continued to Payment 💳</h1>
          <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Customer proceeded to Stripe checkout</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #dc2626; margin-top: 0;">Order ID: ${orderData.order_id}</h2>
          <p><strong>Customer:</strong> ${orderData.customer_name}</p>
          <p><strong>Email:</strong> ${orderData.customer_email}</p>
          <p><strong>Total Amount:</strong> $${orderData.total_amount.toFixed(2)}</p>
          <p><strong>Items:</strong> ${orderData.items.length}</p>
          <p><strong>Status:</strong> Proceeding to Stripe Payment</p>
          
          <div style="margin: 20px 0;">
            <h3>Items:</h3>
            ${orderData.items.map((item: any) => `
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 6px;">
                <strong>${item.product_name}</strong><br>
                Quantity: ${item.quantity} tons<br>
                Price: $${item.total_price.toFixed(2)}
              </div>
            `).join('')}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      // Format cart items for Stripe
      const formattedItems = formatCartItemsForStripe();
      
      // Generate a unique order ID for tracking
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log('=== CHECKOUT DEBUG START ===');
      console.log('Order ID generated:', orderId);
      console.log('Formatted items:', formattedItems);
      
      // Send checkout confirmation email first
      await sendCheckoutConfirmationEmail(orderId);
      
      // Store order information in localStorage as backup
      const orderBackup = {
        orderId,
        items: formattedItems,
        total: discountTotal,
        timestamp: Date.now(),
        cartItems: items
      };
      
      storeCheckoutBackup(orderBackup);
      
      console.log('Order backup stored in localStorage:', orderBackup);
      
      // Call the create-payment Supabase Edge function
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: JSON.stringify({ 
          items: formattedItems,
          orderId: orderId
        })
      });
      
      if (error) {
        throw new Error(`Payment error: ${error.message}`);
      }
      
      if (!data || !data.url) {
        throw new Error('Invalid response from payment service');
      }
      
      console.log('Payment URL received:', data.url);
      console.log('=== CHECKOUT DEBUG END ===');
      
      // Redirect to Stripe checkout in the same tab (FIXED: was opening new window)
      window.location.href = data.url;
      
    } catch (error) {
      console.error('Checkout error:', error);
      
      // Clear the checkout progress flag on error
      localStorage.removeItem('checkout-in-progress');
      
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
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            {item.tons} tons {item.yards && `(${item.yards.toFixed(1)} cu. yds.)`}
                          </div>
                          {getMaterialSizeInfo(item) && (
                            <div className="text-xs text-gray-600">
                              {getMaterialSizeInfo(item)}
                            </div>
                          )}
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
              {hasDiscounts && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-${totalDiscount.toFixed(2)}</span>
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

            {/* Coupon Code Component */}
            <div className="mb-6">
              <CouponCode />
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
