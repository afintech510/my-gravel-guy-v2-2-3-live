import React, { useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, MapPinIcon, PhoneIcon, MailIcon, ClockIcon, FileTextIcon, UserIcon, CreditCard, Database, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { storeCheckoutBackup, createEnhancedBackup } from '../utils/paymentUtils';
import CouponCode from '../components/cart/CouponCode';
import PaymentMethodLogos from '../components/payment/PaymentMethodLogos';
import type { OrderInsertData } from '../services/productTypes';

const Checkout = () => {
  const { items, total, discountTotal, clearCart, appliedCoupon, couponDiscount } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [isTestingDB, setIsTestingDB] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
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
    if (item.size) return `Size: ${item.size}`;
    if (item.specifications?.size) return `Size: ${item.specifications.size}`;
    if (item.materialSize) return `Size: ${item.materialSize}`;
    return null;
  };

  // Test database insertion function with schema-accurate data
  const testDatabaseInsertion = async () => {
    setIsTestingDB(true);
    setCheckoutError(null);
    
    try {
      const testOrderId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const orderRecords: OrderInsertData[] = items.map((item, index) => ({
        order_id: testOrderId,
        stripe_session_id: `test_session_${testOrderId}_${index}`,
        product_id: item.id.toString(),
        unit: 'tons',
        unit_price: item.price,
        total_price: item.price * (item.tons || 1),
        quantity: item.tons || 1,
        status: 'test',
        delivery_name: item.contactInfo?.name,
        delivery_phone: item.contactInfo?.phone,
        delivery_email: item.contactInfo?.email,
        billing_name: item.contactInfo?.name,
        billing_email: item.contactInfo?.email,
        delivery_date: item.deliveryDate?.toISOString(),
        delivery_street: item.deliveryAddress?.street,
        delivery_city: item.deliveryAddress?.city,
        delivery_state: item.deliveryAddress?.state,
        delivery_zip: item.deliveryAddress?.zip,
        delivery_time_preference: item.deliveryTimePreference,
        delivery_instructions: item.deliveryInstructions
      }));

      const { data, error } = await supabase
        .from('orders')
        .insert(orderRecords)
        .select();

      if (error) {
        throw error;
      }
      
      toast({
        title: "Database Test Successful!",
        description: `Inserted ${data?.length || 0} test records`,
        className: "border-green-500 border-2"
      });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Database Test Failed",
        description: error instanceof Error ? error.message : "Failed to insert test records",
      });
    } finally {
      setIsTestingDB(false);
    }
  };

  // Transform cart items to a format suitable for Stripe with proper contact info mapping
  const formatCartItemsForStripe = () => {
    return items.map(item => {
      const itemTotal = item.price * item.tons;
      // Apply cart-level discount proportionally across items
      const itemProportion = itemTotal / total;
      const itemDiscount = couponDiscount * itemProportion;
      const discountedTotal = itemTotal - itemDiscount;
      const discountedPricePerTon = discountedTotal / item.tons;

      const metadata = {
        deliveryDate: item.deliveryDate ? item.deliveryDate.toISOString() : undefined,
        deliveryAddress: item.deliveryAddress ? JSON.stringify(item.deliveryAddress) : undefined,
        deliveryTimePreference: item.deliveryTimePreference || undefined,
        deliveryInstructions: item.deliveryInstructions || undefined,
        contactName: item.contactInfo?.name || undefined,
        contactPhone: item.contactInfo?.phone || undefined,
        contactEmail: item.contactInfo?.email || undefined, // This is what create-auth-hold looks for
      };

      return {
        id: item.id,
        name: item.name,
        description: item.short_description?.substring(0, 100) || item.description?.substring(0, 100) || 'Landscape Material',
        price: Math.max(0.01, discountedPricePerTon),
        quantity: item.tons,
        image: item.image || item.images?.[0],
        metadata
      };
    });
  };

  // Send checkout confirmation email to internal team
  const sendCheckoutConfirmationEmail = async (orderId: string) => {
    try {
      // Calculate coupon information
      const baseTotal = items.reduce((sum, item) => sum + (item.price * item.tons), 0);
      const totalCouponDiscount = couponDiscount;
      const hasCoupon = totalCouponDiscount > 0;

      const orderData = {
        order_id: orderId,
        items: items.map(item => ({
          product_name: item.name,
          quantity: item.tons,
          total_price: item.price * item.tons,
          delivery_date: item.deliveryDate?.toISOString(),
          delivery_address: item.deliveryAddress,
          contact_info: item.contactInfo,
          delivery_time_preference: item.deliveryTimePreference,
          delivery_instructions: item.deliveryInstructions
        })),
        total_amount: discountTotal,
        base_total: baseTotal,
        customer_email: items[0]?.contactInfo?.email || 'checkout-confirmation@customer.com',
        customer_name: items[0]?.contactInfo?.name || 'Checkout Customer',
        // Add coupon information
        coupon_info: hasCoupon ? {
          code: appliedCoupon || 'DISCOUNT_APPLIED',
          total_discount: totalCouponDiscount,
          applied: true
        } : null
      };

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
      }
    } catch (error) {
      console.error('Checkout confirmation email exception:', error);
    }
  };

  // Generate email template for checkout confirmation
  const generateCheckoutConfirmationEmail = (orderData: any) => {
    const formatDeliveryTime = (preference?: string) => {
      switch (preference) {
        case 'anytime': return 'Anytime (7am-5pm)';
        case 'morning': return 'Morning (7am-12pm)';
        case 'afternoon': return 'Afternoon (12pm-5pm)';
        default: return 'Not specified';
      }
    };

    const formatDate = (dateString?: string) => {
      if (!dateString) return 'Not specified';
      return new Date(dateString).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    };

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
          <p><strong>Phone:</strong> ${items[0]?.contactInfo?.phone || 'Not provided'}</p>
          <p><strong>Total Amount:</strong> $${orderData.total_amount.toFixed(2)}</p>
          ${orderData.coupon_info ? `
            <div style="background: #d1fae5; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #10b981;">
              <h5 style="margin: 0 0 8px 0; color: #047857;">🎟️ Coupon Applied</h5>
              <p style="margin: 0; color: #065f46;">
                <strong>Code:</strong> ${orderData.coupon_info.code}<br>
                <strong>Original Total:</strong> $${orderData.base_total.toFixed(2)}<br>
                <strong>Discount:</strong> -$${orderData.coupon_info.total_discount.toFixed(2)}<br>
                <strong>Final Total:</strong> $${orderData.total_amount.toFixed(2)}
              </p>
            </div>
          ` : ''}
          <p><strong>Items:</strong> ${orderData.items.length}</p>
          <p><strong>Status:</strong> Proceeding to Stripe Payment</p>
          
          <div style="margin: 20px 0;">
            <h3>Order Summary (${orderData.items.length} items)</h3>
            ${orderData.items.map((item: any) => `
              <div style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #dc2626;">
                <h4 style="margin-top: 0; color: #dc2626;">${item.product_name}</h4>
                <p><strong>Quantity:</strong> ${item.quantity} tons ${item.delivery_address ? `(${(item.quantity * 0.8).toFixed(1)} cu. yds.)` : ''}</p>
                <p><strong>Price:</strong> $${item.total_price.toFixed(2)}</p>
                
                ${item.delivery_address ? `
                  <div style="margin-top: 15px; padding: 15px; background: #f0f9ff; border-radius: 6px; border-left: 3px solid #0ea5e9;">
                    <h5 style="margin: 0 0 10px 0; color: #0c4a6e;">Delivery Details:</h5>
                    
                    <div style="margin-bottom: 10px;">
                      <strong>Contact Information:</strong><br>
                      ${item.contact_info?.name || 'Not provided'}<br>
                      ${item.contact_info?.phone || 'Not provided'}<br>
                      ${item.contact_info?.email || 'Not provided'}
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                      <strong>Delivery Address:</strong><br>
                      ${item.delivery_address.street}<br>
                      ${item.delivery_address.city}, ${item.delivery_address.state} ${item.delivery_address.zip}
                    </div>
                    
                    <div style="margin-bottom: 10px;">
                      <strong>Delivery Schedule:</strong><br>
                      ${formatDate(item.delivery_date)}<br>
                      ${formatDeliveryTime(item.delivery_time_preference)}
                    </div>
                    
                    ${item.delivery_instructions ? `
                      <div>
                        <strong>Special Instructions:</strong> ${item.delivery_instructions}
                      </div>
                    ` : ''}
                  </div>
                ` : ''}
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
    setCheckoutError(null);
    
    try {
      // Validate cart items before proceeding
      if (!items || items.length === 0) {
        throw new Error('Cart is empty');
      }

      // Validate that all items have required delivery information
      const itemsWithoutDelivery = items.filter(item => 
        !item.deliveryAddress || !item.contactInfo || !item.deliveryDate
      );
      
      if (itemsWithoutDelivery.length > 0) {
        throw new Error('Some items are missing required delivery information. Please complete all delivery forms.');
      }

      const formattedItems = formatCartItemsForStripe();
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Send checkout confirmation email first
      await sendCheckoutConfirmationEmail(orderId);
      
      // Create enhanced backup
      const orderBackup = createEnhancedBackup(orderId, items, {
        email: items[0]?.contactInfo?.email || 'guest@mygravelguy.com',
        name: items[0]?.contactInfo?.name || 'Guest User'
      });
      
      storeCheckoutBackup(orderBackup);
      
      // Try to get current session for authentication (optional for guest checkout)
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call the create-auth-hold Supabase Edge function (with optional authentication)
      const requestOptions: any = {
        body: JSON.stringify({ 
          items: formattedItems,
          orderId: orderId
        })
      };
      
      // Include auth header if user is logged in
      if (session?.access_token) {
        requestOptions.headers = {
          Authorization: `Bearer ${session.access_token}`
        };
      }
      
      const { data, error } = await supabase.functions.invoke('create-auth-hold', requestOptions);
      
      console.log('=== CREATE-AUTH-HOLD RESPONSE ===', { data, error });
      
      if (error) {
        throw new Error(`Authorization hold error: ${error.message}`);
      }
      
      if (!data || !data.url) {
        console.log('Invalid response data:', data);
        throw new Error('Invalid response from payment service - no checkout URL received');
      }
      
      console.log('Authorization hold checkout created:', { 
        orderId, 
        hasAuth: !!session?.access_token,
        checkoutUrl: data.url 
      });
      
      // Redirect to Stripe checkout with authorization hold
      window.location.href = data.url;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setCheckoutError(errorMessage);
      
      // Clear the checkout progress flag on error
      localStorage.removeItem('checkout-in-progress');
      
      toast({
        variant: "destructive",
        title: "Checkout Error",
        description: errorMessage,
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

      {checkoutError && (
        <Card className="mb-8 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div className="flex-1">
                <p className="font-medium text-red-800">Checkout Error</p>
                <p className="text-sm text-red-600">{checkoutError}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
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
                        <div className="text-lg font-semibold">
                          ${(item.price * item.tons).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    {(item.deliveryAddress || item.contactInfo || item.deliveryDate) && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                        <h4 className="font-medium text-gray-900 mb-3">Delivery Details</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                           {item.deliveryDate && (
                             <div className="space-y-2">
                               <h5 className="font-medium text-gray-700 text-sm">Delivery Schedule</h5>
                               <div className="text-sm text-gray-600">
                                 <div className="font-medium">
                                   {(() => {
                                     const date = item.deliveryDate instanceof Date ? item.deliveryDate : new Date(item.deliveryDate);
                                     return date.toLocaleDateString('en-US', {
                                       weekday: 'long',
                                       month: 'short',
                                       day: 'numeric',
                                       year: 'numeric'
                                     });
                                   })()}
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

          {/* Payment Options Info Card 
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
                */}
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
            <h2 className="text-xl font-semibold mb-4">Payment Summary</h2>
            
            <div className="space-y-2 mb-4 pb-4 border-b">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
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

            <div className="mb-6">
              <CouponCode />
            </div>
            
            {/* Authorization Hold Disclaimer */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Authorization Notice</p>
                  <p>We will place an authorization hold on your card for the order amount. You will NOT be charged until we confirm your materials and delivery details. The final charge will only occur after your approval.</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleCheckout}
              disabled={isLoading}
              className="w-full mb-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Continue to Payment
                </>
              )}
            </Button>

            {/* Add Payment Method Logos */}
            <PaymentMethodLogos />

            {/* Hidden test button - keeping functionality but hiding from users */}
            <Button 
              onClick={testDatabaseInsertion}
              disabled={isTestingDB}
              variant="outline"
              className="w-full mb-4 hidden"
            >
              {isTestingDB ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Database...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Test Database Insert
                </>
              )}
            </Button>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              Secure checkout powered by Stripe • No account required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
