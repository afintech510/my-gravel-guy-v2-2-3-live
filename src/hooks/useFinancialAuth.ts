import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useFinancialAuth = () => {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const [isFinancialAdmin, setIsFinancialAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFinancialAdminStatus = async () => {
      if (!user?.email || authLoading) {
        setIsFinancialAdmin(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.rpc('check_financial_admin_status', {
          user_email: user.email
        });

        if (error) {
          console.error('Error checking financial admin status:', error);
          setIsFinancialAdmin(false);
        } else {
          setIsFinancialAdmin(data || false);
        }
      } catch (error) {
        console.error('Error checking financial admin status:', error);
        setIsFinancialAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkFinancialAdminStatus();
  }, [user?.email, authLoading]);

  return {
    user,
    isFinancialAdmin,
    isAdmin,
    loading: authLoading || loading,
  };
};