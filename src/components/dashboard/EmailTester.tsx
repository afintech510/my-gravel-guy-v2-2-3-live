
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Loader2, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { sendOrderConfirmationEmail, sendInternalNotificationEmail, sendBothOrderEmails, EmailResult } from '../../services/emailService';

interface TestResult {
  type: 'customer' | 'internal' | 'both';
  success: boolean;
  results?: {
    customerEmail?: EmailResult;
    internalEmail?: EmailResult;
    overallSuccess?: boolean;
  };
  error?: string;
  timestamp: string;
}

const EmailTester = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const { toast } = useToast();

  // Enhanced sample order data for testing
  const generateSampleOrderData = (customerEmail?: string) => ({
    order_id: 'TEST-' + Date.now(),
    items: [
      {
        product_name: 'Premium Crushed Stone #57',
        quantity: 5,
        total_price: 425.00,
        delivery_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        delivery_address: {
          street: '123 Maple Street',
          city: 'Springfield',
          state: 'CA',
          zip: '90210'
        },
        contact_info: {
          name: 'John Doe',
          email: customerEmail || testEmail || 'test@example.com',
          phone: '(555) 123-4567'
        },
        delivery_time_preference: 'morning',
        delivery_instructions: 'Please place materials near the garage. Call upon arrival.'
      },
      {
        product_name: 'Natural River Rock',
        quantity: 2,
        total_price: 180.00,
        delivery_date: new Date(Date.now() + 86400000).toISOString(),
        delivery_address: {
          street: '456 Oak Avenue',
          city: 'Springfield',
          state: 'CA',
          zip: '90211'
        },
        contact_info: {
          name: 'Jane Smith',
          email: customerEmail || testEmail || 'test@example.com',
          phone: '(555) 987-6543'
        },
        delivery_time_preference: 'afternoon',
        delivery_instructions: 'Use side driveway entrance'
      }
    ],
    total_amount: 605.00,
    customer_email: customerEmail || testEmail || 'test@example.com',
    customer_name: 'John Doe'
  });

  const addToHistory = (result: TestResult) => {
    setTestHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
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
      const sampleOrderData = generateSampleOrderData(testEmail);
      const result = await sendOrderConfirmationEmail(sampleOrderData);
      
      const testResult: TestResult = {
        type: 'customer',
        success: result.success,
        results: { customerEmail: result },
        timestamp: new Date().toISOString()
      };

      addToHistory(testResult);

      if (result.success) {
        toast({
          title: "Success ✅",
          description: `Customer confirmation email sent to ${testEmail}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Email Failed",
          description: result.error || "Failed to send email"
        });
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      
      const testResult: TestResult = {
        type: 'customer',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };

      addToHistory(testResult);

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
    setIsLoading(true);
    try {
      const sampleOrderData = generateSampleOrderData();
      const result = await sendInternalNotificationEmail(sampleOrderData);
      
      const testResult: TestResult = {
        type: 'internal',
        success: result.success,
        results: { internalEmail: result },
        timestamp: new Date().toISOString()
      };

      addToHistory(testResult);

      if (result.success) {
        toast({
          title: "Success ✅",
          description: "Internal notification email sent to order.support@mygravelguy.com"
        });
      } else {
        toast({
          variant: "destructive",
          title: "Email Failed",
          description: result.error || "Failed to send email"
        });
      }
    } catch (error) {
      console.error('Failed to send test email:', error);
      
      const testResult: TestResult = {
        type: 'internal',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };

      addToHistory(testResult);

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send test email. Check console for details."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestBothEmails = async () => {
    if (!testEmail) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a test email address for customer email"
      });
      return;
    }

    setIsLoading(true);
    try {
      const sampleOrderData = generateSampleOrderData(testEmail);
      const results = await sendBothOrderEmails(sampleOrderData);
      
      const testResult: TestResult = {
        type: 'both',
        success: results.overallSuccess,
        results,
        timestamp: new Date().toISOString()
      };

      addToHistory(testResult);

      if (results.overallSuccess) {
        toast({
          title: "Success ✅",
          description: "Both emails sent successfully!"
        });
      } else {
        const failedEmails = [];
        if (!results.customerEmail.success) failedEmails.push('customer');
        if (!results.internalEmail.success) failedEmails.push('internal');
        
        toast({
          variant: "destructive",
          title: "Partial Failure",
          description: `Failed to send ${failedEmails.join(' and ')} email(s)`
        });
      }
    } catch (error) {
      console.error('Failed to send test emails:', error);
      
      const testResult: TestResult = {
        type: 'both',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };

      addToHistory(testResult);

      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send test emails. Check console for details."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <Card className="w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Testing Dashboard
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
              Enter your email address to receive test customer confirmation emails
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Customer Email</h4>
              <p className="text-sm text-muted-foreground">
                Test the order confirmation email sent to customers
              </p>
              <Button
                onClick={sendTestCustomerEmail}
                disabled={isLoading || !testEmail}
                className="w-full"
                variant="default"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Test Customer Email
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Internal Email</h4>
              <p className="text-sm text-muted-foreground">
                Test the notification email sent to sales team
              </p>
              <Button
                onClick={sendTestInternalEmail}
                disabled={isLoading}
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
                    Test Internal Email
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Both Emails</h4>
              <p className="text-sm text-muted-foreground">
                Test the complete email flow (customer + internal)
              </p>
              <Button
                onClick={sendTestBothEmails}
                disabled={isLoading || !testEmail}
                variant="secondary"
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
                    Test Both Emails
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Configuration Status
            </h4>
            <div className="space-y-2 text-sm text-yellow-700">
              <p>✅ Resend API integration configured</p>
              <p>✅ Email templates enhanced with branding</p>
              <p>✅ Mobile-responsive design implemented</p>
              <p>✅ Error handling and retry logic active</p>
              <p className="text-xs mt-2 text-yellow-600">
                Make sure RESEND_API_KEY is configured in Supabase secrets and your domain is verified.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test History */}
      {testHistory.length > 0 && (
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Test History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testHistory.map((test, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    test.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(test.success)}
                      <span className="font-medium capitalize">{test.type} Email Test</span>
                      <span className="text-sm text-gray-500">
                        {formatTimestamp(test.timestamp)}
                      </span>
                    </div>
                  </div>
                  
                  {test.results && (
                    <div className="mt-2 text-sm space-y-1">
                      {test.results.customerEmail && (
                        <div className="flex items-center gap-2">
                          {getStatusIcon(test.results.customerEmail.success)}
                          <span>Customer: {test.results.customerEmail.recipient}</span>
                          {test.results.customerEmail.emailId && (
                            <span className="text-xs text-gray-500">ID: {test.results.customerEmail.emailId}</span>
                          )}
                        </div>
                      )}
                      {test.results.internalEmail && (
                        <div className="flex items-center gap-2">
                          {getStatusIcon(test.results.internalEmail.success)}
                          <span>Internal: {test.results.internalEmail.recipient}</span>
                          {test.results.internalEmail.emailId && (
                            <span className="text-xs text-gray-500">ID: {test.results.internalEmail.emailId}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {test.error && (
                    <div className="mt-2 text-sm text-red-600">
                      Error: {test.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmailTester;
