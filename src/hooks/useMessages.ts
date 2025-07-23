
import { useState, useEffect, useCallback, useRef } from 'react';
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

const SUPABASE_URL = "https://losrkjvrcambvgijfism.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc3JranZyY2FtYnZnaWpmaXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTI0NjIsImV4cCI6MjA2MTQ2ODQ2Mn0.LdtyGNA5PmayO9VYcNRsO12DCAg0iS460rtTsDsS5B8";

export const useMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Make a GET request to fetch all conversations (no phone_number parameter)
      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-messages`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

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
  }, []);

  const debouncedRefetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      fetchConversations();
    }, 100); // 100ms debounce
  }, [fetchConversations]);

  useEffect(() => {
    fetchConversations();

    // Set up real-time subscription with debounced updates
    const subscription = supabase
      .channel('messages-realtime')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'messages' 
      }, () => {
        debouncedRefetch();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchConversations, debouncedRefetch]);

  return {
    conversations,
    loading,
    error,
    refetch: fetchConversations
  };
};
