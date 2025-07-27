import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, Trash2, ArrowLeft, CreditCard, Save, FileText, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ProductSelector } from './ProductSelector';
import { OrderPricingCalculator } from './OrderPricingCalculator';
import { OrderService } from '@/services/orderService';
import { createManualOrderRecords } from '@/services/orderInsertService';
import { formatOrderItemsForStripe } from '@/utils/paymentUtils';
import { supabase } from '@/integrations/supabase/client';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  billingName?: string;
  billingEmail?: string;
}

interface DeliveryInfo {
  street: string;
  city: string;
  state: string;
  zip: string;
  date: Date | null;
  timePreference: string;
  instructions: string;
  phone: string;
  name: string;
}

export function ManualOrderForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
  });
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    street: '',
    city: '',
    state: '',
    zip: '',
    date: null,
    timePreference: 'anytime',
    instructions: '',
    phone: '',
    name: '',
  });
  const [notes, setNotes] = useState('');
  const [salesPerson, setSalesPerson] = useState('');
  const [salesPersons, setSalesPersons] = useState<string[]>(['Adam', 'Ronnie']);
  const [isLoading, setIsLoading] = useState(false);

  const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);

  useEffect(() => {
    const loadSalesPersons = async () => {
      try {
        const uniquePersons = await OrderService.getUniqueSalesPersons();
        if (uniquePersons.length > 0) {
          setSalesPersons(uniquePersons);
        }
      } catch (error) {
        console.error('Error loading sales persons:', error);
      }
    };
    loadSalesPersons();
  }, []);

  const handleAddProduct = (product: any, quantity: number, customPrice?: number) => {
    const unitPrice = customPrice || product.price;
    const newItem: OrderItem = {
      id: Date.now().toString(),
      productId: product.id,
      productName: product.name,
      quantity,
      unit: product.unit || 'ton',
      unitPrice,
      totalPrice: unitPrice * quantity,
    };
    setOrderItems([...orderItems, newItem]);
  };

  const handleRemoveProduct = (id: string) => {
    setOrderItems(orderItems.filter(item => item.id !== id));
  };

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setOrderItems(orderItems.map(item => 
      item.id === id 
        ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
        : item
    ));
  };

  const handleUpdatePrice = (id: string, unitPrice: number) => {
    setOrderItems(orderItems.map(item => 
      item.id === id 
        ? { ...item, unitPrice, totalPrice: unitPrice * item.quantity }
        : item
    ));
  };

  const handleCopyCustomerInfo = () => {
    setDeliveryInfo({
      ...deliveryInfo,
      name: customerInfo.name,
      phone: customerInfo.phone,
    });
    toast({
      title: "Customer info copied",
      description: "Customer name and phone copied to delivery information.",
    });
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        // Only require at least one contact method (email OR phone)
        return (customerInfo.email || customerInfo.phone);
      case 2:
        return orderItems.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      toast({
        title: "Please provide at least one contact method",
        description: "Email or phone number is required to proceed",
        variant: "destructive",
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSaveAsPending = async () => {
    setIsLoading(true);
    try {
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await createManualOrderRecords({
        orderId,
        orderItems,
        customerInfo,
        deliveryInfo,
        status: 'pending',
        fulfillmentStatus: 'Pending',
        salesPerson,
        notes
      });

      // Transform order data for email templates
      const emailOrderData = {
        order_id: orderId,
        items: orderItems.map(item => ({
          product_name: item.productName,
          quantity: item.quantity,
          total_price: item.totalPrice,
          delivery_date: deliveryInfo.date,
          delivery_address: {
            street: deliveryInfo.street,
            city: deliveryInfo.city,
            state: deliveryInfo.state,
            zip: deliveryInfo.zip
          },
          contact_info: {
            name: customerInfo.name,
            email: customerInfo.email,
            phone: customerInfo.phone
          },
          delivery_time_preference: deliveryInfo.timePreference,
          delivery_instructions: deliveryInfo.instructions
        })),
        total_amount: orderItems.reduce((sum, item) => sum + item.totalPrice, 0),
        customer_email: customerInfo.email,
        customer_name: customerInfo.name
      };

      // Send professional order confirmation emails to both customer and business
      const { sendBothOrderEmails } = await import('@/services/emailService');
      const emailResult = await sendBothOrderEmails(emailOrderData);

      if (!emailResult.overallSuccess) {
        console.warn('Some emails failed to send:', emailResult);
      }

      toast({
        title: "Order saved",
        description: `Order ${orderId} has been saved and confirmation emails sent.`,
      });
      navigate('/dashboard/orders');
    } catch (error) {
      console.error('Error saving order:', error);
      toast({
        title: "Error saving order",
        description: "There was an error saving the order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsQuote = async () => {
    setIsLoading(true);
    try {
      const quoteId = `QUOTE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const totalAmount = orderItems.reduce((sum, item) => sum + item.totalPrice, 0);
      
      await createManualOrderRecords({
        orderId: quoteId,
        orderItems,
        customerInfo,
        deliveryInfo,
        status: 'Quote',
        fulfillmentStatus: 'Quote Needed',
        quotedPrice: totalAmount,
        salesPerson,
        notes
      });

      // Set quote expiration (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      // Update quote with expiration date - handle multi-product orders
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          quote_expires_at: expirationDate.toISOString(),
          quote_status: 'sent'
        })
        .or(`order_id.eq.${quoteId},order_id.like.${quoteId}-%`);

      if (updateError) {
        console.error('Error updating quote expiration:', updateError);
      }

      // Get the created quote items for the email - handle multi-product orders
      const { data: quoteItems } = await supabase
        .from('orders')
        .select('*')
        .or(`order_id.eq.${quoteId},order_id.like.${quoteId}-%`);

      // Get product names for the email
      const { data: products } = await supabase
        .from('products')
        .select('id, name');
      
      const productNameMap = products?.reduce((map, product) => {
        map[product.id] = product.name;
        return map;
      }, {} as { [key: string]: string }) || {};

      // Generate quote proposal email with purchase link
      const { generateQuoteProposalEmail } = await import('@/utils/quoteEmailTemplates');
      const htmlContent = generateQuoteProposalEmail(
        {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          message: notes || 'Manual quote created by admin',
          zipCode: deliveryInfo.zip,
          selectedProduct: null,
          orderId: quoteId
        }, 
        quoteItems,
        window.location.origin,
        productNameMap
      );

      // Send enhanced quote email with purchase link to customer
      const { data: emailData, error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: customerInfo.email,
          subject: `Your Quote #${quoteId} - Ready for Review & Payment`,
          html: htmlContent,
          type: 'customer_confirmation'
        }
      });

      if (emailError) {
        console.error('Email error:', emailError);
        toast({
          title: "Quote created with issues",
          description: `Quote ${quoteId} created but email failed to send`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Quote created successfully",
          description: `Quote ${quoteId} created and email with purchase link sent to customer.`,
        });
      }

      // Send internal notification to business
      await supabase.functions.invoke('send-email', {
        body: {
          to: 'sales@mygravelguy.com',
          subject: `New Quote Created - ${quoteId}`,
          html: htmlContent,
          type: 'internal_notification'
        }
      });

      navigate('/dashboard/quotes');
    } catch (error) {
      console.error('Error creating quote:', error);
      toast({
        title: "Error creating quote",
        description: "There was an error creating the quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    setIsLoading(true);
    try {
      // Validation
      if (!orderItems.length) {
        throw new Error('No items in order');
      }
      
      if (!customerInfo.email) {
        throw new Error('Customer email is required');
      }

      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Import formatManualOrderForStripe dynamically
      const { formatManualOrderForStripe } = await import('@/utils/paymentUtils');
      
      // Format items for Stripe with proper structure and product details
      const stripeItems = await formatManualOrderForStripe(orderItems, customerInfo, deliveryInfo);
      
      console.log('Manual order Stripe items:', stripeItems);
      
      // Create Stripe checkout session
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          items: stripeItems,
          orderId,
          customerEmail: customerInfo.email
        }
      });

      if (error) {
        console.error('Stripe checkout error:', error);
        throw new Error(error.message || 'Failed to create payment session');
      }

      if (data?.url) {
        // Open Stripe checkout in new tab
        window.open(data.url, '_blank');
        toast({
          title: "Payment processing",
          description: "Opening Stripe checkout in new tab...",
        });
      } else {
        throw new Error('No checkout URL received from payment service');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error processing payment",
        description: error instanceof Error ? error.message : "There was an error processing the payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Customer Name</Label>
                    <Input
                      id="name"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="sales-person">Sales Person</Label>
                    <Select value={salesPerson} onValueChange={setSalesPerson}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sales person" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-assigned">Not Assigned</SelectItem>
                        {salesPersons.map((person) => (
                          <SelectItem key={person} value={person}>
                            {person}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="billing-name">Billing Name (if different)</Label>
                    <Input
                      id="billing-name"
                      value={customerInfo.billingName || ''}
                      onChange={(e) => setCustomerInfo({...customerInfo, billingName: e.target.value})}
                      placeholder="Enter billing name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="billing-email">Billing Email (if different)</Label>
                    <Input
                      id="billing-email"
                      type="email"
                      value={customerInfo.billingEmail || ''}
                      onChange={(e) => setCustomerInfo({...customerInfo, billingEmail: e.target.value})}
                      placeholder="billing@example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Delivery Information
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCustomerInfo}
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Customer Info
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="delivery-name">Contact Name</Label>
                    <Input
                      id="delivery-name"
                      value={deliveryInfo.name}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, name: e.target.value})}
                      placeholder="Enter contact name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="delivery-phone">Contact Phone</Label>
                    <Input
                      id="delivery-phone"
                      value={deliveryInfo.phone}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, phone: e.target.value})}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={deliveryInfo.street}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, street: e.target.value})}
                    placeholder="Enter street address"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={deliveryInfo.city}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, city: e.target.value})}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={deliveryInfo.state}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, state: e.target.value})}
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zip">ZIP Code</Label>
                    <Input
                      id="zip"
                      value={deliveryInfo.zip}
                      onChange={(e) => setDeliveryInfo({...deliveryInfo, zip: e.target.value})}
                      placeholder="Enter ZIP code"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Delivery Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !deliveryInfo.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {deliveryInfo.date ? format(deliveryInfo.date, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={deliveryInfo.date || undefined}
                          onSelect={(date) => setDeliveryInfo({...deliveryInfo, date: date || null})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label htmlFor="time-preference">Time Preference</Label>
                    <Select value={deliveryInfo.timePreference} onValueChange={(value) => setDeliveryInfo({...deliveryInfo, timePreference: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time preference" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anytime">Anytime</SelectItem>
                        <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="instructions">Delivery Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={deliveryInfo.instructions}
                    onChange={(e) => setDeliveryInfo({...deliveryInfo, instructions: e.target.value})}
                    placeholder="Enter any special delivery instructions"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Internal Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Enter any internal notes about this order"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Selection</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductSelector onAddProduct={handleAddProduct} />
              </CardContent>
            </Card>

            {orderItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orderItems.map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg">
                        <div className="flex-1 w-full sm:w-auto">
                          <h4 className="font-medium">{item.productName}</h4>
                          <p className="text-sm text-muted-foreground">{item.unit}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
                          <div className="flex items-center gap-2">
                            <Label>Qty:</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleUpdateQuantity(item.id, parseFloat(e.target.value) || 0)}
                              className="w-20"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label>Price:</Label>
                            <Input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveProduct(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <p>{customerInfo.name}</p>
                  <p>{customerInfo.email}</p>
                  <p>{customerInfo.phone}</p>
                  {salesPerson && <p>Sales Person: {salesPerson}</p>}
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Delivery Information</h4>
                  <p>{deliveryInfo.name} - {deliveryInfo.phone}</p>
                  <p>{deliveryInfo.street}</p>
                  <p>{deliveryInfo.city}, {deliveryInfo.state} {deliveryInfo.zip}</p>
                  <p>Date: {deliveryInfo.date ? format(deliveryInfo.date, "PPP") : 'Not selected'}</p>
                  <p>Time: {deliveryInfo.timePreference}</p>
                  {deliveryInfo.instructions && <p>Instructions: {deliveryInfo.instructions}</p>}
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Order Items</h4>
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.productName} ({item.quantity} {item.unit})</span>
                      <span>${item.totalPrice.toFixed(2)}</span>
                    </div>
                  ))}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                {notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-medium mb-2">Internal Notes</h4>
                      <p className="text-sm text-muted-foreground">{notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Button
                    onClick={handleSaveAsPending}
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center justify-center gap-2 w-full"
                  >
                    <Save className="h-4 w-4" />
                    <span className="sm:hidden">Save</span>
                    <span className="hidden sm:inline">Save Order</span>
                  </Button>
                  <Button
                    onClick={handleSaveAsQuote}
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center justify-center gap-2 w-full"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="sm:hidden">Quote</span>
                    <span className="hidden sm:inline">Save as Quote</span>
                  </Button>
                  <Button
                    onClick={handleStripeCheckout}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 w-full"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span className="sm:hidden">Pay</span>
                    <span className="hidden sm:inline">Process Payment</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={cn(
                "rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium",
                step <= currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={cn(
                  "w-12 h-0.5 ml-2",
                  step < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        Step {currentStep} of 3: {
          ['Customer & Delivery Info', 'Products', 'Review & Submit'][currentStep - 1]
        }
      </div>

      {/* Navigation buttons - mobile optimized */}
      <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mb-6">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? () => navigate('/dashboard/orders') : handleBack}
          className="flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>
        
        {currentStep < 3 && (
          <Button 
            onClick={handleNext} 
            disabled={!validateStep(currentStep)}
            className="w-full sm:w-auto"
          >
            Next
          </Button>
        )}
      </div>

      {renderStep()}
    </div>
  );
}