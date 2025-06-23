
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import LoginPrompt from '@/components/dashboard/LoginPrompt';
import MessageInbox from '@/components/messaging/MessageInbox';
import ConversationView from '@/components/messaging/ConversationView';
import { Card, CardContent } from '@/components/ui/card';

const MessagingConsole = () => {
  const { user, loading, isAdmin } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Loading state - show spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // No user - show login prompt
  if (!user) {
    return <LoginPrompt />;
  }

  // User authenticated but not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-2">Hello {user.email}</p>
          <p className="text-gray-600 mb-6">You need to be an authorized admin to access the messaging console.</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Messaging Console</h1>
              <p className="text-gray-600">Manage customer SMS conversations</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Message Inbox - Left Side */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <MessageInbox 
                  selectedConversation={selectedConversation}
                  onSelectConversation={setSelectedConversation}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Conversation View - Right Side */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <ConversationView 
                  conversationId={selectedConversation}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingConsole;
