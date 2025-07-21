
import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { OrdersStatsWidget } from '@/components/dashboard/OrdersStatsWidget';
import { QuotesStatsWidget } from '@/components/dashboard/QuotesStatsWidget';

const Dashboard = () => {
  return (
    <DashboardLayout title="Manager Dashboard" subtitle="Welcome to your management console">
      <div className="space-y-6">
        {/* Stats Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <OrdersStatsWidget />
          <QuotesStatsWidget />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <h4 className="font-medium text-gray-900">Recent Orders</h4>
              <p className="text-sm text-gray-600 mt-1">View and manage recent customer orders</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <h4 className="font-medium text-gray-900">Pending Quotes</h4>
              <p className="text-sm text-gray-600 mt-1">Review and respond to quote requests</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <h4 className="font-medium text-gray-900">Customer Messages</h4>
              <p className="text-sm text-gray-600 mt-1">Manage customer communications</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
