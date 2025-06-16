
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useSMSTest = () => {
  const [isLoading, setIsLoading] = useState(false);

  const sendTestSMS = async (phoneNumber: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: { phoneNumber }
      });

      if (error) {
        console.error('Error sending SMS:', error);
        toast({
          title: "SMS Test Failed",
          description: error.message || "Failed to send test SMS. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      if (data?.success) {
        toast({
          title: "SMS Test Successful",
          description: "Test SMS sent successfully! Check your phone.",
          variant: "default"
        });
        return true;
      } else {
        toast({
          title: "SMS Test Failed",
          description: data?.error || "Failed to send test SMS. Please try again.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: "SMS Test Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { sendTestSMS, isLoading };
};
