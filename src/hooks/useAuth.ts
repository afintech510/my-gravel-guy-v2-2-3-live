
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add timeout for authentication checks
  const AUTH_TIMEOUT = 10000; // 10 seconds

  useEffect(() => {
    console.log('useAuth: Starting authentication check');
    
    // Set up timeout to prevent infinite loading
    const authTimeout = setTimeout(() => {
      console.log('useAuth: Authentication timeout reached');
      setLoading(false);
      setError('Authentication timeout - please try refreshing the page');
    }, AUTH_TIMEOUT);

    // Get initial session with error handling
    const getSession = async () => {
      try {
        console.log('useAuth: Getting initial session');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth session error:', error);
          setError(`Session error: ${error.message}`);
          clearTimeout(authTimeout);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('useAuth: Session found, checking admin status');
          setUser(session.user);
          await checkAdminStatus(session.user);
        } else {
          console.log('useAuth: No session found');
          setUser(null);
          setIsAdmin(false);
        }
        
        clearTimeout(authTimeout);
        setLoading(false);
      } catch (err) {
        console.error('useAuth: Unexpected error during session check:', err);
        setError(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        clearTimeout(authTimeout);
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes with improved error handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('useAuth: Auth state changed:', event);
        
        try {
          if (session?.user) {
            setUser(session.user);
            await checkAdminStatus(session.user);
          } else {
            setUser(null);
            setIsAdmin(false);
          }
          setError(null);
        } catch (err) {
          console.error('useAuth: Error in auth state change:', err);
          setError(`Auth state error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(authTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Server-side admin check with timeout and retry logic
  const checkAdminStatus = async (user: User) => {
    try {
      console.log('useAuth: Checking admin status for:', user.email);
      
      // Ensure user has an email before proceeding
      if (!user.email) {
        console.error('User email is not available');
        setIsAdmin(false);
        return;
      }

      // Add timeout for admin check
      const adminCheckPromise = (supabase as any).rpc('check_user_admin_status', {
        user_email: user.email
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Admin check timeout')), 5000)
      );

      const { data, error } = await Promise.race([adminCheckPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
        return;
      }

      console.log('useAuth: Admin check result:', data);
      setIsAdmin(data === true);
    } catch (error) {
      console.error('Admin verification failed:', error);
      setIsAdmin(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        console.error('Error signing in with Google:', error);
        throw error;
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError(`Sign-in error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign-out error:', error);
      setError(`Sign-out error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  const clearSession = async () => {
    try {
      console.log('useAuth: Clearing session and storage');
      
      // Clear Supabase session
      await supabase.auth.signOut();
      
      // Clear local storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Reset state
      setUser(null);
      setIsAdmin(false);
      setError(null);
      setLoading(false);
      
      console.log('useAuth: Session cleared successfully');
    } catch (error) {
      console.error('Error clearing session:', error);
      setError(`Clear session error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return {
    user,
    loading,
    isAdmin,
    error,
    signInWithGoogle,
    signOut,
    clearSession
  };
};
