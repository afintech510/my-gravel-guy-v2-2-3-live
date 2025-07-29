
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { OrderService } from '@/services/orderService';
import { GroupedOrder, OrderStatus, FulfillmentStatus } from '@/types/order.types';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Save, ArrowLeft, User, MapPin, Package, UserCheck, DollarSign, FileText, Calendar, Send, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { formatDateForDatabase, parseLocalDate, formatDateTime } from '@/utils/dateUtils';
import SupplierSelector from '@/components/dashboard/SupplierSelector';
import FulfillmentStatusBadge from '@/components/dashboard/FulfillmentStatusBadge';
import { SupplierService } from '@/services/supplierService';
import { OrderItemsManager } from '@/components/dashboard/OrderItemsManager';
import { QuoteService } from '@/services/quoteService';

const OrderEdit = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [salesPersons, setSalesPersons] = useState<string[]>([]);
  const [isLoadingSalesPersons, setIsLoadingSalesPersons] = useState(false);
  const [isSendingQuote, setIsSendingQuote] = useState(false);
  const [quoteNotes, setQuoteNotes] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    billing_name: '',
    billing_email: '',
    delivery_name: '',
    delivery_email: '',
    delivery_phone: '',
    delivery_street: '',
    delivery_city: '',
    delivery_state: '',
    delivery_zip: '',
    delivery_date: '',
    delivery_instructions: '',
    delivery_time_preference: '',
    status: 'pending' as OrderStatus,
    fulfillment_status: '' as FulfillmentStatus | '',
    sales_person: 'unassigned',
    sales_commission: '',
    supplier_id: '',
    supplier_charges: '',
    notes: '',
    fulfillment_eta: ''
  });

  const { data: order, isLoading, error, refetch } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => OrderService.fetchOrderById(orderId!),
    enabled: !!orderId,
  });

  // Load unique sales persons from database
  useEffect(() => {
    const loadSalesPersons = async () => {
      setIsLoadingSalesPersons(true);
      try {
        const uniquePersons = await OrderService.getUniqueSalesPersons();
        setSalesPersons(uniquePersons);
      } catch (error) {
        console.error('Error loading sales persons:', error);
        // Fallback to default options
        setSalesPersons(['Adam', 'Ronnie']);
      } finally {
        setIsLoadingSalesPersons(false);
      }
    };
    
    loadSalesPersons();
  }, []);

  useEffect(() => {
    const initializeFormData = async () => {
      if (order) {
        console.log('Initializing form data with order:', order);
        const firstItem = order.items[0];
        console.log('First order item:', firstItem);
        let supplierIdToUse = firstItem?.supplier_id || '';
        console.log('Initial supplier_id:', supplierIdToUse);
        
        // If supplier_id looks like a name (not a UUID), try to convert it to UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (supplierIdToUse && !uuidRegex.test(supplierIdToUse)) {
          console.log('supplier_id appears to be a name, converting to UUID:', supplierIdToUse);
          try {
            const foundSupplierId = await SupplierService.findSupplierIdByName(supplierIdToUse);
            console.log('SupplierService lookup result:', foundSupplierId);
            if (foundSupplierId) {
              supplierIdToUse = foundSupplierId;
              console.log('Successfully converted supplier name to UUID:', foundSupplierId);
            } else {
              console.warn('Could not find supplier UUID for name:', supplierIdToUse);
              // Keep original value to show the issue
            }
          } catch (error) {
            console.error('Error converting supplier name to UUID:', error);
          }
        } else if (supplierIdToUse) {
          console.log('supplier_id is already a UUID:', supplierIdToUse);
        } else {
          console.log('No supplier_id found in order');
        }
        
        const newFormData = {
          billing_name: order.billing_name || '',
          billing_email: order.billing_email || '',
          delivery_name: firstItem?.delivery_name || '',
          delivery_email: firstItem?.delivery_email || '',
          delivery_phone: firstItem?.delivery_phone || '',
          delivery_street: firstItem?.delivery_address?.street || '',
          delivery_city: firstItem?.delivery_address?.city || '',
          delivery_state: firstItem?.delivery_address?.state || '',
          delivery_zip: firstItem?.delivery_address?.zip || '',
          delivery_date: firstItem?.delivery_date ? formatDateForDatabase(parseLocalDate(firstItem.delivery_date)) || format(new Date(firstItem.delivery_date + 'T00:00:00'), 'yyyy-MM-dd') : '',
          delivery_instructions: firstItem?.delivery_instructions || '',
          delivery_time_preference: firstItem?.delivery_time_preference || '',
          status: order.status,
          fulfillment_status: (order.fulfillment_status || '') as FulfillmentStatus | '',
          sales_person: order.sales_person || 'unassigned',
          sales_commission: order.sales_commission?.toString() || '',
          supplier_id: supplierIdToUse,
          supplier_charges: firstItem?.supplier_charges?.toString() || '',
          notes: firstItem?.notes || '',
          fulfillment_eta: ''
        };
        
        console.log('Setting final form data:', newFormData);
        console.log('Final supplier_id being set:', newFormData.supplier_id);
        setFormData(newFormData);
      }
    };
    
    initializeFormData();
  }, [order]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!order || !orderId) return;
    
    setIsSaving(true);
    try {
      // Update order status
      if (formData.status !== order.status) {
        await OrderService.updateOrderStatus(orderId, formData.status);
      }
      
      // Update fulfillment status
      if (formData.fulfillment_status && formData.fulfillment_status !== order.fulfillment_status) {
        await OrderService.updateOrderFulfillmentStatus(orderId, formData.fulfillment_status);
      }
      
      // Update sales person
      const salesPersonValue = formData.sales_person === 'unassigned' ? null : formData.sales_person;
      const currentSalesPerson = order.sales_person || null;
      if (salesPersonValue !== currentSalesPerson) {
        await OrderService.updateOrderSalesPerson(orderId, salesPersonValue);
      }
      
      // Update sales commission
      const salesCommissionValue = formData.sales_commission ? parseFloat(formData.sales_commission) : 0;
      const currentSalesCommission = order.sales_commission || 0;
      if (salesCommissionValue !== currentSalesCommission) {
        await OrderService.updateOrderSalesCommission(orderId, salesCommissionValue);
      }
      
      // Update supplier (with error handling)
      if (formData.supplier_id !== order.items[0]?.supplier_id) {
        try {
          const charges = formData.supplier_charges ? parseFloat(formData.supplier_charges) : undefined;
          await OrderService.updateOrderSupplier(orderId, formData.supplier_id, charges);
        } catch (error) {
          console.error('Error updating supplier:', error);
          // Continue with other updates even if supplier update fails
        }
      }
      
      // Update notes
      if (formData.notes !== order.items[0]?.notes) {
        await OrderService.updateOrderNotes(orderId, formData.notes);
      }
      
      // Update quote notes
      if (quoteNotes !== (order.quote_notes || '')) {
        await OrderService.updateOrderQuoteNotes(orderId, quoteNotes);
      }
      
      // Update delivery information
      const firstItem = order.items[0];
      const deliveryUpdates: any = {};
      let hasDeliveryChanges = false;

      if (formData.delivery_name !== firstItem?.delivery_name) {
        deliveryUpdates.delivery_name = formData.delivery_name;
        hasDeliveryChanges = true;
      }
      if (formData.delivery_email !== firstItem?.delivery_email) {
        deliveryUpdates.delivery_email = formData.delivery_email;
        hasDeliveryChanges = true;
      }
      if (formData.delivery_phone !== firstItem?.delivery_phone) {
        deliveryUpdates.delivery_phone = formData.delivery_phone;
        hasDeliveryChanges = true;
      }
      if (formData.delivery_street !== firstItem?.delivery_address?.street) {
        deliveryUpdates.delivery_street = formData.delivery_street;
        hasDeliveryChanges = true;
      }
      if (formData.delivery_city !== firstItem?.delivery_address?.city) {
        deliveryUpdates.delivery_city = formData.delivery_city;
        hasDeliveryChanges = true;
      }
      if (formData.delivery_state !== firstItem?.delivery_address?.state) {
        deliveryUpdates.delivery_state = formData.delivery_state;
        hasDeliveryChanges = true;
      }
      if (formData.delivery_zip !== firstItem?.delivery_address?.zip) {
        deliveryUpdates.delivery_zip = formData.delivery_zip;
        hasDeliveryChanges = true;
      }
      if (formData.delivery_instructions !== firstItem?.delivery_instructions) {
        deliveryUpdates.delivery_instructions = formData.delivery_instructions;
        hasDeliveryChanges = true;
      }
      if (formData.delivery_time_preference !== firstItem?.delivery_time_preference) {
        deliveryUpdates.delivery_time_preference = formData.delivery_time_preference;
        hasDeliveryChanges = true;
      }

      if (hasDeliveryChanges) {
        await OrderService.updateDeliveryInfo(orderId, deliveryUpdates);
      }
      
      await refetch();
      setHasChanges(false);
      
      toast({
        title: "Order Updated",
        description: "Order has been successfully updated",
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/dashboard/orders');
      }
    } else {
      navigate('/dashboard/orders');
    }
  };

  const handleSendQuote = async () => {
    if (!order) return;
    
    setIsSendingQuote(true);
    try {
      const result = await QuoteService.sendQuoteFromExistingOrder(order, {
        notes: quoteNotes,
        expirationDays: 30
      });

      if (result.success) {
        toast({
          title: "Quote sent successfully",
          description: `Quote ${order.order_id} has been sent to the customer via email.`,
        });
        setQuoteNotes('');
        await refetch(); // Refresh order data to show updated status
      } else {
        toast({
          title: "Error sending quote",
          description: result.error || "Failed to send quote",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending quote:', error);
      toast({
        title: "Error sending quote",
        description: "An unexpected error occurred while sending the quote.",
        variant: "destructive",
      });
    } finally {
      setIsSendingQuote(false);
    }
  };

  const handleOrderItemsChange = (updatedItems: any[]) => {
    // This will be called when order items are modified
    // For now, we'll trigger a refetch to get the latest data
    refetch();
    setHasChanges(true);
  };

  const canSendQuote = () => {
    if (!order) return false;
    // Allow sending quotes for most statuses except delivered/cancelled
    const allowedStatuses = ['pending', 'confirmed', 'processing', 'Quote'];
    return allowedStatuses.includes(order.status);
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-purple-100 text-purple-800';
      case 'in_transit': return 'bg-orange-100 text-orange-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Edit Order" subtitle="Loading order details...">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout title="Edit Order" subtitle="Order not found">
        <div className="text-center py-12">
          <p className="text-red-600">Error loading order: {error?.message || 'Order not found'}</p>
          <Button onClick={() => navigate('/dashboard/orders')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Edit Order ${orderId}`} subtitle="Update order details and information">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Orders
            </Button>
            <Badge className={getStatusColor(formData.status)}>
              {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {canSendQuote() && (
              <Button 
                variant="outline" 
                onClick={handleSendQuote} 
                disabled={isSendingQuote}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {isSendingQuote ? 'Sending...' : 'Send Quote'}
              </Button>
            )}
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Single Column Layout */}
        <div className="space-y-6">
          {/* 1. Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_name">Delivery Contact Name</Label>
                  <Input
                    id="delivery_name"
                    value={formData.delivery_name}
                    onChange={(e) => handleInputChange('delivery_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_phone">Delivery Phone</Label>
                  <Input
                    id="delivery_phone"
                    value={formData.delivery_phone}
                    onChange={(e) => handleInputChange('delivery_phone', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="delivery_email">Delivery Email</Label>
                <Input
                  id="delivery_email"
                  type="email"
                  value={formData.delivery_email}
                  onChange={(e) => handleInputChange('delivery_email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="delivery_street">Street Address</Label>
                <Input
                  id="delivery_street"
                  value={formData.delivery_street}
                  onChange={(e) => handleInputChange('delivery_street', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="delivery_city">City</Label>
                  <Input
                    id="delivery_city"
                    value={formData.delivery_city}
                    onChange={(e) => handleInputChange('delivery_city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_state">State</Label>
                  <Input
                    id="delivery_state"
                    value={formData.delivery_state}
                    onChange={(e) => handleInputChange('delivery_state', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_zip">ZIP Code</Label>
                  <Input
                    id="delivery_zip"
                    value={formData.delivery_zip}
                    onChange={(e) => handleInputChange('delivery_zip', e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="delivery_date">Delivery Date</Label>
                  <Input
                    id="delivery_date"
                    type="date"
                    value={formData.delivery_date}
                    onChange={(e) => handleInputChange('delivery_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="delivery_time_preference">Time Preference</Label>
                  <Select value={formData.delivery_time_preference} onValueChange={(value) => handleInputChange('delivery_time_preference', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select time preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (8AM - 12PM)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12PM - 5PM)</SelectItem>
                      <SelectItem value="evening">Evening (5PM - 8PM)</SelectItem>
                      <SelectItem value="anytime">Anytime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="delivery_instructions">Delivery Instructions</Label>
                <Textarea
                  id="delivery_instructions"
                  value={formData.delivery_instructions}
                  onChange={(e) => handleInputChange('delivery_instructions', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="billing_name">Billing Name</Label>
                <Input
                  id="billing_name"
                  value={formData.billing_name}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div>
                <Label htmlFor="billing_email">Billing Email</Label>
                <Input
                  id="billing_email"
                  type="email"
                  value={formData.billing_email}
                  readOnly
                  className="bg-gray-50 cursor-not-allowed"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Order Date</Label>
                <p className="text-sm text-gray-600 mt-1">{formatDateTime(order.created_at, 'MMM d, yyyy h:mm a')}</p>
              </div>
            </CardContent>
          </Card>

          {/* 3. Quote Notes (if sending quote) */}
          {canSendQuote() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Quote Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="quote_notes">Additional notes for quote email (optional)</Label>
                  <Textarea
                    id="quote_notes"
                    value={quoteNotes}
                    onChange={(e) => setQuoteNotes(e.target.value)}
                    placeholder="Add any special notes or terms for this quote..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 4. Product Selection & Order Items */}
          <OrderItemsManager
            orderId={orderId!}
            orderItems={order?.items || []}
            onOrderItemsChange={handleOrderItemsChange}
            isEditable={true}
          />


          {/* 5. Internal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add internal notes about this order..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={6}
              />
            </CardContent>
          </Card>

          {/* 6. Status & Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Status & Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Order Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="in_transit">In Transit</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Fulfillment Status</Label>
                <Select value={formData.fulfillment_status} onValueChange={(value) => handleInputChange('fulfillment_status', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select fulfillment status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Quote Needed">Quote Needed</SelectItem>
                    <SelectItem value="Quote Sent">Quote Sent</SelectItem>
                    <SelectItem value="New Order">New Order</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Assigned">Assigned</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                    <SelectItem value="Refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sales Person</Label>
                <Select value={formData.sales_person} onValueChange={(value) => handleInputChange('sales_person', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingSalesPersons ? "Loading..." : "Select sales person"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Not Assigned</SelectItem>
                    {salesPersons.map((person) => (
                      <SelectItem key={person} value={person}>
                        {person}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sales_commission">Sales Commission</Label>
                <Input
                  id="sales_commission"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.sales_commission}
                  onChange={(e) => handleInputChange('sales_commission', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* 7. Supplier Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Supplier</Label>
                <SupplierSelector
                  value={formData.supplier_id}
                  onValueChange={(value) => handleInputChange('supplier_id', value)}
                />
              </div>
              <div>
                <Label htmlFor="supplier_charges">Supplier Charges</Label>
                <Input
                  id="supplier_charges"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.supplier_charges}
                  onChange={(e) => handleInputChange('supplier_charges', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OrderEdit;
