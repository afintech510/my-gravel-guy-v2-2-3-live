
import { useState, useEffect } from 'react';

export interface Message {
  id: string;
  conversationId: string;
  body: string;
  direction: 'inbound' | 'outbound';
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  mediaUrl?: string;
}

export interface Conversation {
  id: string;
  phoneNumber: string;
  customerName: string;
  orderId?: string;
  status: 'unread' | 'open' | 'closed';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

// Mock data for demonstration - in real implementation, this would come from Supabase
const mockConversations: Conversation[] = [
  {
    id: '1',
    phoneNumber: '+1234567890',
    customerName: 'John Smith',
    orderId: 'ORD-001',
    status: 'unread',
    lastMessage: 'When will my gravel be delivered?',
    lastMessageTime: new Date().toISOString(),
    unreadCount: 2
  },
  {
    id: '2',
    phoneNumber: '+1987654321',
    customerName: 'Sarah Johnson',
    orderId: 'ORD-002',
    status: 'open',
    lastMessage: 'Thank you for the quick delivery!',
    lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
    unreadCount: 0
  }
];

const mockMessages: Message[] = [
  {
    id: '1',
    conversationId: '1',
    body: 'Hi! I just placed order ORD-001. When can I expect delivery?',
    direction: 'inbound',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    status: 'read'
  },
  {
    id: '2',
    conversationId: '1',
    body: 'Hello! Thanks for your order. We\'ll deliver your gravel tomorrow between 9-11 AM.',
    direction: 'outbound',
    timestamp: new Date(Date.now() - 7000000).toISOString(),
    status: 'delivered'
  },
  {
    id: '3',
    conversationId: '1',
    body: 'When will my gravel be delivered?',
    direction: 'inbound',
    timestamp: new Date().toISOString(),
    status: 'read'
  },
  {
    id: '4',
    conversationId: '2',
    body: 'Thank you for the quick delivery!',
    direction: 'inbound',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    status: 'read'
  }
];

export const useMessagingData = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const loadData = async () => {
      setIsLoading(true);
      // In real implementation, fetch from Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));
      setConversations(mockConversations);
      setMessages(mockMessages);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const getConversationMessages = (conversationId: string): Message[] => {
    return messages.filter(msg => msg.conversationId === conversationId)
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  const getConversationDetails = (conversationId: string): Conversation | null => {
    return conversations.find(conv => conv.id === conversationId) || null;
  };

  const addMessage = (message: Omit<Message, 'id'>) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString()
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Update conversation's last message
    setConversations(prev => 
      prev.map(conv => 
        conv.id === message.conversationId 
          ? {
              ...conv,
              lastMessage: message.body,
              lastMessageTime: message.timestamp
            }
          : conv
      )
    );
  };

  return {
    conversations,
    messages,
    isLoading,
    getConversationMessages,
    getConversationDetails,
    addMessage
  };
};
