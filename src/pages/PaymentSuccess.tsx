import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Truck, Package, MapPin, Calendar, AlertCircle } from "lucide-react";
import { useCart } from '../contexts/CartContext';
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { sendBothOrderEmails, EmailResult } from '../services/emailService';

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

interface EmailStatus {
  customerEmail?: EmailResult;
  internalEmail?: EmailResult;
  overallSuccess?: boolean;
  attempted?: boolean;
}

const PaymentSuccess = () => {
  const { clearCart } = useCart();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [hasProcessedPayment, setHasProcessedPayment] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>({});
  
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
                
                // Send order confirmation emails with enhanced error handling
                try {
                  console.log('Sending order confirmation emails...');
                  setEmailStatus({ attempted: true });
                  
                  // Prepare order data for email templates
                  const orderData = {
                    order_id: data.orderId || orderIdParam || 'Unknown',
                    items: data.orders.map((item: any) => ({
                      product_name: item.product_name,
                      quantity: item.quantity,
                      total_price: item.total_price,
                      delivery_date: item.delivery_date,
                      delivery_address: item.delivery_address,
                      contact_info: item.contact_info,
                      delivery_time_preference: item.delivery_time_preference,
                      delivery_instructions: item.delivery_instructions
                    })),
                    total_amount: data.orders.reduce((sum: number, item: any) => sum + item.total_price, 0),
                    customer_email: data.orders[0]?.contact_info?.email || 'customer@example.com',
                    customer_name: data.orders[0]?.contact_info?.name
                  };
                  
                  const emailResults = await sendBothOrderEmails(orderData);
                  setEmailStatus(emailResults);
                  
                  if (emailResults.overallSuccess) {
                    console.log('Order confirmation emails sent successfully');
                  } else {
                    console.warn('Some emails failed to send:', emailResults);
                  }
                } catch (emailError) {
                  console.error('Failed to send order emails:', emailError);
                  setEmailStatus({
                    attempted: true,
                    overallSuccess: false,
                    customerEmail: {
                      success: false,
                      error: 'Email service error',
                      emailType: 'customer_confirmation',
                      recipient: 'unknown',
                      timestamp: new Date().toISOString()
                    }
                  });
                }
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

  const EmailStatusCard = () => {
    if (!emailStatus.attempted) return null;

    return (
      <Card className="mb-8 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📧 Email Notifications
          </h3>
          
          <div className="space-y-3">
            {emailStatus.customerEmail && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                emailStatus.customerEmail.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {emailStatus.customerEmail.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">Customer Confirmation Email</p>
                  <p className="text-sm text-gray-600">
                    {emailStatus.customerEmail.success 
                      ? `Sent to ${emailStatus.customerEmail.recipient}` 
                      : `Failed: ${emailStatus.customerEmail.error}`
                    }
                  </p>
                </div>
              </div>
            )}

            {emailStatus.internalEmail && (
              <div className={`flex items-center gap-3 p-3 rounded-lg ${
                emailStatus.internalEmail.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                {emailStatus.internalEmail.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <p className="font-medium">Internal Sales Notification</p>
                  <p className="text-sm text-gray-600">
                    {emailStatus.internalEmail.success 
                      ? `Sent to ${emailStatus.internalEmail.recipient}` 
                      : `Failed: ${emailStatus.internalEmail.error}`
                    }
                  </p>
                </div>
              </div>
            )}

            {!emailStatus.overallSuccess && emailStatus.attempted && (
              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Some email notifications may have failed to send. 
                  Your order is still confirmed and being processed. Our team will contact you directly if needed.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
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
          </CardContent>
        </Card>

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
