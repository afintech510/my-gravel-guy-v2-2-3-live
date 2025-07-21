
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Power, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-foreground" />
          <p className="text-sm text-muted-foreground">Loading session...</p>
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full bg-card rounded-lg shadow-md p-6 text-center border border-border">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-2">Hello {user.email}</p>
          <p className="text-muted-foreground mb-6">You need to be an authorized admin to access this dashboard.</p>
          <div className="space-y-3">
            <button
              onClick={signOut}
              className="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary/80"
            >
              Sign Out
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col w-full dark">
      {/* Full Width Header */}
      <div className="bg-card shadow-sm border-b border-border z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              {/* Hamburger Menu */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-foreground">{title}</h1>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                AUTHENTICATED
              </span>
              
              <div className="text-xs text-muted-foreground">
                Session: {session.expires_at ? new Date(session.expires_at * 1000).toLocaleTimeString() : 'Active'}
              </div>
              
              {/* Power Logout Button */}
              <button
                onClick={handlePowerLogout}
                title="Force Logout & Clear Cache"
                className="flex items-center justify-center w-8 h-8 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-full transition-colors"
              >
                <Power className="h-4 w-4" />
              </button>
              
              <button
                onClick={signOut}
                className="text-sm text-muted-foreground hover:text-foreground px-3 py-1 rounded-md hover:bg-accent"
              >
                Sign Out
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="text-sm text-muted-foreground hover:text-foreground px-3 py-1 rounded-md hover:bg-accent"
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
