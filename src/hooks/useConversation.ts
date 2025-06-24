
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

const SUPABASE_URL = "https://losrkjvrcambvgijfism.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvc3JranZyY2FtYnZnaWpmaXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTI0NjIsImV4cCI6MjA2MTQ2ODQ2Mn0.LdtyGNA5PmayO9VYcNRsO12DCAg0iS460rtTsDsS5B8";

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

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      // Make a GET request with phone_number as a query parameter
      const response = await fetch(`${SUPABASE_URL}/functions/v1/get-messages?phone_number=${encodeURIComponent(phoneNumber)}`, {
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

      if (!data?.messages) {
        throw new Error('Invalid response format');
      }

      // Transform database messages to UI format
      const transformedMessages = data.messages.map((msg: any) => ({
        id: msg.id,
        direction: msg.direction,
        body: msg.body || '',
        mediaUrls: msg.media_urls || undefined,
        timestamp: msg.created_at,
        userEmail: msg.user_email || undefined,
        status: msg.status || 'sent'
      }));

      setMessages(transformedMessages);

      // Extract customer info from the first message with customer data
      const messageWithCustomerInfo = data.messages.find((msg: any) => 
        msg.customer_name || msg.order_id
      );

      if (messageWithCustomerInfo) {
        setCustomerInfo({
          name: messageWithCustomerInfo.customer_name,
          orderId: messageWithCustomerInfo.order_id
        });
      }

    } catch (err) {
      console.error('Error fetching conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to load conversation');
    } finally {
      setLoading(false);
    }
  }, [phoneNumber]);

  const markAsRead = useCallback(async () => {
    try {
      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/mark-messages-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [phoneNumber]);

  useEffect(() => {
    fetchConversation();

    // Set up real-time subscription
    const subscription = supabase
      .channel(`conversation:${phoneNumber}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages', filter: `phone_number=eq.${phoneNumber}` }, 
        () => {
          fetchConversation();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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
