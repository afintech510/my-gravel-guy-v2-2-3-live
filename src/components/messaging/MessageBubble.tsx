
import React, { useState } from 'react';
import { format } from 'date-fns';
import { Image as ImageIcon, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  mediaUrls?: string[];
  timestamp: string;
  userEmail?: string;
  status?: 'sent' | 'delivered' | 'failed';
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const [imageError, setImageError] = useState<Record<string, boolean>>({});
  
  const isOutbound = message.direction === 'outbound';
  const hasMedia = message.mediaUrls && message.mediaUrls.length > 0;

  const handleImageError = (url: string) => {
    setImageError(prev => ({ ...prev, [url]: true }));
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <div className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOutbound 
          ? 'bg-blue-600 text-white' 
          : 'bg-white text-gray-900 border border-gray-200'
      }`}>
        {/* Message text */}
        {message.body && (
          <p className="text-sm whitespace-pre-wrap mb-2">{message.body}</p>
        )}

        {/* Media attachments */}
        {hasMedia && (
          <div className="space-y-2">
            {message.mediaUrls!.map((url, index) => (
              <div key={index} className="relative">
                {!imageError[url] ? (
                  <div className="relative group">
                    <img
                      src={url}
                      alt={`Attachment ${index + 1}`}
                      className="rounded-lg max-w-full h-auto cursor-pointer"
                      onError={() => handleImageError(url)}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="secondary" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl w-auto">
                            <img
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="max-w-full max-h-[80vh] object-contain mx-auto"
                            />
                          </DialogContent>
                        </Dialog>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 w-8 p-0"
                          onClick={() => downloadImage(url, `attachment-${index + 1}.jpg`)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg">
                    <ImageIcon className="h-4 w-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Image unavailable</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 ml-auto"
                      onClick={() => window.open(url, '_blank')}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Message metadata */}
        <div className={`text-xs mt-2 ${isOutbound ? 'text-blue-100' : 'text-gray-500'}`}>
          <div className="flex items-center justify-between">
            <span>{format(new Date(message.timestamp), 'MMM d, h:mm a')}</span>
            {isOutbound && (
              <div className="flex items-center space-x-1">
                {message.userEmail && (
                  <span className="opacity-75">by {message.userEmail.split('@')[0]}</span>
                )}
                {message.status && (
                  <span className={`px-1 py-0.5 rounded text-xs ${
                    message.status === 'delivered' ? 'bg-green-500' :
                    message.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}>
                    {message.status}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
