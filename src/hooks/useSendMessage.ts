
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SendMessageParams {
  phoneNumber: string;
  body: string;
  attachments?: File[];
}

export const useSendMessage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const sendMessage = async ({ phoneNumber, body, attachments }: SendMessageParams) => {
    setIsLoading(true);

    try {
      let mediaUrls: string[] = [];

      // Upload attachments if any
      if (attachments && attachments.length > 0) {
        mediaUrls = await uploadAttachments(attachments);
      }

      // Send message via Twilio
      const { data, error } = await supabase.functions.invoke('send-order-sms', {
        body: {
          phoneNumber,
          message: body,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
          type: 'custom'
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send message');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to send message');
      }

      // Store message in database (when messages table exists)
      // await storeMessage({
      //   phoneNumber,
      //   body,
      //   mediaUrls,
      //   direction: 'outbound',
      //   userEmail: user?.email
      // });

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const uploadAttachments = async (files: File[]): Promise<string[]> => {
    const uploadPromises = files.map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file);

      if (error) {
        throw new Error(`Failed to upload ${file.name}: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(data.path);

      return publicUrl;
    });

    return Promise.all(uploadPromises);
  };

  return {
    sendMessage,
    isLoading
  };
};
