
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Conversation {
  phoneNumber: string;
  customerName?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  orderInfo?: {
    orderId: string;
    deliveryAddress?: string;
    products?: string;
  };
}

export const useMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);

      // This would normally fetch from a messages table, but since we don't have it yet,
      // we'll create mock data to demonstrate the UI
      const mockConversations: Conversation[] = [
        {
          phoneNumber: '+15551234567',
          customerName: 'John Smith',
          lastMessage: 'Thank you for the delivery! The gravel looks great.',
          lastMessageTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          unreadCount: 0,
          orderInfo: {
            orderId: 'ORD-2024-001',
            deliveryAddress: '123 Main St, Springfield, IL',
            products: 'Pea Gravel (2 tons)'
          }
        },
        {
          phoneNumber: '+15559876543',
          customerName: 'Sarah Johnson',
          lastMessage: 'What time will the delivery arrive tomorrow?',
          lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          unreadCount: 1,
          orderInfo: {
            orderId: 'ORD-2024-002',
            deliveryAddress: '456 Oak Ave, Madison, WI',
            products: 'River Rock (3 tons)'
          }
        },
        {
          phoneNumber: '+15555555555',
          lastMessage: 'Hi, I need a quote for crushed stone delivery',
          lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          unreadCount: 1
        }
      ];

      // Sort by last message time (most recent first)
      mockConversations.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      );

      setConversations(mockConversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Set up real-time subscription (when messages table exists)
    // const subscription = supabase
    //   .channel('messages')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
    //     fetchConversations();
    //   })
    //   .subscribe();

    // return () => {
    //   subscription.unsubscribe();
    // };
  }, []);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations
  };
};
