
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSendMessage } from '@/hooks/useSendMessage';
import { toast } from '@/hooks/use-toast';
import { formatPhoneNumber, validatePhoneNumber } from '@/utils/phoneUtils';

interface NewMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessageSent: (phoneNumber: string) => void;
}

const NewMessageDialog: React.FC<NewMessageDialogProps> = ({
  open,
  onOpenChange,
  onMessageSent
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const { sendMessage, isLoading } = useSendMessage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim()) {
      toast({
        title: "Phone number required",
        description: "Please enter a phone number",
        variant: "destructive"
      });
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid US phone number",
        variant: "destructive"
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message required",
        description: "Please enter a message",
        variant: "destructive"
      });
      return;
    }

    try {
      await sendMessage({
        phoneNumber,
        body: message.trim()
      });

      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });

      // Clear form and close dialog
      setPhoneNumber('');
      setMessage('');
      onMessageSent(phoneNumber);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneNumber(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start New Conversation</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              disabled={isLoading}
            />
            {phoneNumber && (
              <p className="text-xs text-gray-500 mt-1">
                Formatted: {formatPhoneNumber(phoneNumber)}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
              className="min-h-[100px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/1600 characters
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewMessageDialog;
