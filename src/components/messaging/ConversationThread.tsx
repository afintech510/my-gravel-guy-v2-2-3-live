
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
        <p className="text-gray-500">Loading conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error loading conversation</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Phone className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {customerInfo?.name || formatPhoneNumber(phoneNumber)}
            </h3>
            <p className="text-sm text-gray-500">{formatPhoneNumber(phoneNumber)}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Customer info panel */}
      {customerInfo && (
        <div className="p-4 bg-blue-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {customerInfo.orderId && (
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Order:</span>
                <span>{customerInfo.orderId}</span>
              </div>
            )}
            {customerInfo.deliveryAddress && (
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Address:</span>
                <span className="truncate">{customerInfo.deliveryAddress}</span>
              </div>
            )}
            {customerInfo.products && (
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Products:</span>
                <span className="truncate">{customerInfo.products}</span>
              </div>
            )}
            {customerInfo.deliveryDate && (
              <div className="flex items-center space-x-2">
                <span className="font-medium">Delivery:</span>
                <span>{customerInfo.deliveryDate}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages in this conversation yet.</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message composer */}
      <div className="border-t border-gray-200 bg-white">
        <MessageComposer phoneNumber={phoneNumber} />
      </div>
    </div>
  );
};

export default ConversationThread;
