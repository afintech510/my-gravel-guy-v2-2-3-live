
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

interface SMSPreviewProps {
  message: string;
  phoneNumber: string;
}

const SMSPreview: React.FC<SMSPreviewProps> = ({ message, phoneNumber }) => {
  const messageLength = message.length;
  const segmentCount = Math.ceil(messageLength / 160);
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <MessageSquare className="h-4 w-4" />
          SMS Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
          <div className="text-xs text-gray-600 mb-1">To: {phoneNumber}</div>
          <div className="text-sm text-gray-800 whitespace-pre-wrap">{message}</div>
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>{messageLength} characters</span>
          <span>{segmentCount} SMS segment{segmentCount !== 1 ? 's' : ''}</span>
        </div>
        {segmentCount > 1 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            ⚠️ This message will be sent as {segmentCount} separate SMS messages
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SMSPreview;
