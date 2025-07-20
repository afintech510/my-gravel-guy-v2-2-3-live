
import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import OrdersTable from '@/components/dashboard/OrdersTable';

const DashboardQuotes = () => {
  return (
    <DashboardLayout title="Quotes Management" subtitle="Manage quote requests and proposals">
      <OrdersTable statusFilter="quotes" />
    </DashboardLayout>
  );
};

export default DashboardQuotes;
