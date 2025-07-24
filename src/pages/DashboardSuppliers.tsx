import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import SuppliersTable from '@/components/dashboard/SuppliersTable';

const DashboardSuppliers = () => {
  return (
    <DashboardLayout title="Supplier Management" subtitle="Manage supplier information and order history">
      <SuppliersTable />
    </DashboardLayout>
  );
};

export default DashboardSuppliers;