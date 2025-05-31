
import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Truck, Package, MapPin, Calendar } from "lucide-react";
import { useCart } from '../contexts/CartContext';
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  id: string;
  order_id: string;
  product_name: string;
  quantity: number;
  total_price: number;
  delivery_date: string | null;
  delivery_address: any;
  contact_info: any;
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
  
  useEffect(() => {
    const processPaymentSuccess = async () => {
      // Only process if we have payment success indicators and haven't processed yet
      const sessionId = searchParams.get('session_id');
      const orderIdParam = searchParams.get('order_id');
      const paymentSuccess = searchParams.get('success');
      
      if ((sessionId || paymentSuccess === 'true') && !hasProcessedPayment) {
        setHasProcessedPayment(true);
        
        try {
          // If we have a session ID, verify the payment and update orders
          if (sessionId) {
            console.log('Processing payment success for session:', sessionId);
            
            // Call edge function to verify payment and update order status
            const { data, error } = await supabase.functions.invoke('verify-payment', {
              body: { sessionId, orderId: orderIdParam }
            });

            if (error) {
              console.error('Payment verification error:', error);
            } else {
              console.log('Payment verification result:', data);
              
              if (data?.orders) {
                setOrderItems(data.orders);
                setOrderId(data.orderId || orderIdParam);
              }
            }
          }

          // Clear the cart and show success toast
          clearCart();
          
          toast({
            title: "Payment Successful",
            description: "Thank you for your order! Your delivery has been scheduled.",
          });

          // Store in localStorage that we've processed this payment
          localStorage.setItem('lastProcessedPayment', sessionId || Date.now().toString());
          
        } catch (error) {
          console.error('Error processing payment success:', error);
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
    };

    processPaymentSuccess();
  }, [clearCart, toast, searchParams, hasProcessedPayment]);

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
              You will receive a confirmation email shortly with your delivery details.
            </p>
          </CardContent>
        </Card>

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
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Delivery Information */}
                    {(item.delivery_address || item.delivery_date) && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          Delivery Information
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {item.delivery_address && (
                            <div>
                              <h5 className="font-medium text-sm mb-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Delivery Address
                              </h5>
                              <div className="text-sm text-gray-600">
                                <div>{item.delivery_address.street}</div>
                                <div>
                                  {item.delivery_address.city}, {item.delivery_address.state} {item.delivery_address.zip}
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
                <p className="text-sm">Email: support@company.com</p>
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
