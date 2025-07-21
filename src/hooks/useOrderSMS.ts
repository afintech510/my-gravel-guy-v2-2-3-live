
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { GroupedOrder, OrderRow } from '@/types/order.types';

export interface SMSTemplateData {
  customerName: string;
  orderId: string;
  status: string;
  totalPrice: string;
  deliveryDate: string;
  deliveryAddress: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  type: 'order_update' | 'delivery_notification' | 'custom';
}

export const SMS_TEMPLATES: SMSTemplate[] = [
  {
    id: 'order_confirmed',
    name: 'Order Confirmed',
    type: 'order_update',
    message: 'Hi {customerName}! Your order {orderId} has been confirmed. Total: ${totalPrice}. Expected delivery: {deliveryDate}. Thanks for choosing My Gravel Guy!'
  },
  {
    id: 'order_processing',
    name: 'Order Processing',
    type: 'order_update',
    message: 'Your order {orderId} is now being processed. We\'ll update you when it\'s ready for delivery. Questions? Reply to this message!'
  },
  {
    id: 'in_transit',
    name: 'Out for Delivery',
    type: 'delivery_notification',
    message: 'Great news! Your order {orderId} is out for delivery to {deliveryAddress}. Our driver will arrive soon. Please ensure the delivery area is accessible.'
  },
  {
    id: 'delivered',
    name: 'Delivery Complete',
    type: 'delivery_notification',
    message: 'Your order {orderId} has been delivered! Please inspect your materials and let us know if you have any concerns. Thank you for your business!'
  },
  {
    id: 'custom',
    name: 'Custom Message',
    type: 'custom',
    message: ''
  }
];

export const useOrderSMS = () => {
  const [isLoading, setIsLoading] = useState(false);

  const formatTemplate = (template: string, data: SMSTemplateData): string => {
    return template
      .replace(/{customerName}/g, data.customerName)
      .replace(/{orderId}/g, data.orderId)
      .replace(/{status}/g, data.status)
      .replace(/{totalPrice}/g, data.totalPrice)
      .replace(/{deliveryDate}/g, data.deliveryDate)
      .replace(/{deliveryAddress}/g, data.deliveryAddress);
  };

  const getTemplateData = (order: GroupedOrder | OrderRow): SMSTemplateData => {
    // Handle both GroupedOrder and OrderRow types
    if ('items' in order) {
      // GroupedOrder
      const deliveryItem = order.items[0];
      return {
        customerName: order.billing_name || 'Customer',
        orderId: order.order_id,
        status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
        totalPrice: order.total_price.toFixed(2),
        deliveryDate: deliveryItem?.delivery_date 
          ? new Date(deliveryItem.delivery_date).toLocaleDateString()
          : 'TBD',
        deliveryAddress: deliveryItem?.delivery_address 
          ? `${deliveryItem.delivery_address.street}, ${deliveryItem.delivery_address.city}, ${deliveryItem.delivery_address.state}`
          : 'Address not available'
      };
    } else {
      // OrderRow
      return {
        customerName: order.billing_name || order.delivery_name || 'Customer',
        orderId: order.order_id,
        status: order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown',
        totalPrice: order.total_price?.toFixed(2) || '0.00',
        deliveryDate: order.delivery_date 
          ? new Date(order.delivery_date).toLocaleDateString()
          : 'TBD',
        deliveryAddress: order.delivery_street && order.delivery_city && order.delivery_state
          ? `${order.delivery_street}, ${order.delivery_city}, ${order.delivery_state}`
          : 'Address not available'
      };
    }
  };

  const sendOrderSMS = async (
    phoneNumber: string, 
    message: string, 
    orderId: string,
    type: 'test' | 'order_update' | 'delivery_notification' | 'custom' = 'custom'
  ): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-order-sms', {
        body: { 
          phoneNumber,
          message,
          orderId,
          type
        }
      });

      if (error) {
        console.error('Error sending SMS:', error);
        toast({
          title: "SMS Failed",
          description: error.message || "Failed to send SMS. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      if (data?.success) {
        toast({
          title: "SMS Sent",
          description: `Message sent successfully to ${phoneNumber}`,
          variant: "default"
        });
        return true;
      } else {
        toast({
          title: "SMS Failed",
          description: data?.error || "Failed to send SMS. Please try again.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: "SMS Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { 
    sendOrderSMS, 
    isLoading, 
    formatTemplate, 
    getTemplateData,
    SMS_TEMPLATES 
  };
};
