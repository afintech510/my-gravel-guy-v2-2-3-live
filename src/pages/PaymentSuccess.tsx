import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Truck, Calendar, AlertCircle, Loader2 } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  clearCheckoutData, 
  markOrderAsProcessed, 
  isOrderProcessed
} from '../utils/localStorageUtils';
import { getCheckoutBackup } from '../utils/paymentUtils';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { clearCart } = useCart();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPaymentSuccess = async () => {
      try {
        console.log('=== PAYMENT SUCCESS PAGE PROCESSING START ===');
        
        // Get URL parameters
        const urlParams = new URLSearchParams(location.search);
        const paymentIntentId = urlParams.get('payment_intent') || urlParams.get('payment_intent_id');
        const sessionId = urlParams.get('session_id');
        const orderId = urlParams.get('order_id');
        
        console.log('URL Parameters:', { paymentIntentId, sessionId, orderId });
        
        // Determine the order ID to check
        let orderIdToCheck = orderId;
        
        // If no order ID in URL, try to get it from backup data
        if (!orderIdToCheck) {
          const backupData = getCheckoutBackup();
          if (backupData?.orderId) {
            orderIdToCheck = backupData.orderId;
            console.log('Using order ID from backup:', orderIdToCheck);
          }
        }
        
        // Check if this order has already been processed
        if (orderIdToCheck && isOrderProcessed(orderIdToCheck)) {
          console.log('Order already processed, skipping duplicate processing:', orderIdToCheck);
          
          // Just show success message without reprocessing
          setOrderDetails({
            orderId: orderIdToCheck,
            status: 'completed',
            message: 'Your order has been successfully processed!'
          });
          setIsProcessing(false);
          return;
        }
        
        // Only proceed with verification if we have payment details and haven't processed this order
        if ((paymentIntentId || sessionId) && orderIdToCheck) {
          console.log('Verifying payment with backend...');
          
          // Get backup data for verification
          const backupData = getCheckoutBackup();
          
          // Call verify-payment function with skipDbInsert flag to prevent duplicate DB entries
          const { data: verificationResult, error: verifyError } = await supabase.functions.invoke('verify-payment', {
            body: {
              paymentIntentId: paymentIntentId || sessionId,
              orderId: orderIdToCheck,
              backupData: backupData,
              skipDbInsert: true // Skip database insertion to prevent duplicates
            }
          });
          
          if (verifyError) {
            console.error('Payment verification error:', verifyError);
            throw new Error(`Payment verification failed: ${verifyError.message}`);
          }
          
          console.log('Payment verification result:', verificationResult);
          
          if (verificationResult?.success && verificationResult?.paymentVerified) {
            // Mark this order as processed to prevent future duplicates
            markOrderAsProcessed(orderIdToCheck);
            
            // Clear cart and checkout data
            console.log('Payment verified successfully, clearing cart and checkout data...');
            clearCart();
            clearCheckoutData();
            
            // Set success details
            setOrderDetails({
              orderId: orderIdToCheck,
              status: 'completed',
              paymentMethod: verificationResult.verification_method,
              message: 'Your payment has been processed successfully!',
              items: backupData?.items || []
            });
            
            // Show success toast
            toast({
              title: "Payment Successful!",
              description: `Order ${orderIdToCheck} has been confirmed.`,
              className: "border-green-500 border-2 shadow-[0_0_15px_rgba(20,255,106,0.5)]"
            });
            
          } else {
            throw new Error('Payment could not be verified');
          }
          
        } else {
          // No payment details found, but check for backup data
          const backupData = getCheckoutBackup();
          if (backupData?.orderId) {
            console.log('No payment verification needed, using backup data for display');
            
            setOrderDetails({
              orderId: backupData.orderId,
              status: 'pending_verification',
              message: 'Your order is being processed. You will receive a confirmation email shortly.',
              items: backupData.items || []
            });
          } else {
            throw new Error('No order information found');
          }
        }
        
      } catch (error) {
        console.error('Payment success processing error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred processing your payment');
        
        toast({
          variant: "destructive",
          title: "Processing Error",
          description: "There was an issue processing your payment confirmation. Please contact support if this persists.",
        });
      } finally {
        setIsProcessing(false);
        console.log('=== PAYMENT SUCCESS PAGE PROCESSING END ===');
      }
    };

    processPaymentSuccess();
  }, [location.search, clearCart, toast]);

  // Show loading state
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-600" />
              <h2 className="text-xl font-semibold">Processing Your Order</h2>
              <p className="text-gray-600">Please wait while we confirm your payment...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-red-600" />
              <h2 className="text-xl font-semibold text-red-800">Processing Error</h2>
              <p className="text-red-600">{error}</p>
              <div className="space-y-2">
                <Button onClick={() => navigate('/cart')} className="w-full">
                  Return to Cart
                </Button>
                <Button variant="outline" onClick={() => navigate('/contact')} className="w-full">
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show success state
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-green-50 text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">
              Order Confirmed!
            </CardTitle>
            <p className="text-green-700 mt-2">
              {orderDetails?.message || 'Your order has been successfully placed.'}
            </p>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Order Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Order ID:</span>
                    <p className="text-gray-900">{orderDetails?.orderId}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <p className="text-gray-900 capitalize">
                      {orderDetails?.status === 'completed' ? 'Confirmed' : 'Processing'}
                    </p>
                  </div>
                </div>
              </div>

              {/* What's Next */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">What happens next?</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Order Processing</p>
                      <p className="text-sm text-blue-700">
                        We're preparing your materials and will contact you to confirm delivery details.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-orange-900">Delivery Scheduling</p>
                      <p className="text-sm text-orange-700">
                        Our team will call you within 24 hours to schedule your delivery.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <Truck className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Delivery</p>
                      <p className="text-sm text-green-700">
                        Your materials will be delivered directly to your specified location.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button onClick={() => navigate('/')} className="flex-1">
                  Continue Shopping
                </Button>
                <Button variant="outline" onClick={() => navigate('/contact')} className="flex-1">
                  Contact Us
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Additional Info */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            Questions about your order? Contact us at{' '}
            <a href="tel:+1-555-0123" className="text-green-600 hover:text-green-700">
              (555) 123-4567
            </a>{' '}
            or{' '}
            <a href="mailto:orders@mygravelguy.com" className="text-green-600 hover:text-green-700">
              orders@mygravelguy.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
