import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, MapPin, Calendar, Clock, CreditCard } from 'lucide-react';
import { useProductNameResolver } from '@/hooks/useProductNameResolver';

interface QuoteItem {
  id: string;
  product_id: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  delivery_name: string;
  delivery_email: string;
  delivery_street: string;
  delivery_city: string;
  delivery_state: string;
  delivery_zip: string;
  delivery_date: string;
  delivery_time_preference: string;
  delivery_instructions: string;
  quote_expires_at: string;
  notes: string;
}

const QuoteCheckout = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  // Get product names resolver
  const productIds = quoteItems.map(item => item.product_id);
  const { resolveProductName } = useProductNameResolver(productIds);

  useEffect(() => {
    if (!quoteId) {
      toast.error('Invalid quote ID');
      navigate('/');
      return;
    }

    fetchQuoteData();
  }, [quoteId]);

  const fetchQuoteData = async () => {
    try {
      // Use pattern matching to fetch all related items (base + suffixed orders)
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .like('order_id', `${quoteId}%`)
        .eq('status', 'Quote');

      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('Quote not found or has expired');
        navigate('/');
        return;
      }

      setQuoteItems(data);
    } catch (error) {
      console.error('Error fetching quote:', error);
      toast.error('Failed to load quote details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuote = async () => {
    if (!quoteId) return;

    setProcessingPayment(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-quote-checkout', {
        body: { quoteId }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Failed to process payment. Please try again.');
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading quote details...</span>
        </div>
      </div>
    );
  }

  if (quoteItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Quote Not Found</h2>
            <p className="text-muted-foreground mb-4">
              This quote may have expired or is no longer available.
            </p>
            <Button onClick={() => navigate('/')}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const firstItem = quoteItems[0];
  const totalAmount = quoteItems.reduce((sum, item) => sum + item.total_price, 0);
  const isExpired = firstItem.quote_expires_at && new Date(firstItem.quote_expires_at + 'T00:00:00') < new Date();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Quote Review & Payment</h1>
          <p className="text-muted-foreground">
            Review your quote details and proceed with payment
          </p>
          <Badge variant={isExpired ? "destructive" : "secondary"} className="mt-2">
            Quote ID: {quoteId}
          </Badge>
        </div>

        {isExpired && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <div className="text-center text-destructive">
                <h3 className="font-semibold mb-2">Quote Expired</h3>
                <p>This quote expired on {new Date(firstItem.quote_expires_at + 'T00:00:00').toLocaleDateString()}. 
                   Please contact us for a new quote.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Quote Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span>Quote Items</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {quoteItems.map((item, index) => (
                <div key={item.id}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{resolveProductName(item.product_id)}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit} @ ${item.unit_price.toFixed(2)} per {item.unit}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Note: {item.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="font-semibold">${item.total_price.toFixed(2)}</span>
                    </div>
                  </div>
                  {index < quoteItems.length - 1 && (
                    <Separator className="mt-4" />
                  )}
                </div>
              ))}
              
              <Separator />
              
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total Amount</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Delivery Contact</h4>
                <p>{firstItem.delivery_name}</p>
                <p className="text-muted-foreground">{firstItem.delivery_email}</p>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Delivery Address</h4>
                <p>{firstItem.delivery_street}</p>
                <p>{firstItem.delivery_city}, {firstItem.delivery_state} {firstItem.delivery_zip}</p>
              </div>

              {firstItem.delivery_date && (
                <>
                  <Separator />
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Delivery Date: {new Date(firstItem.delivery_date + 'T00:00:00').toLocaleDateString()}</span>
                  </div>
                </>
              )}

              {firstItem.delivery_time_preference && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Time Preference: {firstItem.delivery_time_preference}</span>
                </div>
              )}

              {firstItem.delivery_instructions && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Delivery Instructions</h4>
                    <p className="text-muted-foreground">{firstItem.delivery_instructions}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Actions */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              {!isExpired ? (
                <>
                  <div className="flex items-center justify-center space-x-2 text-lg font-semibold">
                    <CreditCard className="h-5 w-5" />
                    <span>Total: ${totalAmount.toFixed(2)}</span>
                  </div>
                  <Button 
                    size="lg" 
                    onClick={handleAcceptQuote}
                    disabled={processingPayment}
                    className="w-full sm:w-auto px-8"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Accept Quote & Pay Now'
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    You will be redirected to our secure payment processor
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    This quote has expired. Please contact us for a new quote.
                  </p>
                  <Button variant="outline" onClick={() => navigate('/contact')}>
                    Contact Us
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QuoteCheckout;