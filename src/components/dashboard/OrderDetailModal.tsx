import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Lock, Unlock, Upload, Mail, Save, FileText, User, MapPin, DollarSign, MessageSquare, Phone, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GroupedOrder, OrderStatus, FulfillmentStatus } from '@/types/order.types';
import { OrderService } from '@/services/orderService';
import { useOrderSMS, SMS_TEMPLATES } from '@/hooks/useOrderSMS';
import SupplierSelector from './SupplierSelector';
import SalesPersonSelector from './SalesPersonSelector';
import SMSTemplateSelector from './SMSTemplateSelector';
import SMSPreview from './SMSPreview';
import { format } from 'date-fns';
import { formatDateTime, formatLocalDate } from '@/utils/dateUtils';
import { supabase } from '@/integrations/supabase/client';
import { SupplierService } from '@/services/supplierService';
import { quoteService, QuoteOptions } from '@/services/quoteService';
import { OrderItemsManager } from './OrderItemsManager';

interface OrderDetailModalProps {
  order: GroupedOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdate: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onOrderUpdate
}) => {
  const { toast } = useToast();
  const { sendOrderSMS, isLoading: isSendingSMS, formatTemplate, getTemplateData } = useOrderSMS();
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [status, setStatus] = useState<OrderStatus>(order?.status || 'pending');
  const [fulfillmentStatus, setFulfillmentStatus] = useState<FulfillmentStatus | ''>('');
  const [internalNotes, setInternalNotes] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [supplierCharges, setSupplierCharges] = useState('');
  const [selectedSalesPerson, setSelectedSalesPerson] = useState('');
  const [emailNote, setEmailNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);
  const [isSavingSalesPerson, setIsSavingSalesPerson] = useState(false);
  const [isSavingFulfillmentStatus, setIsSavingFulfillmentStatus] = useState(false);
  
  // SMS state
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [smsPhoneNumber, setSmsPhoneNumber] = useState('');
  
  // Quote state
  const [quoteMessage, setQuoteMessage] = useState('');
  const [quoteExpirationDays, setQuoteExpirationDays] = useState(30);
  const [customQuotePrice, setCustomQuotePrice] = useState('');
  const [isSendingQuote, setIsSendingQuote] = useState(false);

  // Reset form when order changes
  React.useEffect(() => {
    const initializeForm = async () => {
      if (order) {
        console.log('[OrderDetailModal] Initializing form with order:', order);
        
        setStatus(order.status);
        setFulfillmentStatus(order.fulfillment_status || '');
        setInternalNotes(order.items[0]?.notes || '');
        setSupplierCharges(order.items[0]?.supplier_charges?.toString() || '');
        setSelectedSalesPerson(order.sales_person || '');
        setEmailNote('');
        setIsUnlocked(false);
        
        // Handle supplier ID conversion (name to UUID)
        const rawSupplierId = order.items[0]?.supplier_id || '';
        console.log('[OrderDetailModal] Raw supplier_id from order:', rawSupplierId);
        
        if (rawSupplierId) {
          // Check if it's already a UUID (36 characters with hyphens)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          
          if (uuidRegex.test(rawSupplierId)) {
            console.log('[OrderDetailModal] Supplier ID is already a UUID:', rawSupplierId);
            setSelectedSupplierId(rawSupplierId);
          } else {
            console.log('[OrderDetailModal] Supplier ID is a name, converting to UUID:', rawSupplierId);
            try {
              const supplierId = await SupplierService.findSupplierIdByName(rawSupplierId);
              if (supplierId) {
                console.log('[OrderDetailModal] Successfully converted supplier name to UUID:', supplierId);
                setSelectedSupplierId(supplierId);
              } else {
                console.warn('[OrderDetailModal] No supplier found for name:', rawSupplierId);
                setSelectedSupplierId('');
              }
            } catch (error) {
              console.error('[OrderDetailModal] Error converting supplier name to UUID:', error);
              setSelectedSupplierId('');
            }
          }
        } else {
          console.log('[OrderDetailModal] No supplier ID found in order');
          setSelectedSupplierId('');
        }
        
        // Set default SMS phone number from delivery info
        const deliveryPhone = order.items[0]?.delivery_phone || '';
        setSmsPhoneNumber(deliveryPhone);
        setSelectedTemplate('');
        setCustomMessage('');
      }
    };

    initializeForm();
  }, [order]);

  if (!order) return null;

  // Get formatted template data
  const templateData = getTemplateData(order);

  // Get preview message
  const getPreviewMessage = () => {
    if (selectedTemplate === 'custom') {
      return customMessage;
    }
    const template = SMS_TEMPLATES.find(t => t.id === selectedTemplate);
    if (template) {
      return formatTemplate(template.message, templateData);
    }
    return '';
  };

  const handleStatusUpdate = async () => {
    if (!isUnlocked) {
      toast({
        title: "Order Locked",
        description: "Please unlock the order to make changes",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      await OrderService.updateOrderStatus(order.order_id, status);
      onOrderUpdate();
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFulfillmentStatusUpdate = async () => {
    if (!isUnlocked) {
      toast({
        title: "Order Locked",
        description: "Please unlock the order to make changes",
        variant: "destructive",
      });
      return;
    }

    if (!fulfillmentStatus) {
      toast({
        title: "Fulfillment Status Required",
        description: "Please select a fulfillment status",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingFulfillmentStatus(true);
      await OrderService.updateOrderFulfillmentStatus(order.order_id, fulfillmentStatus);
      onOrderUpdate();
      toast({
        title: "Fulfillment Status Updated",
        description: "Fulfillment status has been updated successfully",
      });
    } catch (error) {
      console.error('Error updating fulfillment status:', error);
      toast({
        title: "Error",
        description: "Failed to update fulfillment status",
        variant: "destructive",
      });
    } finally {
      setIsSavingFulfillmentStatus(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!isUnlocked) {
      toast({
        title: "Order Locked",
        description: "Please unlock the order to make changes",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingNotes(true);
      await OrderService.updateOrderNotes(order.order_id, internalNotes);
      onOrderUpdate();
      toast({
        title: "Notes Saved",
        description: "Internal notes have been saved successfully",
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleSaveSupplier = async () => {
    if (!isUnlocked) {
      toast({
        title: "Order Locked",
        description: "Please unlock the order to make changes",
        variant: "destructive",
      });
      return;
    }

    if (!selectedSupplierId) {
      toast({
        title: "Supplier Required",
        description: "Please select a supplier",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingSupplier(true);
      const charges = supplierCharges ? parseFloat(supplierCharges) : undefined;
      await OrderService.updateOrderSupplier(order.order_id, selectedSupplierId, charges);
      onOrderUpdate();
      toast({
        title: "Supplier Updated",
        description: "Supplier information has been saved successfully",
      });
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast({
        title: "Error",
        description: "Failed to save supplier information",
        variant: "destructive",
      });
    } finally {
      setIsSavingSupplier(false);
    }
  };

  const handleSaveSalesPerson = async () => {
    if (!isUnlocked) {
      toast({
        title: "Order Locked",
        description: "Please unlock the order to make changes",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSavingSalesPerson(true);
      await OrderService.updateOrderSalesPerson(order.order_id, selectedSalesPerson);
      onOrderUpdate();
      toast({
        title: "Sales Person Updated",
        description: "Sales person has been updated successfully",
      });
    } catch (error) {
      console.error('Error saving sales person:', error);
      toast({
        title: "Error",
        description: "Failed to save sales person",
        variant: "destructive",
      });
    } finally {
      setIsSavingSalesPerson(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailNote.trim()) {
      toast({
        title: "Email Note Required",
        description: "Please add a note before sending the email",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSending(true);
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Order Update - ${order.order_id}</h2>
          <p>Dear ${order.billing_name || 'Customer'},</p>
          <p>We wanted to update you on your order:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${order.order_id}</p>
            <p><strong>Status:</strong> ${status}</p>
            <p><strong>Total:</strong> $${order.total_price.toFixed(2)}</p>
          </div>
          
          <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Update from our team:</h3>
            <p style="white-space: pre-wrap;">${emailNote}</p>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Best regards,<br>My Gravel Guy Team</p>
        </div>
      `;

      console.log('Sending email via Supabase function...');
      
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: {
          to: order.billing_email || 'customer@example.com',
          subject: `Order Update - ${order.order_id}`,
          html: emailHtml,
          type: 'internal_notification',
          orderData: order
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Failed to send email');
      }

      console.log('Email sent successfully:', data);
      
      toast({
        title: "Email Sent",
        description: `Update email sent to ${order.billing_email || 'customer'}`,
      });
      setEmailNote('');
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Email Failed",
        description: error instanceof Error ? error.message : "Failed to send update email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "File Upload",
        description: `File "${file.name}" uploaded successfully`,
      });
    }
  };

  const getStatusColor = (orderStatus: OrderStatus) => {
    switch (orderStatus) {
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

  const handleSendSMS = async () => {
    if (!smsPhoneNumber.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter a phone number",
        variant: "destructive",
      });
      return;
    }

    const message = getPreviewMessage();
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please select a template or enter a custom message",
        variant: "destructive",
      });
      return;
    }

    const success = await sendOrderSMS(
      smsPhoneNumber,
      message,
      order.order_id,
      selectedTemplate === 'custom' ? 'custom' : 'order_update'
    );

    if (success) {
      setSelectedTemplate('');
      setCustomMessage('');
    }
  };

  const handleSendQuote = async () => {
    if (!quoteService.canSendQuote(order)) {
      toast({
        title: "Cannot Send Quote",
        description: "Order missing required information for quote",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSendingQuote(true);
      
      const options: QuoteOptions = {
        customMessage: quoteMessage.trim() || undefined,
        expirationDays: quoteExpirationDays,
        customPrice: customQuotePrice ? parseFloat(customQuotePrice) : undefined
      };

      const result = await quoteService.sendQuoteFromExistingOrder(order, options);
      
      onOrderUpdate(); // Refresh the order data
      
      toast({
        title: "Quote Sent Successfully",
        description: `Quote ${result.quoteId} sent to customer`,
      });
      
      // Reset form
      setQuoteMessage('');
      setCustomQuotePrice('');
      
    } catch (error) {
      console.error('Error sending quote:', error);
      toast({
        title: "Error Sending Quote",
        description: error instanceof Error ? error.message : "Failed to send quote",
        variant: "destructive",
      });
    } finally {
      setIsSendingQuote(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              Order Details - {order.order_id}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(order.status)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Badge>
              <div className="flex items-center gap-2">
                <Label htmlFor="unlock-order" className="text-sm">
                  {isUnlocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </Label>
                <Switch
                  id="unlock-order"
                  checked={isUnlocked}
                  onCheckedChange={setIsUnlocked}
                />
                <span className="text-sm text-gray-600">
                  {isUnlocked ? 'Unlocked' : 'Locked'}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="status">Status & Notes</TabsTrigger>
            <TabsTrigger value="supplier">Supplier</TabsTrigger>
            <TabsTrigger value="quote">Quote</TabsTrigger>
            <TabsTrigger value="communication">Email</TabsTrigger>
            <TabsTrigger value="sms">SMS</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <Label className="text-sm font-medium">Name</Label>
                    <p className="text-sm">{order.billing_name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-sm">{order.billing_email || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Order Date</Label>
                    <p className="text-sm">{formatDateTime(order.created_at, 'MMM d, yyyy h:mm a')}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Delivery Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.items.length > 0 && order.items[0].delivery_address && (
                    <>
                      <div>
                        <Label className="text-sm font-medium">Address</Label>
                        <p className="text-sm">
                          {order.items[0].delivery_address.street}<br />
                          {order.items[0].delivery_address.city}, {order.items[0].delivery_address.state} {order.items[0].delivery_address.zip}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Delivery Date</Label>
                        <p className="text-sm">
                          {order.items[0].delivery_date 
                            ? formatLocalDate(order.items[0].delivery_date, 'MMM d, yyyy')
                            : 'Not set'
                          }
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Sales Person
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <span className="text-sm font-medium text-gray-600">Sales Person: </span>
                  <span className="text-sm text-gray-900">{order.sales_person || 'Not Assigned'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} {item.unit} × ${item.unit_price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.total_price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span>${order.total_price.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)} disabled={!isUnlocked}>
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
                    <Button onClick={handleStatusUpdate} disabled={!isUnlocked || isSaving} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Update Status'}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Fulfillment Status</Label>
                    <Select value={fulfillmentStatus} onValueChange={(value) => setFulfillmentStatus(value as FulfillmentStatus)} disabled={!isUnlocked}>
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
                    <Button onClick={handleFulfillmentStatusUpdate} disabled={!isUnlocked || isSavingFulfillmentStatus} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      {isSavingFulfillmentStatus ? 'Saving...' : 'Update Fulfillment Status'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Internal Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Add internal notes about this order..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  disabled={!isUnlocked}
                  rows={4}
                />
                <Button onClick={handleSaveNotes} disabled={!isUnlocked || isSavingNotes} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingNotes ? 'Saving...' : 'Save Notes'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supplier" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Supplier Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <SupplierSelector
                    value={selectedSupplierId}
                    onValueChange={setSelectedSupplierId}
                    disabled={!isUnlocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Supplier Charges</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={supplierCharges}
                    onChange={(e) => setSupplierCharges(e.target.value)}
                    disabled={!isUnlocked}
                  />
                </div>
                <Button onClick={handleSaveSupplier} disabled={!isUnlocked || isSavingSupplier} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingSupplier ? 'Saving...' : 'Save Supplier Info'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>File Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 mb-2">Upload quotes, PDFs, or other documents</p>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileUpload}
                      disabled={!isUnlocked}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button asChild disabled={!isUnlocked}>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <FileText className="h-4 w-4 mr-2" />
                        Choose File
                      </label>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="communication" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send Customer Update
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Email Note</Label>
                  <Textarea
                    placeholder="Type your message to the customer here..."
                    value={emailNote}
                    onChange={(e) => setEmailNote(e.target.value)}
                    rows={6}
                  />
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Email will be sent to:</strong> {order.billing_email || 'No email on file'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Subject:</strong> Order Update - {order.order_id}
                  </p>
                </div>
                <Button 
                  onClick={handleSendEmail} 
                  disabled={isSending || !emailNote.trim()}
                  className="w-full"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isSending ? 'Sending...' : 'Send Update Email'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Send SMS Update
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={smsPhoneNumber}
                    onChange={(e) => setSmsPhoneNumber(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Enter phone number with country code (e.g., +1 for US)
                  </p>
                </div>

                <SMSTemplateSelector
                  templates={SMS_TEMPLATES}
                  selectedTemplate={selectedTemplate}
                  onTemplateChange={setSelectedTemplate}
                />

                {selectedTemplate === 'custom' && (
                  <div className="space-y-2">
                    <Label>Custom Message</Label>
                    <Textarea
                      placeholder="Type your custom SMS message here..."
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                )}

                {selectedTemplate && getPreviewMessage() && (
                  <SMSPreview 
                    message={getPreviewMessage()} 
                    phoneNumber={smsPhoneNumber} 
                  />
                )}

                <Button 
                  onClick={handleSendSMS} 
                  disabled={isSendingSMS || !smsPhoneNumber.trim() || !getPreviewMessage().trim()}
                  className="w-full"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {isSendingSMS ? 'Sending...' : 'Send SMS'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quote" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Send Quote
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quote-expiration">Quote Expiration (Days)</Label>
                    <Input
                      id="quote-expiration"
                      type="number"
                      value={quoteExpirationDays}
                      onChange={(e) => setQuoteExpirationDays(parseInt(e.target.value) || 30)}
                      min="1"
                      max="365"
                    />
                  </div>
                  <div>
                    <Label htmlFor="custom-quote-price">Custom Quote Price (Optional)</Label>
                    <Input
                      id="custom-quote-price"
                      type="number"
                      value={customQuotePrice}
                      onChange={(e) => setCustomQuotePrice(e.target.value)}
                      placeholder={`Default: $${order.total_price.toFixed(2)}`}
                      step="0.01"
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="quote-message">Quote Message (Optional)</Label>
                  <Textarea
                    id="quote-message"
                    value={quoteMessage}
                    onChange={(e) => setQuoteMessage(e.target.value)}
                    placeholder="Add a custom message for the customer..."
                    rows={4}
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Quote Summary</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Customer:</strong> {order.billing_name}</p>
                    <p><strong>Email:</strong> {order.billing_email}</p>
                    <p><strong>Items:</strong> {order.items.length} product(s)</p>
                    <p><strong>Total:</strong> ${customQuotePrice ? parseFloat(customQuotePrice).toFixed(2) : order.total_price.toFixed(2)}</p>
                    <p><strong>Expires:</strong> {quoteExpirationDays} days from now</p>
                  </div>
                </div>

                <Button 
                  onClick={handleSendQuote}
                  disabled={isSendingQuote || !quoteService.canSendQuote(order)}
                  className="w-full"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {isSendingQuote ? 'Sending Quote...' : 'Send Quote'}
                </Button>
              </CardContent>
            </Card>

            {/* Order Items Manager for Quote Editing */}
            <OrderItemsManager
              orderItems={order.items}
              onUpdateItem={() => {}} // Read-only in modal for now
              onRemoveItem={() => {}} // Read-only in modal for now  
              onAddItem={() => {}} // Read-only in modal for now
              readOnly={true}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailModal;
