
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const PasswordReset = () => {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [resetStatus, setResetStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        console.log('=== PASSWORD RESET PAGE ===');
        console.log('Processing password reset...');
        
        // Get the access token and refresh token from URL parameters
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const type = searchParams.get('type');
        
        console.log('Reset type:', type);
        console.log('Has access token:', !!accessToken);
        console.log('Has refresh token:', !!refreshToken);
        
        if (type !== 'recovery' || !accessToken || !refreshToken) {
          throw new Error('Invalid password reset link');
        }
        
        // Set the session with the tokens from the URL
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (sessionError) {
          console.error('Session setup error:', sessionError);
          throw sessionError;
        }
        
        console.log('Session established for password reset');
        
        // For our frictionless checkout, we'll automatically set the password
        // In a real implementation, you might want to prompt the user for a new password
        const phoneBasedPassword = localStorage.getItem('temp_checkout_phone')?.replace(/\D/g, '') || '1234567890';
        
        const { error: updateError } = await supabase.auth.updateUser({
          password: phoneBasedPassword
        });
        
        if (updateError) {
          console.error('Password update error:', updateError);
          throw updateError;
        }
        
        console.log('Password updated successfully');
        setResetStatus('success');
        
        // Clean up temporary data
        localStorage.removeItem('temp_checkout_phone');
        
        // Show success message
        toast({
          title: "Password Reset Successful",
          description: "Your password has been updated. You can now complete your checkout.",
        });
        
        // Redirect back to checkout after a brief delay
        setTimeout(() => {
          navigate('/checkout');
        }, 2000);
        
      } catch (error) {
        console.error('Password reset failed:', error);
        setResetStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Password reset failed');
        
        toast({
          variant: "destructive",
          title: "Password Reset Failed",
          description: error instanceof Error ? error.message : 'An error occurred during password reset',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    handlePasswordReset();
  }, [searchParams, navigate, toast]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Password Reset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {resetStatus === 'processing' && (
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600">Processing your password reset...</p>
            </div>
          )}
          
          {resetStatus === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-8 w-8 mx-auto text-green-600" />
              <div>
                <p className="font-medium text-green-800">Password Reset Successful!</p>
                <p className="text-sm text-gray-600 mt-2">
                  Redirecting you back to checkout...
                </p>
              </div>
            </div>
          )}
          
          {resetStatus === 'error' && (
            <div className="text-center space-y-4">
              <AlertCircle className="h-8 w-8 mx-auto text-red-600" />
              <div>
                <p className="font-medium text-red-800">Password Reset Failed</p>
                <p className="text-sm text-gray-600 mt-2">{errorMessage}</p>
              </div>
              <Button onClick={() => navigate('/cart')} className="w-full">
                Return to Cart
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordReset;
