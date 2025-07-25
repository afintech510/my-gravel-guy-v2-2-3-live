
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Power, Menu, Plus } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { DashboardSidebar } from './DashboardSidebar';
import LoginPrompt from './LoginPrompt';
import { forceAuthCleanup } from '@/utils/authCleanup';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { user, session, loading, isAdmin, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

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
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  // No user or session - show login prompt
  if (!user || !session) {
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
    <div className="min-h-screen bg-gray-50 flex flex-col w-full">
      {/* Full Width Header */}
      <div className="bg-white shadow-sm border-b z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                AUTHENTICATED
              </span>
              
              {/* New Order Button - only show on orders page */}
              {location.pathname === '/dashboard/orders' && (
                <Button 
                  onClick={() => navigate('/dashboard/orders/new')} 
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
              )}
              
              <div className="text-xs text-gray-500">
                Session: {session.expires_at ? new Date(session.expires_at * 1000).toLocaleTimeString() : 'Active'}
              </div>
              
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
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100"
              >
                Sign Out
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1 rounded-md hover:bg-gray-100"
              >
                Back to Site
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
