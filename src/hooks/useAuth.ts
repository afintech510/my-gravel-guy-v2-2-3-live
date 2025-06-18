
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

// Admin email list - add authorized admin emails here
const ADMIN_EMAILS = [
  'admin@mygravelguy.com',
  'manager@mygravelguy.com',
  'adam@easternbuilding.supply',
  'techminded.xyz@gmail.com',
  'ronnie@easternbuilding.supply',
  // Add more admin emails as needed
];

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      console.log('useAuth: Getting initial session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('useAuth: Error getting session:', error);
      }
      
      console.log('useAuth: Initial session:', session);
      console.log('useAuth: Initial user:', session?.user);
      
      if (session?.user) {
        console.log('useAuth: User email from session:', session.user.email);
        console.log('useAuth: User object keys:', Object.keys(session.user));
        console.log('useAuth: Full user object:', JSON.stringify(session.user, null, 2));
      }
      
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('useAuth: Auth state change event:', event);
        console.log('useAuth: Auth state change session:', session);
        
        if (session?.user) {
          console.log('useAuth: User email from auth change:', session.user.email);
          console.log('useAuth: User object from auth change:', JSON.stringify(session.user, null, 2));
        }
        
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    console.log('useAuth: Starting Google sign in...');
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

  const signUp = async (email: string, password: string, metadata?: any) => {
    console.log('useAuth: Starting email/password sign up...');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    
    if (error) {
      console.error('Error signing up:', error);
      throw error;
    }
    
    return data;
  };

  const signIn = async (email: string, password: string) => {
    console.log('useAuth: Starting email/password sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      console.error('Error signing in:', error);
      throw error;
    }
    
    return data;
  };

  const signOut = async () => {
    console.log('useAuth: Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Enhanced admin check with debugging and email normalization
  const checkIsAdmin = () => {
    console.log('useAuth: Checking admin status...');
    console.log('useAuth: Current user:', user);
    console.log('useAuth: User email:', user?.email);
    console.log('useAuth: Admin emails list:', ADMIN_EMAILS);
    
    if (!user?.email) {
      console.log('useAuth: No user email found, not admin');
      return false;
    }
    
    // Normalize email for comparison (lowercase and trim)
    const normalizedUserEmail = user.email.toLowerCase().trim();
    const normalizedAdminEmails = ADMIN_EMAILS.map(email => email.toLowerCase().trim());
    
    console.log('useAuth: Normalized user email:', normalizedUserEmail);
    console.log('useAuth: Normalized admin emails:', normalizedAdminEmails);
    
    const isAdmin = normalizedAdminEmails.includes(normalizedUserEmail);
    console.log('useAuth: Is admin?', isAdmin);
    
    return isAdmin;
  };

  const isAdmin = checkIsAdmin();

  return {
    user,
    loading,
    isAdmin,
    signInWithGoogle,
    signUp,
    signIn,
    signOut
  };
};
