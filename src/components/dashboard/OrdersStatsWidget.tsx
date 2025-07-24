
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShoppingCart } from 'lucide-react';

export function OrdersStatsWidget() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['orders-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('fulfillment_status')
        .like('order_id', 'ORDER-%')
        .neq('status', 'Quote')
        .neq('status', 'Cancelled')
        .neq('status', 'Refunded');

      if (error) throw error;

      const statusCounts = data.reduce((acc: Record<string, number>, order) => {
        const status = order.fulfillment_status || 'Not Set';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const totalOrders = data.length;
      return { statusCounts, totalOrders };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">{stats?.totalOrders || 0}</div>
        <p className="text-xs text-muted-foreground mb-2">(not cancelled or refunded)</p>
        <div className="space-y-2">
          {Object.entries(stats?.statusCounts || {}).map(([status, count]) => (
            <div key={status} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{status}:</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
