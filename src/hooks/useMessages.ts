
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

      const { data, error } = await supabase.functions.invoke('get-messages');

      if (error) {
        throw new Error(error.message || 'Failed to fetch conversations');
      }

      if (!data?.conversations) {
        throw new Error('Invalid response format');
      }

      setConversations(data.conversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();

    // Set up real-time subscription
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations
  };
};
