
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useSMSTest } from '@/hooks/useSMSTest';

const SMSTestSection = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const { sendTestSMS, isLoading } = useSMSTest();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber.trim()) {
      return;
    }

    const success = await sendTestSMS(phoneNumber);
    if (success) {
      setPhoneNumber('');
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numeric = value.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX
    if (numeric.length >= 6) {
      return `(${numeric.slice(0, 3)}) ${numeric.slice(3, 6)}-${numeric.slice(6, 10)}`;
    } else if (numeric.length >= 3) {
      return `(${numeric.slice(0, 3)}) ${numeric.slice(3)}`;
    } else {
      return numeric;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Test SMS Delivery
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Test our SMS delivery system by sending a test message to your phone number.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-phone">Phone Number</Label>
              <Input
                id="test-phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={phoneNumber}
                onChange={handlePhoneChange}
                maxLength={14}
                required
                className="max-w-sm"
              />
              <p className="text-xs text-gray-500">
                Enter your US phone number to receive a test SMS
              </p>
            </div>
            
            <Button 
              type="submit" 
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Sending Test SMS...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Test SMS
                </>
              )}
            </Button>
          </form>
          
          <div className="p-3 bg-blue-50 rounded-lg text-sm">
            <p className="text-blue-800">
              <strong>Note:</strong> This test will send a sample message to verify SMS delivery works correctly. 
              Standard messaging rates may apply from your carrier.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SMSTestSection;
