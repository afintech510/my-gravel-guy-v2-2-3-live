
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShoppingCart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface OrderStats {
  totalOrders: number;
  fulfillmentBreakdown: {
    [key: string]: number;
  };
}

export function OrdersStatsWidget() {
  const { data: orderStats, isLoading } = useQuery({
    queryKey: ['orders-stats-breakdown'],
    queryFn: async (): Promise<OrderStats> => {
      const { data, error } = await supabase
        .from('orders')
        .select('fulfillment_status')
        .like('order_id', 'ORDER-%')
        .neq('status', 'Quote')
        .neq('status', 'Cancelled')
        .neq('status', 'Refunded');

      if (error) throw error;

      const fulfillmentBreakdown: { [key: string]: number } = {};
      let totalOrders = 0;

      data.forEach(order => {
        totalOrders++;
        const status = order.fulfillment_status || 'Not Set';
        fulfillmentBreakdown[status] = (fulfillmentBreakdown[status] || 0) + 1;
      });

      return {
        totalOrders,
        fulfillmentBreakdown
      };
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
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading orders...
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = orderStats || { totalOrders: 0, fulfillmentBreakdown: {} };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{stats.totalOrders}</div>
        <div className="mt-4 space-y-2">
          {Object.entries(stats.fulfillmentBreakdown)
            .sort(([,a], [,b]) => b - a)
            .map(([status, count]) => (
            <div key={status} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{status}:</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
