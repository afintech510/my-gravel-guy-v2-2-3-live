
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Power } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DashboardSidebar } from './DashboardSidebar';
import LoginPrompt from './LoginPrompt';
import { forceAuthCleanup } from '@/utils/authCleanup';
import { supabase } from '@/integrations/supabase/client';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user, loading, isAdmin, signOut } = useAuth();

  const handlePowerLogout = async () => {
    try {
      console.log('Initiating power logout...');
      
      // First clear all auth storage
      forceAuthCleanup();
      
      // Attempt global sign out (ignore errors)
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (error) {
        console.log('Sign out error (ignored):', error);
      }
      
      // Force page refresh and redirect
      window.location.href = '/';
    } catch (error) {
      console.error('Power logout error:', error);
      // Force refresh anyway
      window.location.href = '/';
    }
  };

  // Loading state - show spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // No user - show login prompt
  if (!user) {
    return <LoginPrompt />;
  }

  // User authenticated but not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-2">Hello {user.email}</p>
          <p className="text-gray-600 mb-6">You need to be an authorized admin to access this dashboard.</p>
          <div className="space-y-3">
            <button
              onClick={signOut}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Sign Out
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50 flex w-full">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white shadow">
            <div className="px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                  {subtitle && <p className="text-gray-600">{subtitle}</p>}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                    SECURE MODE
                  </span>
                  
                  {/* Power Logout Button */}
                  <button
                    onClick={handlePowerLogout}
                    title="Force Logout & Clear Cache"
                    className="flex items-center justify-center w-8 h-8 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={signOut}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Sign Out
                  </button>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Back to Site
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
