
import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { OrdersStatsWidget } from '@/components/dashboard/OrdersStatsWidget';
import OrdersTable from '@/components/dashboard/OrdersTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DashboardOrders = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout title="Orders Management" subtitle="Manage customer orders and deliveries">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="w-72">
            <OrdersStatsWidget />
          </div>
          <Button onClick={() => navigate('/dashboard/orders/new')} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Order
          </Button>
        </div>
        <OrdersTable statusFilter="orders" />
      </div>
    </DashboardLayout>
  );
};

export default DashboardOrders;
