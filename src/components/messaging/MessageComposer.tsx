
import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useSendMessage } from '@/hooks/useSendMessage';
import { toast } from '@/hooks/use-toast';

interface MessageComposerProps {
  phoneNumber: string;
}

const MessageComposer: React.FC<MessageComposerProps> = ({ phoneNumber }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, isLoading } = useSendMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() && attachments.length === 0) {
      toast({
        title: "Empty message",
        description: "Please enter a message or attach an image",
        variant: "destructive"
      });
      return;
    }

    try {
      await sendMessage({
        phoneNumber,
        body: message.trim(),
        attachments: attachments.length > 0 ? attachments : undefined
      });
      
      setMessage('');
      setAttachments([]);
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Invalid file type",
        description: "Only image files are supported for MMS",
        variant: "destructive"
      });
    }
    
    if (attachments.length + imageFiles.length > 3) {
      toast({
        title: "Too many attachments",
        description: "Maximum 3 images per message",
        variant: "destructive"
      });
      return;
    }
    
    setAttachments(prev => [...prev, ...imageFiles]);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const getPreviewUrl = (file: File) => {
    return URL.createObjectURL(file);
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {attachments.map((file, index) => (
              <div key={index} className="relative">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={getPreviewUrl(file)}
                    alt={`Attachment ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message input */}
      <div className="flex items-end space-x-2">
        <div className="flex-1">
          <Textarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[60px] max-h-32 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        
        <div className="flex flex-col space-y-2">
          {/* File attachment button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading || attachments.length >= 3}
            className="h-10 w-10 p-0"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          {/* Send button */}
          <Button
            type="submit"
            disabled={isLoading || (!message.trim() && attachments.length === 0)}
            className="h-10 w-10 p-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Hidden file input */}
      <Input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Character count */}
      <div className="mt-2 text-xs text-gray-500 text-right">
        {message.length}/1600 characters
        {attachments.length > 0 && (
          <span className="ml-2 inline-flex items-center">
            <ImageIcon className="h-3 w-3 mr-1" />
            {attachments.length} image{attachments.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </form>
  );
};

export default MessageComposer;
