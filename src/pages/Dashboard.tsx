
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, MessageSquare } from 'lucide-react';
import OrdersTable from '@/components/dashboard/OrdersTable';
import LoginPrompt from '@/components/dashboard/LoginPrompt';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { user, loading, isAdmin, signOut } = useAuth();
  
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
  
  // User authenticated and is admin - show dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
              <p className="text-gray-600">Welcome, {user.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => window.location.href = '/dashboard/comm'}
                variant="outline"
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Messaging Console
              </Button>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                SECURE MODE
              </span>
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
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <OrdersTable />
      </div>
    </div>
  );
};

export default Dashboard;
