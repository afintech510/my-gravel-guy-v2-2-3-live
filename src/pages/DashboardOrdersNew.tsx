import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ManualOrderForm } from '@/components/dashboard/ManualOrderForm';

const DashboardOrdersNew = () => {
  return (
    <DashboardLayout title="Create New Order" subtitle="Manually create orders for phone or in-person sales">
      <ManualOrderForm />
    </DashboardLayout>
  );
};

export default DashboardOrdersNew;