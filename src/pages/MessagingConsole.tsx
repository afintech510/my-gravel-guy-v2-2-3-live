
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import LoginPrompt from '@/components/dashboard/LoginPrompt';
import MessageInbox from '@/components/messaging/MessageInbox';
import ConversationThread from '@/components/messaging/ConversationThread';

const MessagingConsole = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string | null>(null);
  
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
          <p className="text-gray-600 mb-6">You need to be an authorized admin to access this messaging console.</p>
          <div className="space-y-3">
            <button
              onClick={signOut}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Sign Out
            </button>
            <Link
              to="/dashboard"
              className="block w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 text-center"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  // User authenticated and is admin - show messaging console
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link
                to="/dashboard"
                className="mr-4 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Messaging Console</h1>
                <p className="text-gray-600">Manage SMS/MMS conversations</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                SECURE MODE
              </span>
              <button
                onClick={signOut}
                className="text-gray-600 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-200px)]">
          <div className="flex h-full">
            {/* Left sidebar - Message inbox */}
            <div className={`${selectedPhoneNumber ? 'w-1/3' : 'w-full'} border-r border-gray-200 transition-all duration-300`}>
              <MessageInbox 
                selectedPhoneNumber={selectedPhoneNumber}
                onSelectPhone={setSelectedPhoneNumber}
              />
            </div>
            
            {/* Right panel - Conversation thread */}
            {selectedPhoneNumber && (
              <div className="w-2/3">
                <ConversationThread 
                  phoneNumber={selectedPhoneNumber}
                  onClose={() => setSelectedPhoneNumber(null)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagingConsole;
