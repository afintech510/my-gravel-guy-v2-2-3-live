
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  mediaUrls?: string[];
  timestamp: string;
  userEmail?: string;
  status?: 'sent' | 'delivered' | 'failed';
}

export interface CustomerInfo {
  name?: string;
  orderId?: string;
  deliveryAddress?: string;
  products?: string;
  deliveryDate?: string;
}

export const useConversation = (phoneNumber: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversation = useCallback(async () => {
    if (!phoneNumber) return;

    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration - replace with actual database queries
      const mockMessages: Message[] = [
        {
          id: '1',
          direction: 'outbound',
          body: 'Hi! Your gravel delivery for order ORD-2024-001 is scheduled for tomorrow between 9-11 AM. Please ensure the delivery area is accessible.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          userEmail: 'admin@mygravelguy.com',
          status: 'delivered'
        },
        {
          id: '2',
          direction: 'inbound',
          body: 'Sounds good! Will be home. Thanks for the update.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString()
        },
        {
          id: '3',
          direction: 'outbound',
          body: 'Perfect! Our driver will call when they are 15 minutes away.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
          userEmail: 'admin@mygravelguy.com',
          status: 'delivered'
        },
        {
          id: '4',
          direction: 'inbound',
          body: 'Thank you for the delivery! The gravel looks great.',
          mediaUrls: ['https://via.placeholder.com/300x200/4f46e5/ffffff?text=Delivered+Gravel'],
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        }
      ];

      const mockCustomerInfo: CustomerInfo = {
        name: 'John Smith',
        orderId: 'ORD-2024-001',
        deliveryAddress: '123 Main St, Springfield, IL 62701',
        products: 'Pea Gravel (2 tons)',
        deliveryDate: 'March 15, 2024'
      };

      setMessages(mockMessages);
      setCustomerInfo(mockCustomerInfo);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [phoneNumber]);

  const markAsRead = useCallback(async () => {
    // Mark messages as read in the database
    console.log('Marking messages as read for:', phoneNumber);
  }, [phoneNumber]);

  useEffect(() => {
    fetchConversation();

    // Set up real-time subscription
    // const subscription = supabase
    //   .channel(`conversation:${phoneNumber}`)
    //   .on('postgres_changes', 
    //     { event: '*', schema: 'public', table: 'messages', filter: `delivery_phone=eq.${phoneNumber}` }, 
    //     () => {
    //       fetchConversation();
    //     }
    //   )
    //   .subscribe();

    // return () => {
    //   subscription.unsubscribe();
    // };
  }, [fetchConversation]);

  return {
    messages,
    customerInfo,
    loading,
    error,
    markAsRead,
    refetch: fetchConversation
  };
};
