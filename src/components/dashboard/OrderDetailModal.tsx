
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
import { GroupedOrder, OrderStatus } from '@/types/order.types';
import { OrderService } from '@/services/orderService';
import { useOrderSMS, SMS_TEMPLATES } from '@/hooks/useOrderSMS';
import SupplierSelector from './SupplierSelector';
import SalesPersonSelector from './SalesPersonSelector';
import SMSTemplateSelector from './SMSTemplateSelector';
import SMSPreview from './SMSPreview';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

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
  
  // SMS state
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [smsPhoneNumber, setSmsPhoneNumber] = useState('');

  // Reset form when order changes
  React.useEffect(() => {
    if (order) {
      setStatus(order.status);
      setInternalNotes(order.items[0]?.notes || '');
      setSelectedSupplierId(order.items[0]?.supplier_id || '');
      setSupplierCharges(order.items[0]?.supplier_charges?.toString() || '');
      setSelectedSalesPerson(order.sales_person || '');
      setEmailNote('');
      setIsUnlocked(false);
      
      // Set default SMS phone number from delivery info
      const deliveryPhone = order.items[0]?.delivery_phone || '';
      setSmsPhoneNumber(deliveryPhone);
      setSelectedTemplate('');
      setCustomMessage('');
    }
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="status">Status & Notes</TabsTrigger>
            <TabsTrigger value="supplier">Supplier</TabsTrigger>
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
                    <p className="text-sm">{format(new Date(order.created_at), 'MMM d, yyyy h:mm a')}</p>
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
                            ? format(new Date(order.items[0].delivery_date), 'MMM d, yyyy')
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Assigned Sales Person</Label>
                  <SalesPersonSelector
                    currentPerson={selectedSalesPerson}
                    orderId={order.order_id}
                    onPersonUpdate={(_, newPerson) => setSelectedSalesPerson(newPerson)}
                    readonly={!isUnlocked}
                  />
                </div>
                <Button onClick={handleSaveSalesPerson} disabled={!isUnlocked || isSavingSalesPerson} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {isSavingSalesPerson ? 'Saving...' : 'Save Sales Person'}
                </Button>
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
                </div>
                <Button onClick={handleStatusUpdate} disabled={!isUnlocked || isSaving} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Update Status'}
                </Button>
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
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailModal;
