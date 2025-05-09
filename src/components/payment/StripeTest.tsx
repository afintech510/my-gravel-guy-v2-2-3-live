
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const StripeTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<any>(null);
  const { toast } = useToast();

  const testStripeFunction = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setRequestDetails(null);

    try {
      console.log('Testing Stripe checkout function...');
      
      // Create a test item
      const testItem = {
        id: 1,
        name: 'Test Product',
        price: 10.00,
        quantity: 1,
        image: 'https://placehold.co/400x400'
      };

      const requestBody = { items: [testItem] };
      setRequestDetails(requestBody);
      console.log('Request body:', requestBody);

      // Call the create-payment edge function
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: JSON.stringify(requestBody)
      });

      console.log('Edge function response:', data, error);

      if (error) {
        throw new Error(`Edge function error: ${error.message || JSON.stringify(error)}`);
      }

      if (!data) {
        throw new Error('No data returned from edge function');
      }

      setResult(data);
      
      toast({
        title: "Function Test Successful",
        description: "The Stripe checkout function is working correctly.",
      });

      if (data.url) {
        // If we got a URL back, we can optionally redirect to it
        console.log('Checkout URL received, you can redirect to:', data.url);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('Stripe test error:', errorMessage);
      setError(errorMessage);
      
      toast({
        title: "Test Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Stripe Checkout Test</CardTitle>
        <CardDescription>
          Test the Stripe integration by creating a sample checkout session
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testStripeFunction} 
          disabled={isLoading} 
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test Stripe Checkout'
          )}
        </Button>

        {requestDetails && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-sm mt-4">
            <strong>Request Details:</strong>
            <pre className="mt-2 text-xs overflow-auto max-h-28 p-2 bg-slate-100">
              {JSON.stringify(requestDetails, null, 2)}
            </pre>
          </div>
        )}

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription className="break-all">
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm mt-4">
            <strong>Success:</strong> Checkout URL generated
            <div className="mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open(result.url, '_blank')}
                className="w-full"
              >
                Open Checkout Page
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          <p>This test will attempt to create a Stripe checkout session using the <code>create-payment</code> edge function.</p>
          <p>Check the console for detailed logs.</p>
          <p className="mt-2 font-medium">Troubleshooting:</p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Verify Stripe secret is correctly set in Supabase</li>
            <li>Ensure Edge Function is properly deployed</li>
            <li>Check CORS configuration in the Edge Function</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripeTest;
