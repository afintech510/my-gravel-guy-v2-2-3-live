
import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { OrderService } from '@/services/orderService';
import { GroupedOrder } from '@/types/order.types';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [order, setOrder] = useState<GroupedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  
  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching order for PaymentSuccess:', orderId);
        const fetchedOrder = await OrderService.fetchOrderById(orderId);
        
        if (fetchedOrder) {
          // The OrderService.fetchOrderById already resolves product names
          setOrder(fetchedOrder);
          console.log('Order fetched with resolved product names:', fetchedOrder);
        } else {
          toast({
            title: "Order Not Found",
            description: "We couldn't find your order details.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching order:', error);
        toast({
          title: "Error",
          description: "Failed to load order details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 text-lg">
            Thank you for your order. We've received your payment and will process your delivery soon.
          </p>
        </div>

        {/* Order Details */}
        {order && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Order ID:</span>
                <Badge variant="outline">{order.order_id}</Badge>
              </div>
              
              <Separator />
              
              {/* Order Items with resolved product names */}
              <div className="space-y-3">
                <h4 className="font-semibold">Items Ordered:</h4>
                {order.items.map((item, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h5 className="font-medium">{item.product_name}</h5>
                        <p className="text-sm text-gray-600">
                          Quantity: {item.quantity} {item.unit}
                        </p>
                      </div>
                      <span className="font-semibold">${item.total_price.toFixed(2)}</span>
                    </div>
                    
                    {item.delivery_address && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium">Delivery Address:</p>
                            <p className="text-gray-600">
                              {item.delivery_address.street}<br />
                              {item.delivery_address.city}, {item.delivery_address.state} {item.delivery_address.zip}
                            </p>
                          </div>
                        </div>
                        
                        {item.delivery_date && (
                          <div className="flex items-center gap-2 mt-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div className="text-sm">
                              <span className="font-medium">Delivery Date: </span>
                              <span className="text-gray-600">
                                {new Date(item.delivery_date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-green-600">${order.total_price.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2 mt-1">
                  <span className="text-blue-600 font-semibold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold">Order Confirmation</h4>
                  <p className="text-gray-600 text-sm">
                    You'll receive an email confirmation with your order details within the next few minutes.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2 mt-1">
                  <span className="text-blue-600 font-semibold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold">Processing</h4>
                  <p className="text-gray-600 text-sm">
                    Our team will prepare your materials and coordinate the delivery schedule.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 rounded-full p-2 mt-1">
                  <span className="text-blue-600 font-semibold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold">Delivery</h4>
                  <p className="text-gray-600 text-sm">
                    We'll contact you to confirm the delivery details and provide tracking information.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-green-600 hover:bg-green-700">
            <Link to="/products">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link to="/contact">
              Contact Support
            </Link>
          </Button>
        </div>

        {/* Support Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Questions about your order? Contact us at{' '}
            <a href="mailto:support@mygravelguy.com" className="text-green-600 hover:underline">
              support@mygravelguy.com
            </a>{' '}
            or call{' '}
            <a href="tel:+1-555-123-4567" className="text-green-600 hover:underline">
              (555) 123-4567
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
