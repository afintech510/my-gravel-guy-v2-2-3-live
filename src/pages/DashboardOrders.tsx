
import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import OrdersTable from '@/components/dashboard/OrdersTable';

const DashboardOrders = () => {
  return (
    <DashboardLayout title="Orders Management" subtitle="Manage customer orders and deliveries">
      <OrdersTable statusFilter="orders" />
    </DashboardLayout>
  );
};

export default DashboardOrders;
