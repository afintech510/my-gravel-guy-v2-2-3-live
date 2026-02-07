
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LoginPrompt = () => {
  const { signInWithGoogle } = useAuth();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="max-w-md w-full bg-card rounded-lg shadow-md p-8 text-center">
        <div className="mb-6">
          <LogIn className="h-12 w-12 text-primary mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Manager Dashboard</h1>
          <p className="text-muted-foreground">Please sign in to access the dashboard</p>
        </div>
        
        <Button 
          onClick={handleGoogleSignIn}
          className="w-full mb-4"
          size="lg"
        >
          <LogIn className="mr-2 h-4 w-4" />
          Sign in with Google
        </Button>
        
        <p className="text-sm text-muted-foreground">
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
