
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, Phone } from 'lucide-react';
import { useMessagingData } from '@/hooks/useMessagingData';
import { Badge } from '@/components/ui/badge';

interface MessageInboxProps {
  selectedConversation: string | null;
  onSelectConversation: (conversationId: string | null) => void;
}

const MessageInbox: React.FC<MessageInboxProps> = ({ 
  selectedConversation, 
  onSelectConversation 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'open'>('all');
  const { conversations, isLoading } = useMessagingData();

  const filteredConversations = conversations.filter(conversation => {
    const matchesSearch = conversation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conversation.phoneNumber.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || conversation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-3">Conversations</h2>
        
        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('unread')}
          >
            Unread
          </Button>
          <Button
            variant={statusFilter === 'open' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('open')}
          >
            Open
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading conversations...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            No conversations found
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation.id)}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedConversation === conversation.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-sm truncate">
                      {conversation.customerName}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-1">
                    {conversation.phoneNumber}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage}
                  </div>
                </div>
                <div className="text-xs text-gray-400 ml-2">
                  {new Date(conversation.lastMessageTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MessageInbox;
