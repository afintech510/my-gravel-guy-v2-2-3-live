
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth session error:', error);
      }
      
      if (session?.user) {
        setUser(session.user);
        await checkAdminStatus(session.user);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await checkAdminStatus(session.user);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

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

      // Call server-side function to check admin status
      const { data, error } = await supabase.rpc('check_user_admin_status', {
        user_email: user.email
      });

      if (error) {
        console.error('Admin check error:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data === true);
    } catch (error) {
      console.error('Admin verification failed:', error);
      setIsAdmin(false);
    }
  };

  const signInWithGoogle = async () => {
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
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
    setUser(null);
    setIsAdmin(false);
  };

  return {
    user,
    loading,
    isAdmin,
    signInWithGoogle,
    signOut
  };
};
