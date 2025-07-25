
import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import OrdersTable from '@/components/dashboard/OrdersTable';

const DashboardOrders = () => {
  return (
    <DashboardLayout title="Orders Management" subtitle="Manage customer orders and deliveries">
      <div className="space-y-6">
        <OrdersTable statusFilter="orders" />
      </div>
    </DashboardLayout>
  );
};

export default DashboardOrders;
