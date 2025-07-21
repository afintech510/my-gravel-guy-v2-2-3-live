
import React, { useState } from 'react';
import { Search, MessageCircle, Clock, User, MessageSquarePlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/hooks/useMessages';
import { formatDistanceToNow } from 'date-fns';
import NewMessageDialog from './NewMessageDialog';

interface MessageInboxProps {
  selectedPhoneNumber: string | null;
  onSelectPhone: (phoneNumber: string) => void;
}

const MessageInbox: React.FC<MessageInboxProps> = ({ selectedPhoneNumber, onSelectPhone }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const { conversations, loading, error } = useMessages();

  const filteredConversations = conversations.filter(conv => 
    conv.phoneNumber.includes(searchTerm) ||
    conv.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <MessageCircle className="h-8 w-8 animate-pulse mx-auto mb-2 text-muted-foreground" />
          <p className="text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading conversations</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Conversations</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewMessage(true)}
            className="flex items-center gap-2"
          >
            <MessageSquarePlus className="h-4 w-4" />
            New Msg
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone, name, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium text-foreground mb-2">No conversations</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No conversations match your search.' : 'No messages have been received yet.'}
            </p>
            <Button
              variant="outline"
              onClick={() => setShowNewMessage(true)}
              className="flex items-center gap-2"
            >
              <MessageSquarePlus className="h-4 w-4" />
              Start New Conversation
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredConversations.map((conversation) => (
              <button
                key={conversation.phoneNumber}
                onClick={() => onSelectPhone(conversation.phoneNumber)}
                className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                  selectedPhoneNumber === conversation.phoneNumber ? 'bg-accent border-r-2 border-primary' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {conversation.customerName || conversation.phoneNumber}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: true })}
                      </div>
                    </div>
                    {conversation.customerName && (
                      <p className="text-xs text-muted-foreground mb-1">{conversation.phoneNumber}</p>
                    )}
                    <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                    {conversation.unreadCount > 0 && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {conversation.unreadCount} new
                        </span>
                      </div>
                    )}
                    {conversation.orderInfo && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400">
                          Order: {conversation.orderInfo.orderId}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer stats */}
      <div className="p-4 border-t border-border bg-accent/50">
        <div className="text-sm text-muted-foreground text-center">
          {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* New Message Dialog */}
      <NewMessageDialog 
        open={showNewMessage}
        onOpenChange={setShowNewMessage}
        onMessageSent={(phoneNumber) => {
          onSelectPhone(phoneNumber);
          setShowNewMessage(false);
        }}
      />
    </div>
  );
};

export default MessageInbox;
