
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckComplete, setAdminCheckComplete] = useState(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        // Only synchronous state updates here
        setSession(session);
        setUser(session?.user ?? null);
        setAdminCheckComplete(false);
        
        // Defer admin check to prevent deadlocks
        if (session?.user) {
          setTimeout(() => {
            checkAdminStatus(session.user);
          }, 0);
        } else {
          setIsAdmin(false);
          setAdminCheckComplete(true);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session initialization error:', error);
          setLoading(false);
          return;
        }
        
        if (session) {
          console.log('Existing session found:', session.user?.email);
          setSession(session);
          setUser(session.user);
          setAdminCheckComplete(false);
          
          // Defer admin check
          setTimeout(() => {
            checkAdminStatus(session.user);
          }, 0);
        } else {
          console.log('No existing session found');
          setSession(null);
          setUser(null);
          setIsAdmin(false);
          setAdminCheckComplete(true);
          setLoading(false);
        }
      } catch (error) {
        console.error('Session initialization failed:', error);
        setAdminCheckComplete(true);
        setLoading(false);
      }
    };

    initializeSession();

    return () => subscription.unsubscribe();
  }, []);

  // Server-side admin check using RPC function
  const checkAdminStatus = async (user: User) => {
    try {
      // Ensure user has an email before proceeding
      if (!user.email) {
        console.error('User email is not available');
        setIsAdmin(false);
        return;
      }

      console.log('Checking admin status for:', user.email);

      // Call server-side function to check admin status with type assertion
      const { data, error } = await (supabase as any).rpc('check_user_admin_status', {
        user_email: user.email
      });

      if (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
        return;
      }

      console.log('Admin check result:', data);
      setIsAdmin(data === true);
    } catch (error) {
      console.error('Admin verification failed:', error);
      setIsAdmin(false);
    } finally {
      setAdminCheckComplete(true);
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
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
      console.error('Google sign in failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
      
      // Clear state immediately
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    isAdmin,
    signInWithGoogle,
    signOut
  };
};
