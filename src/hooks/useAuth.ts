
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
      console.log('useAuth: Getting initial session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('useAuth: Error getting session:', error);
      }
      
      console.log('useAuth: Initial session:', session);
      console.log('useAuth: Initial user:', session?.user);
      
      if (session?.user) {
        console.log('useAuth: User email from session:', session.user.email);
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
        console.log('useAuth: Auth state change event:', event);
        console.log('useAuth: Auth state change session:', session);
        
        if (session?.user) {
          console.log('useAuth: User email from auth change:', session.user.email);
          setUser(session.user);
          await checkAdminStatus(session.user);
          
          // Update last login time
          await updateLastLogin(session.user);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminStatus = async (user: User) => {
    try {
      console.log('useAuth: Checking admin status for:', user.email);
      
      // Check if user exists in admin_users table
      const { data: adminUser, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('useAuth: Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      const isAdminUser = !!adminUser;
      console.log('useAuth: Admin user data:', adminUser);
      console.log('useAuth: Is admin?', isAdminUser);
      
      setIsAdmin(isAdminUser);
    } catch (error) {
      console.error('useAuth: Exception checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const updateLastLogin = async (user: User) => {
    try {
      // Update last_login_at for the admin user
      await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('user_id', user.id);
    } catch (error) {
      console.error('useAuth: Error updating last login:', error);
    }
  };

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

  const signOut = async () => {
    console.log('useAuth: Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    isAdmin,
    signInWithGoogle,
    signOut
  };
};
