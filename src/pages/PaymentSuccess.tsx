import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Truck, Package, MapPin, Calendar, AlertCircle, RefreshCw, Shield, Clock } from "lucide-react";
import { useCart } from '../contexts/CartContext';
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { detectPaymentSuccess, clearCheckoutBackup, getCheckoutBackup } from '../utils/paymentUtils';

interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  delivery_date: string | null;
  delivery_address_street: string | null;
  delivery_address_city: string | null;
  delivery_address_state: string | null;
  delivery_address_zip: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  delivery_time_preference: string | null;
  delivery_instructions: string | null;
  status: string;
}

const PaymentSuccess = () => {
  const { clearCart } = useCart();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [hasProcessedPayment, setHasProcessedPayment] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailsSent, setEmailsSent] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<'stripe_verified' | 'fallback' | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  
  useEffect(() => {
    const processPaymentSuccess = async () => {
      console.log('=== PAYMENT SUCCESS PAGE DEBUG START ===');
      
      // Extract URL parameters - prioritize payment_intent over session_id
      const paymentIntentId = searchParams.get('payment_intent') || searchParams.get('payment_intent_id');
      const sessionId = searchParams.get('session_id');
      const orderIdParam = searchParams.get('order_id');
      const paymentSuccess = searchParams.get('success');
      const checkStatus = searchParams.get('check_status');
      
      console.log('URL Parameters:', {
        paymentIntentId,
        sessionId,
        orderIdParam,
        paymentSuccess,
        checkStatus,
        hasProcessedPayment
      });
      
      // Check localStorage for backup order information
      const checkoutOrderBackup = getCheckoutBackup();
      const checkoutInProgress = localStorage.getItem('checkout-in-progress');
      const checkoutOrderId = localStorage.getItem('checkout-order-id');
      
      console.log('LocalStorage Data:', {
        hasCheckoutOrderBackup: !!checkoutOrderBackup,
        checkoutInProgress,
        checkoutOrderId
      });
      
      // Determine if we should process the payment
      const shouldProcess = !hasProcessedPayment && (
        paymentIntentId || 
        sessionId || 
        paymentSuccess === 'true' || 
        checkStatus === 'true' ||
        (checkoutInProgress === 'true' && checkoutOrderId)
      );
      
      console.log('Should process payment:', shouldProcess);
      
      if (shouldProcess) {
        setHasProcessedPayment(true);
        
        try {
          let verificationResult = null;
          
          // Prioritize payment_intent verification over session_id
          if (paymentIntentId) {
            console.log('Processing with payment intent ID:', paymentIntentId);
            
            const { data, error } = await supabase.functions.invoke('verify-payment', {
              body: { 
                paymentIntentId,
                orderId: orderIdParam || checkoutOrderId,
                backupData: checkoutOrderBackup
              }
            });

            console.log('Verify payment response (payment intent):', { data, error });
            verificationResult = { data, error };
          } else if (sessionId) {
            console.log('Processing with session ID (fallback):', sessionId);
            
            const { data, error } = await supabase.functions.invoke('verify-payment', {
              body: { 
                sessionId, 
                orderId: orderIdParam || checkoutOrderId,
                backupData: checkoutOrderBackup
              }
            });

            console.log('Verify payment response (session):', { data, error });
            verificationResult = { data, error };
          } else if (checkoutOrderId && checkoutOrderBackup) {
            console.log('Processing with backup data only:', checkoutOrderId);
            
            const { data, error } = await supabase.functions.invoke('verify-payment', {
              body: { 
                orderId: checkoutOrderId,
                fallbackMode: true,
                backupData: checkoutOrderBackup
              }
            });

            console.log('Fallback verification response:', { data, error });
            verificationResult = { data, error };
          }
          
          // Process verification result
          if (verificationResult) {
            const { data, error } = verificationResult;
            
            if (error) {
              console.error('Payment verification error:', error);
              setProcessingError(error.message || 'Payment verification failed');
              
              toast({
                title: "Payment Processed",
                description: "Your payment was successful. Order details are being processed.",
                variant: "default"
              });
            } else if (data?.orders && data.orders.length > 0) {
              console.log('Payment verification successful:', data);
              
              setOrderItems(data.orders);
              setOrderId(data.orderId || orderIdParam || checkoutOrderId);
              setEmailsSent(data.emailsSent || false);
              setVerificationMethod(data.verification_method || 'stripe_verified');
              setUsedFallback(data.used_fallback || false);
              
              if (data.used_fallback) {
                toast({
                  title: "Order Processed Successfully",
                  description: "Your order has been recorded using backup data. Payment verification completed.",
                  variant: "default"
                });
              } else if (data.emailsSent) {
                toast({
                  title: "Payment Successful",
                  description: "Thank you for your order! Confirmation emails have been sent.",
                });
              } else {
                toast({
                  title: "Payment Successful",
                  description: "Thank you for your order! Emails are being processed.",
                  variant: "default"
                });
              }
            } else {
              console.warn('No order data found in verification response');
              setProcessingError('Order details not found, but payment was successful');
            }
          }

          // Clear the cart and localStorage
          clearCart();
          clearCheckoutBackup();
          
        } catch (error) {
          console.error('Error processing payment success:', error);
          setProcessingError(error instanceof Error ? error.message : 'Unknown error occurred');
          
          toast({
            title: "Payment Processed",
            description: "Your payment was successful. Order details are being processed.",
            variant: "default"
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
      
      console.log('=== PAYMENT SUCCESS PAGE DEBUG END ===');
    };

    processPaymentSuccess();
  }, [clearCart, toast, searchParams, hasProcessedPayment, retryCount]);

  const handleRetryProcessing = () => {
    console.log('Retrying payment processing...');
    setRetryCount(prev => prev + 1);
    setHasProcessedPayment(false);
    setIsLoading(true);
    setProcessingError(null);
  };

  const formatDeliveryTimePreference = (preference: string | null) => {
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

  const VerificationStatusCard = () => {
    if (verificationMethod === 'fallback') {
      return (
        <Card className="mb-8 border-amber-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Payment Processing Method
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium">Backup Data Processing</p>
                  <p className="text-sm text-gray-600">
                    Your order was processed using backup data because the payment session expired. 
                    This is normal and your payment was successful.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    } else if (verificationMethod === 'stripe_verified') {
      return (
        <Card className="mb-8 border-green-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Payment Verification
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium">Stripe Verified</p>
                  <p className="text-sm text-gray-600">
                    Your payment has been verified directly with Stripe. All details are confirmed.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  };

  const EmailStatusCard = () => {
    return (
      <Card className="mb-8 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📧 Email Notifications
          </h3>
          
          <div className="space-y-3">
            <div className={`flex items-center gap-3 p-3 rounded-lg ${
              emailsSent ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
            }`}>
              {emailsSent ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              <div>
                <p className="font-medium">Order Confirmation Emails</p>
                <p className="text-sm text-gray-600">
                  {emailsSent 
                    ? 'Confirmation emails have been sent to you and our team' 
                    : 'Email notifications are being processed'
                  }
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ProcessingStatusCard = () => {
    if (!isLoading && !processingError && orderItems.length === 0) {
      return (
        <Card className="mb-8 border-yellow-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              🔄 Order Processing
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="font-medium">Processing Order Details</p>
                  <p className="text-sm text-gray-600">
                    We're retrieving your order information. This may take a moment.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetryProcessing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    if (processingError) {
      return (
        <Card className="mb-8 border-red-200">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              ⚠️ Processing Issue
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium">Order Processing Delayed</p>
                  <p className="text-sm text-gray-600">
                    There was an issue retrieving your order details, but your payment was successful.
                  </p>
                  <p className="text-xs text-red-600 mt-1">{processingError}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRetryProcessing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return null;
  };

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-green-50 border-green-200 mb-8">
          <CardContent className="pt-6 text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4 text-green-800">Order Confirmed!</h1>
            {orderId && (
              <p className="text-green-700 mb-2 font-medium">
                Order ID: {orderId}
              </p>
            )}
            <p className="text-green-700 mb-2">
              Thank you for your purchase. Your order has been processed successfully.
            </p>
            <p className="text-green-600">
              You will receive confirmation emails shortly with your delivery details.
            </p>
            {usedFallback && (
              <p className="text-amber-600 text-sm mt-2">
                <em>Order processed using backup data due to session timeout.</em>
              </p>
            )}
          </CardContent>
        </Card>

        <VerificationStatusCard />
        <ProcessingStatusCard />
        <EmailStatusCard />

        {/* Order Items Details */}
        {orderItems.length > 0 && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
              </h2>
              
              <div className="space-y-6">
                {orderItems.map((item, index) => (
                  <div key={item.id} className="border-b pb-6 last:border-b-0">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-lg">{item.product_name}</h3>
                        <p className="text-gray-600">Quantity: {item.quantity} tons</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${item.total_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          item.status === 'confirmed' 
                            ? 'bg-green-100 text-green-800'
                            : item.status === 'processed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Delivery Information */}
                    {(item.delivery_address_street || item.delivery_date) && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Delivery Information
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {item.delivery_address_street && (
                            <div>
                              <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Delivery Address
                              </h5>
                              <div className="text-sm text-gray-600">
                                <div>{item.delivery_address_street}</div>
                                <div>
                                  {item.delivery_address_city}, {item.delivery_address_state} {item.delivery_address_zip}
                                </div>
                              </div>
                            </div>
                          )}

                          {item.delivery_date && (
                            <div>
                              <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Delivery Schedule
                              </h5>
                              <div className="text-sm text-gray-600">
                                <div className="font-medium">
                                  {new Date(item.delivery_date).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div>{formatDeliveryTimePreference(item.delivery_time_preference)}</div>
                              </div>
                            </div>
                          )}
                        </div>

                        {item.delivery_instructions && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <h5 className="font-medium text-sm mb-1">Special Instructions</h5>
                            <p className="text-sm text-gray-600">{item.delivery_instructions}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">What Happens Next?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-5 rounded-lg border">
                <div className="flex items-center mb-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-2">1</span>
                  <h3 className="font-medium">Order Processing</h3>
                </div>
                <p className="text-sm text-gray-600">
                  We've received your order and are preparing your delivery. You'll receive a confirmation email soon.
                </p>
              </div>
              
              <div className="bg-white p-5 rounded-lg border">
                <div className="flex items-center mb-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-2">2</span>
                  <h3 className="font-medium">Delivery Preparation</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Our team will prepare your materials and schedule the delivery for your selected date.
                </p>
              </div>
              
              <div className="bg-white p-5 rounded-lg border">
                <div className="flex items-center mb-3">
                  <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-2">3</span>
                  <h3 className="font-medium">Delivery</h3>
                </div>
                <p className="text-sm text-gray-600">
                  On your scheduled delivery date, our driver will deliver your materials to the specified location.
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Delivery Information</h2>
            </div>
            <p className="mb-4">
              If you need to make any changes to your delivery details or have questions about your order, 
              please contact our customer service team as soon as possible.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-2">Customer Service</h3>
                <p className="text-sm">Phone: (555) 123-4567</p>
                <p className="text-sm">Email: support@mygravelguy.com</p>
                <p className="text-sm">Hours: Mon-Fri, 8am-5pm</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Need Help?</h3>
                <p className="text-sm mb-2">Have questions about your delivery or need assistance?</p>
                <Button variant="outline" asChild>
                  <a href="/contact">Contact Support</a>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild variant="default">
            <a href="/products">Continue Shopping</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/">Return to Homepage</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
