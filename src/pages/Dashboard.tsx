
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrdersTable from '@/components/dashboard/OrdersTable';
import LoginPrompt from '@/components/dashboard/LoginPrompt';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AuditLogViewer from '@/components/admin/AuditLogViewer';
import FileUploadTest from '@/components/storage/FileUploadTest';
import RateLimitTest from '@/components/security/RateLimitTest';

const Dashboard = () => {
  const { user, loading, isAdmin, signOut } = useAuth();

  console.log('Dashboard: Render - user:', user);
  console.log('Dashboard: Render - loading:', loading);
  console.log('Dashboard: Render - isAdmin:', isAdmin);
  
  // Loading state - show spinner while checking authentication
  if (loading) {
    console.log('Dashboard: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // No user - show login prompt
  if (!user) {
    console.log('Dashboard: No user, showing login prompt');
    return <LoginPrompt />;
  }

  // User authenticated but not admin - show access denied
  if (!isAdmin) {
    console.log('Dashboard: User not admin, showing access denied');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-2">Hello {user.email}</p>
          <p className="text-gray-600 mb-6">You need to be an authorized admin to access this dashboard.</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <p className="text-sm text-yellow-800">
              <strong>Debug Info:</strong><br/>
              Your email: {user.email}<br/>
              Admin check: {isAdmin ? 'PASS' : 'FAIL'}
            </p>
          </div>
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
  
  console.log('Dashboard: User is admin, showing dashboard');
  
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
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                PHASE 3 SECURITY ENABLED
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
        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="admin-users">Admin Users</TabsTrigger>
            <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
            <TabsTrigger value="storage-test">Storage Test</TabsTrigger>
            <TabsTrigger value="security-tests">Security Tests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="orders" className="mt-6">
            <OrdersTable />
          </TabsContent>
          
          <TabsContent value="admin-users" className="mt-6">
            <AdminUserManagement />
          </TabsContent>
          
          <TabsContent value="audit-logs" className="mt-6">
            <AuditLogViewer />
          </TabsContent>
          
          <TabsContent value="storage-test" className="mt-6">
            <FileUploadTest />
          </TabsContent>
          
          <TabsContent value="security-tests" className="mt-6">
            <div className="space-y-6">
              <RateLimitTest />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
