import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, MapPin, Calendar, Clock, CreditCard, MessageSquare, User, Edit2, Check, X } from 'lucide-react';
import { useProductNameResolver } from '@/hooks/useProductNameResolver';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuoteItem {
  id: string;
  product_id: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  delivery_name: string;
  delivery_email: string;
  delivery_phone: string;
  delivery_street: string;
  delivery_city: string;
  delivery_state: string;
  delivery_zip: string;
  delivery_date: string;
  delivery_time_preference: string;
  delivery_instructions: string;
  quote_expires_at: string;
  quote_notes: string;
  notes: string;
}

interface DeliveryFormData {
  delivery_name: string;
  delivery_email: string;
  delivery_phone: string;
  delivery_street: string;
  delivery_city: string;
  delivery_state: string;
  delivery_zip: string;
  delivery_date: string;
  delivery_time_preference: string;
  delivery_instructions: string;
}

const QuoteCheckout = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isEditingDelivery, setIsEditingDelivery] = useState(false);
  const [isSavingDelivery, setIsSavingDelivery] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState<DeliveryFormData>({
    delivery_name: '',
    delivery_email: '',
    delivery_phone: '',
    delivery_street: '',
    delivery_city: '',
    delivery_state: '',
    delivery_zip: '',
    delivery_date: '',
    delivery_time_preference: '',
    delivery_instructions: '',
  });
  
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
      
      // Initialize delivery form with first item's data
      const firstItem = data[0];
      setDeliveryForm({
        delivery_name: firstItem.delivery_name || '',
        delivery_email: firstItem.delivery_email || '',
        delivery_phone: firstItem.delivery_phone || '',
        delivery_street: firstItem.delivery_street || '',
        delivery_city: firstItem.delivery_city || '',
        delivery_state: firstItem.delivery_state || '',
        delivery_zip: firstItem.delivery_zip || '',
        delivery_date: firstItem.delivery_date || '',
        delivery_time_preference: firstItem.delivery_time_preference || '',
        delivery_instructions: firstItem.delivery_instructions || '',
      });
    } catch (error) {
      console.error('Error fetching quote:', error);
      toast.error('Failed to load quote details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliveryFormChange = (field: keyof DeliveryFormData, value: string) => {
    setDeliveryForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveDeliveryInfo = async () => {
    if (!quoteId) return;
    
    setIsSavingDelivery(true);
    try {
      // Update all quote items with the new delivery info
      const updatePromises = quoteItems.map(item => 
        supabase
          .from('orders')
          .update({
            delivery_name: deliveryForm.delivery_name,
            delivery_email: deliveryForm.delivery_email,
            delivery_phone: deliveryForm.delivery_phone,
            delivery_street: deliveryForm.delivery_street,
            delivery_city: deliveryForm.delivery_city,
            delivery_state: deliveryForm.delivery_state,
            delivery_zip: deliveryForm.delivery_zip,
            delivery_date: deliveryForm.delivery_date,
            delivery_time_preference: deliveryForm.delivery_time_preference,
            delivery_instructions: deliveryForm.delivery_instructions,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id)
      );

      await Promise.all(updatePromises);
      
      // Update local state
      setQuoteItems(prev => prev.map(item => ({
        ...item,
        ...deliveryForm,
      })));
      
      setIsEditingDelivery(false);
      toast.success('Delivery information updated');
    } catch (error) {
      console.error('Error updating delivery info:', error);
      toast.error('Failed to update delivery information');
    } finally {
      setIsSavingDelivery(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form to current values
    const firstItem = quoteItems[0];
    setDeliveryForm({
      delivery_name: firstItem.delivery_name || '',
      delivery_email: firstItem.delivery_email || '',
      delivery_phone: firstItem.delivery_phone || '',
      delivery_street: firstItem.delivery_street || '',
      delivery_city: firstItem.delivery_city || '',
      delivery_state: firstItem.delivery_state || '',
      delivery_zip: firstItem.delivery_zip || '',
      delivery_date: firstItem.delivery_date || '',
      delivery_time_preference: firstItem.delivery_time_preference || '',
      delivery_instructions: firstItem.delivery_instructions || '',
    });
    setIsEditingDelivery(false);
  };

  const handleAcceptQuote = async () => {
    if (!quoteId) return;

    // Validate required fields
    if (!deliveryForm.delivery_name || !deliveryForm.delivery_email || !deliveryForm.delivery_phone) {
      toast.error('Please fill in all required contact information');
      setIsEditingDelivery(true);
      return;
    }

    if (!deliveryForm.delivery_street || !deliveryForm.delivery_city || !deliveryForm.delivery_state || !deliveryForm.delivery_zip) {
      toast.error('Please fill in the complete delivery address');
      setIsEditingDelivery(true);
      return;
    }

    setProcessingPayment(true);
    try {
      // Save any pending delivery changes first
      if (isEditingDelivery) {
        await handleSaveDeliveryInfo();
      }

      const { data, error } = await supabase.functions.invoke('create-quote-checkout', {
        body: { quoteId }
      });

      if (error) throw error;

      if (data?.url && data?.backupData) {
        // Store backup data in localStorage for quote conversion
        localStorage.setItem('checkout-backup', JSON.stringify(data.backupData));
        localStorage.setItem('checkout-in-progress', 'true');
        localStorage.setItem('checkout-order-id', data.backupData.orderId);
        
        console.log('Quote checkout backup data stored:', data.backupData);
        
        window.location.href = data.url;
      } else if (data?.url) {
        // Fallback for backward compatibility
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

  const timePreferences = [
    'Morning (8am-12pm)',
    'Afternoon (12pm-5pm)',
    'Anytime',
    'Call to Schedule',
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Quote Review & Payment</h1>
          <p className="text-muted-foreground">
            Review and update your delivery details, then proceed with payment
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

        {/* Quote Notes */}
        {firstItem.quote_notes && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-5 w-5 mr-2" />
                Quote Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed">{firstItem.quote_notes}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
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

          {/* Delivery Information - Editable */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Delivery Information
                </div>
                {!isEditingDelivery && !isExpired && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditingDelivery(true)}
                    className="text-primary"
                  >
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingDelivery ? (
                /* Editing Mode */
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center text-sm">
                      <User className="h-4 w-4 mr-2" />
                      Contact Information
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="delivery_name">Name *</Label>
                        <Input
                          id="delivery_name"
                          value={deliveryForm.delivery_name}
                          onChange={(e) => handleDeliveryFormChange('delivery_name', e.target.value)}
                          placeholder="Full Name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="delivery_email">Email *</Label>
                        <Input
                          id="delivery_email"
                          type="email"
                          value={deliveryForm.delivery_email}
                          onChange={(e) => handleDeliveryFormChange('delivery_email', e.target.value)}
                          placeholder="email@example.com"
                        />
                      </div>
                      <div>
                        <Label htmlFor="delivery_phone">Phone *</Label>
                        <Input
                          id="delivery_phone"
                          type="tel"
                          value={deliveryForm.delivery_phone}
                          onChange={(e) => handleDeliveryFormChange('delivery_phone', e.target.value)}
                          placeholder="(555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-2" />
                      Delivery Address
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="delivery_street">Street Address *</Label>
                        <Input
                          id="delivery_street"
                          value={deliveryForm.delivery_street}
                          onChange={(e) => handleDeliveryFormChange('delivery_street', e.target.value)}
                          placeholder="123 Main St"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="delivery_city">City *</Label>
                          <Input
                            id="delivery_city"
                            value={deliveryForm.delivery_city}
                            onChange={(e) => handleDeliveryFormChange('delivery_city', e.target.value)}
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <Label htmlFor="delivery_state">State *</Label>
                          <Input
                            id="delivery_state"
                            value={deliveryForm.delivery_state}
                            onChange={(e) => handleDeliveryFormChange('delivery_state', e.target.value)}
                            placeholder="State"
                            maxLength={2}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="delivery_zip">ZIP Code *</Label>
                        <Input
                          id="delivery_zip"
                          value={deliveryForm.delivery_zip}
                          onChange={(e) => handleDeliveryFormChange('delivery_zip', e.target.value)}
                          placeholder="12345"
                          maxLength={5}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center text-sm">
                      <Calendar className="h-4 w-4 mr-2" />
                      Scheduling
                    </h4>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="delivery_date">Preferred Delivery Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !deliveryForm.delivery_date && "text-muted-foreground"
                              )}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              {deliveryForm.delivery_date ? (
                                format(new Date(deliveryForm.delivery_date + 'T00:00:00'), 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={deliveryForm.delivery_date ? new Date(deliveryForm.delivery_date + 'T00:00:00') : undefined}
                              onSelect={(date) => {
                                if (date) {
                                  handleDeliveryFormChange('delivery_date', format(date, 'yyyy-MM-dd'));
                                }
                              }}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div>
                        <Label htmlFor="delivery_time">Time Preference</Label>
                        <select
                          id="delivery_time"
                          value={deliveryForm.delivery_time_preference}
                          onChange={(e) => handleDeliveryFormChange('delivery_time_preference', e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                        >
                          <option value="">Select time preference</option>
                          {timePreferences.map((time) => (
                            <option key={time} value={time}>{time}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="delivery_instructions">Delivery Instructions / Notes</Label>
                    <Textarea
                      id="delivery_instructions"
                      value={deliveryForm.delivery_instructions}
                      onChange={(e) => handleDeliveryFormChange('delivery_instructions', e.target.value)}
                      placeholder="Gate code, placement preferences, special instructions..."
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleSaveDeliveryInfo} 
                      disabled={isSavingDelivery}
                      className="flex-1"
                    >
                      {isSavingDelivery ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={handleCancelEdit}
                      disabled={isSavingDelivery}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* Display Mode */
                <>
                  <div>
                    <h4 className="font-medium mb-2">Delivery Contact</h4>
                    <p>{deliveryForm.delivery_name || 'Not provided'}</p>
                    <p className="text-muted-foreground">{deliveryForm.delivery_email || 'No email'}</p>
                    <p className="text-muted-foreground">{deliveryForm.delivery_phone || 'No phone'}</p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-2">Delivery Address</h4>
                    <p>{deliveryForm.delivery_street || 'Not provided'}</p>
                    <p>
                      {[deliveryForm.delivery_city, deliveryForm.delivery_state, deliveryForm.delivery_zip]
                        .filter(Boolean)
                        .join(', ') || 'No address'}
                    </p>
                  </div>

                  {deliveryForm.delivery_date && (
                    <>
                      <Separator />
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Delivery Date: {format(new Date(deliveryForm.delivery_date + 'T00:00:00'), 'PPP')}</span>
                      </div>
                    </>
                  )}

                  {deliveryForm.delivery_time_preference && (
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>Time Preference: {deliveryForm.delivery_time_preference}</span>
                    </div>
                  )}

                  {deliveryForm.delivery_instructions && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Delivery Instructions</h4>
                        <p className="text-muted-foreground">{deliveryForm.delivery_instructions}</p>
                      </div>
                    </>
                  )}
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
                    disabled={processingPayment || isEditingDelivery}
                    className="w-full sm:w-auto px-8"
                  >
                    {processingPayment ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : isEditingDelivery ? (
                      'Save delivery info first'
                    ) : (
                      'Accept Quote & Pay Now'
                    )}
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    {isEditingDelivery 
                      ? 'Please save your delivery information before proceeding to payment'
                      : 'You will be redirected to our secure payment processor'
                    }
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