
import React from 'react';
import { CheckCircle, Package, Mail, Database, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { usePaymentSuccessFlow } from '../hooks/usePaymentSuccessFlow';
import { useProductNameResolver } from '../hooks/useProductNameResolver';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const {
    paymentVerified,
    dbInsertComplete,
    emailsSent,
    processing,
    error,
    orderItems,
    orderId,
    retryProcessing
  } = usePaymentSuccessFlow();

  // Extract product IDs from order items for name resolution
  const productIds = orderItems.map(item => item.product_id || item.product_name || item.id);
  const { resolveProductName, isLoading: isResolvingNames } = useProductNameResolver(productIds);

  const ProcessingStepCard = ({ 
    title, 
    completed, 
    inProgress, 
    icon: Icon, 
    description 
  }: { 
    title: string;
    completed: boolean;
    inProgress: boolean;
    icon: any;
    description: string;
  }) => (
    <div className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${
      completed 
        ? 'bg-green-50 border-green-200' 
        : inProgress 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-gray-50 border-gray-200'
    }`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        completed 
          ? 'bg-green-500 text-white' 
          : inProgress 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-300 text-gray-600'
      }`}>
        {completed ? (
          <CheckCircle className="h-5 w-5" />
        ) : inProgress ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          {orderId && (
            <p className="text-gray-600">Order ID: <span className="font-medium">{orderId}</span></p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-8 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">Processing Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={retryProcessing}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Processing Status */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-6">Order Processing Status</h2>
            
            <div className="space-y-4">
              <ProcessingStepCard
                title="Payment Verification"
                completed={paymentVerified}
                inProgress={processing && !paymentVerified}
                icon={CheckCircle}
                description="Confirming payment with Stripe"
              />
              
              <ProcessingStepCard
                title="Order Database Entry"
                completed={dbInsertComplete}
                inProgress={processing && paymentVerified && !dbInsertComplete}
                icon={Database}
                description="Saving order details to our system"
              />
              
              <ProcessingStepCard
                title="Email Confirmations"
                completed={emailsSent}
                inProgress={processing && dbInsertComplete && !emailsSent}
                icon={Mail}
                description="Sending confirmation emails"
              />
            </div>

            {!processing && paymentVerified && dbInsertComplete && emailsSent && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 font-medium">✅ Order processing complete!</p>
                <p className="text-sm text-green-700 mt-1">
                  Your order has been successfully processed and confirmation emails have been sent.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details */}
        {orderItems.length > 0 && (
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Details
                {isResolvingNames && (
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-600 ml-2" />
                )}
              </h2>
              
              <div className="space-y-6">
                {orderItems.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="border-b pb-6 last:border-b-0">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-lg">
                          {resolveProductName(item.product_id || item.product_name || item.id)}
                        </h3>
                        <p className="text-gray-600">Quantity: {item.quantity} tons</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${typeof item.total_price === 'number' ? item.total_price.toFixed(2) : 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Delivery Information */}
                    {(item.delivery_street || item.delivery_date) && (
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <h4 className="font-medium text-gray-900">Delivery Information</h4>
                        
                        {item.delivery_street && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Address:</p>
                            <p className="text-sm text-gray-600">
                              {item.delivery_street}
                              {item.delivery_city && `, ${item.delivery_city}`}
                              {item.delivery_state && `, ${item.delivery_state}`}
                              {item.delivery_zip && ` ${item.delivery_zip}`}
                            </p>
                          </div>
                        )}
                        
                        {item.delivery_date && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Delivery Date:</p>
                            <p className="text-sm text-gray-600">
                              {new Date(item.delivery_date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        )}
                        
                        {item.delivery_name && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Contact:</p>
                            <p className="text-sm text-gray-600">
                              {item.delivery_name}
                              {item.delivery_phone && ` - ${item.delivery_phone}`}
                            </p>
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

        {/* Next Steps */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">What's Next?</h2>
            <div className="space-y-3 text-gray-700">
              <p>• You will receive confirmation emails shortly with your order details</p>
              <p>• Our team will contact you to coordinate delivery within 1-2 business days</p>
              <p>• Track your order status by saving your Order ID: <span className="font-medium">{orderId}</span></p>
              <p>• For questions, contact us at support@mygravelguy.com</p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
