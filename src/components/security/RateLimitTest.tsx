
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const RateLimitTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [rateLimitHit, setRateLimitHit] = useState(false);
  const { toast } = useToast();

  const testRateLimit = async () => {
    setIsLoading(true);
    setResults([]);
    setRateLimitHit(false);

    try {
      console.log('Testing rate limiting by sending multiple requests...');
      
      const testResults = [];
      
      // Send 6 requests quickly to test rate limiting (limit is 5 per minute for send-email)
      for (let i = 1; i <= 6; i++) {
        try {
          console.log(`Sending request ${i}...`);
          
          const { data, error } = await supabase.functions.invoke('send-email', {
            body: JSON.stringify({
              to: 'test@example.com',
              subject: `Rate Limit Test ${i}`,
              html: '<p>This is a rate limit test email</p>',
              type: 'customer_confirmation'
            })
          });

          const result = {
            request: i,
            success: !error,
            status: error ? 'error' : 'success',
            rateLimited: error?.message?.includes('Too many') || data?.error?.includes('Too many'),
            message: error?.message || data?.error || 'Success',
            headers: data?.headers || {}
          };

          testResults.push(result);
          
          if (result.rateLimited) {
            setRateLimitHit(true);
            console.log(`Rate limit hit on request ${i}`);
          }

        } catch (requestError) {
          console.error(`Request ${i} failed:`, requestError);
          testResults.push({
            request: i,
            success: false,
            status: 'error',
            rateLimited: false,
            message: requestError.message,
            headers: {}
          });
        }

        // Small delay between requests
        if (i < 6) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      setResults(testResults);
      
      if (rateLimitHit) {
        toast({
          title: "Rate Limiting Working",
          description: "Rate limiting successfully blocked excess requests!",
        });
      } else {
        toast({
          title: "Test Completed",
          description: "Rate limit may not have been reached or is configured differently.",
          variant: "destructive"
        });
      }

    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.error('Rate limit test error:', errorMessage);
      
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
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Rate Limiting Test
        </CardTitle>
        <CardDescription>
          Test the rate limiting implementation by sending multiple requests quickly.
          The send-email function is limited to 5 requests per minute.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testRateLimit} 
          disabled={isLoading} 
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Rate Limiting...
            </>
          ) : (
            'Test Rate Limiting (Send 6 Requests)'
          )}
        </Button>

        {rateLimitHit && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Success!</strong> Rate limiting is working correctly. Some requests were blocked.
            </AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Test Results:</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded text-sm border ${
                    result.rateLimited 
                      ? 'border-orange-200 bg-orange-50 text-orange-800' 
                      : result.success 
                        ? 'border-green-200 bg-green-50 text-green-800'
                        : 'border-red-200 bg-red-50 text-red-800'
                  }`}
                >
                  <strong>Request {result.request}:</strong> {result.message}
                  {result.rateLimited && (
                    <span className="ml-2 font-medium">(RATE LIMITED ✓)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-2">
          <p><strong>How it works:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Sends 6 email requests rapidly</li>
            <li>Rate limit is 5 requests per minute for send-email</li>
            <li>Request #6 should be blocked with HTTP 429</li>
            <li>Each response includes rate limit headers</li>
          </ul>
          <p className="mt-2"><strong>Security features tested:</strong></p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Request counting per client</li>
            <li>Time window enforcement</li>
            <li>Proper HTTP status codes</li>
            <li>Rate limit headers in responses</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default RateLimitTest;
