
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Phone, User } from 'lucide-react';
import { useMessagingData } from '@/hooks/useMessagingData';
import { useOrderSMS } from '@/hooks/useOrderSMS';
import { Badge } from '@/components/ui/badge';

interface ConversationViewProps {
  conversationId: string | null;
}

const ConversationView: React.FC<ConversationViewProps> = ({ conversationId }) => {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getConversationMessages, getConversationDetails } = useMessagingData();
  const { sendOrderSMS } = useOrderSMS();

  const conversation = conversationId ? getConversationDetails(conversationId) : null;
  const messages = conversationId ? getConversationMessages(conversationId) : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !conversation || isSending) return;

    setIsSending(true);
    try {
      const success = await sendOrderSMS(
        conversation.phoneNumber,
        messageText.trim(),
        conversation.orderId || 'manual',
        'custom'
      );

      if (success) {
        setMessageText('');
        // Note: In a real implementation, this would trigger a refresh of messages
        console.log('Message sent successfully');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!conversationId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <p>Conversation not found</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Conversation Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">{conversation.customerName}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="h-3 w-3" />
                {conversation.phoneNumber}
                {conversation.orderId && (
                  <Badge variant="outline" className="text-xs">
                    Order: {conversation.orderId}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Badge variant={conversation.status === 'open' ? 'default' : 'secondary'}>
            {conversation.status}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.direction === 'outbound'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.body}</p>
                <p className={`text-xs mt-1 ${
                  message.direction === 'outbound' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {new Date(message.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="shrink-0">
            <Paperclip className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <Textarea
              placeholder="Type your message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              className="min-h-[60px] resize-none"
              disabled={isSending}
            />
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!messageText.trim() || isSending}
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
};

export default ConversationView;
