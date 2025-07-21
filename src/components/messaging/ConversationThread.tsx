
import React, { useEffect, useRef } from 'react';
import { X, Phone, Package, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversation } from '@/hooks/useConversation';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import { formatPhoneNumber } from '@/utils/phoneUtils';

interface ConversationThreadProps {
  phoneNumber: string;
  onClose: () => void;
}

const ConversationThread: React.FC<ConversationThreadProps> = ({ phoneNumber, onClose }) => {
  const { messages, customerInfo, loading, error, markAsRead } = useConversation(phoneNumber);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
    markAsRead();
  }, [messages, markAsRead]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading conversation</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Phone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {customerInfo?.name || formatPhoneNumber(phoneNumber)}
            </h3>
            <p className="text-sm text-muted-foreground">{formatPhoneNumber(phoneNumber)}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Customer info panel */}
      {customerInfo && (
        <div className="p-4 bg-accent/50 border-b border-border">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {customerInfo.orderId && (
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Order:</span>
                <span className="text-foreground">{customerInfo.orderId}</span>
              </div>
            )}
            {customerInfo.deliveryAddress && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Address:</span>
                <span className="truncate text-foreground">{customerInfo.deliveryAddress}</span>
              </div>
            )}
            {customerInfo.products && (
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">Products:</span>
                <span className="truncate text-foreground">{customerInfo.products}</span>
              </div>
            )}
            {customerInfo.deliveryDate && (
              <div className="flex items-center space-x-2">
                <span className="font-medium text-foreground">Delivery:</span>
                <span className="text-foreground">{customerInfo.deliveryDate}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No messages in this conversation yet.</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message composer */}
      <div className="border-t border-border bg-card">
        <MessageComposer phoneNumber={phoneNumber} />
      </div>
    </div>
  );
};

export default ConversationThread;
