
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import MessageInbox from '@/components/messaging/MessageInbox';
import ConversationThread from '@/components/messaging/ConversationThread';

const MessagingConsole = () => {
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState<string | null>(null);
  
  return (
    <DashboardLayout title="Messaging Console" subtitle="Manage SMS/MMS conversations">
      <div className="bg-card rounded-lg shadow-lg h-[calc(100vh-200px)] border border-border">
        <div className="flex h-full">
          {/* Left sidebar - Message inbox */}
          <div className={`${selectedPhoneNumber ? 'w-1/3' : 'w-full'} border-r border-border transition-all duration-300`}>
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
    </DashboardLayout>
  );
};

export default MessagingConsole;
