
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Loader2 } from 'lucide-react';
import { sendOrderConfirmationEmail, sendInternalNotificationEmail } from '../../services/emailService';

const EmailTester = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const { toast } = useToast();

  // Sample order data for testing
  const sampleOrderData = {
    order_id: 'TEST-' + Date.now(),
    items: [
      {
        product_name: 'Premium Crushed Stone',
        quantity: 5,
        total_price: 425.00,
        delivery_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        delivery_address: {
          street: '123 Main Street',
          city: 'Sample City',
          state: 'CA',
          zip: '90210'
        },
        contact_info: {
          name: 'John Doe',
          email: testEmail || 'test@example.com',
          phone: '(555) 123-4567'
        },
        delivery_time_preference: 'morning',
        delivery_instructions: 'Please place materials near the garage'
      }
    ],
    total_amount: 425.00,
    customer_email: testEmail || 'test@example.com',
    customer_name: 'John Doe'
  };

  const sendTestCustomerEmail = async () => {
    if (!testEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a test email address"
      });
      return;
    }

    setIsLoading(true);
    try {
      await sendOrderConfirmationEmail({
        ...sampleOrderData,
        customer_email: testEmail
      });
      
      toast({
        title: "Success",
        description: `Test customer confirmation email sent to ${testEmail}`
      });
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send test email. Check console for details."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestInternalEmail = async () => {
    if (!testEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a test email address"
      });
      return;
    }

    setIsLoading(true);
    try {
      await sendInternalNotificationEmail(sampleOrderData, testEmail);
      
      toast({
        title: "Success",
        description: `Test internal notification email sent to ${testEmail}`
      });
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send test email. Check console for details."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Testing
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="testEmail">Test Email Address</Label>
          <Input
            id="testEmail"
            type="email"
            placeholder="your-email@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Enter your email address to receive test emails
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Customer Confirmation Email</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Test the email that customers receive after placing an order
            </p>
            <Button
              onClick={sendTestCustomerEmail}
              disabled={isLoading || !testEmail}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Customer Email
                </>
              )}
            </Button>
          </div>

          <div>
            <h4 className="font-medium mb-2">Internal Notification Email</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Test the email that the sales team receives for new orders
            </p>
            <Button
              onClick={sendTestInternalEmail}
              disabled={isLoading || !testEmail}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Test Internal Email
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2">⚠️ Configuration Required</h4>
          <p className="text-sm text-yellow-700">
            To send emails, you need to configure the RESEND_API_KEY in your Supabase secrets.
            Make sure to also update the "from" email address in the send-email function to match your verified domain.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTester;
