
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, RefreshCw, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LoginPrompt = () => {
  const { signInWithGoogle, clearSession, error } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: "There was an error signing in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleClearSession = async () => {
    try {
      await clearSession();
      toast({
        title: "Session Cleared",
        description: "Browser session has been cleared. You can now try signing in again.",
      });
    } catch (error) {
      console.error('Clear session error:', error);
      toast({
        title: "Clear Session Failed",
        description: "There was an error clearing the session. Please try refreshing the page.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <LogIn className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Manager Dashboard</h1>
          <p className="text-gray-600">Please sign in to access the dashboard</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        <div className="space-y-3">
          <Button 
            onClick={handleGoogleSignIn}
            className="w-full"
            size="lg"
          >
            <LogIn className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
          
          {error && (
            <Button
              onClick={handleClearSession}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Clear Session & Retry
            </Button>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          Only authorized administrators can access this dashboard
        </p>
        
        <div className="mt-6 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            Back to Site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LoginPrompt;
