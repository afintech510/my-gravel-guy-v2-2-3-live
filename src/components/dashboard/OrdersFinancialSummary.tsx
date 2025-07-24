import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText } from 'lucide-react';

interface OrdersFinancialSummaryProps {
  startDate: string;
  endDate: string;
}

export function OrdersFinancialSummary({ startDate, endDate }: OrdersFinancialSummaryProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['orders-financial-stats', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('fulfillment_status, total_price')
        .like('order_id', 'ORDER-%')
        .neq('fulfillment_status', 'Refunded')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (error) throw error;

      const statusCounts = data.reduce((acc: Record<string, { count: number; totalValue: number }>, order) => {
        const status = order.fulfillment_status || 'Not Set';
        if (!acc[status]) {
          acc[status] = { count: 0, totalValue: 0 };
        }
        acc[status].count += 1;
        acc[status].totalValue += Number(order.total_price || 0);
        return acc;
      }, {});

      const totalOrders = data.length;
      const totalValue = data.reduce((sum, order) => sum + Number(order.total_price || 0), 0);
      
      return { statusCounts, totalOrders, totalValue };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Orders in Analysis</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
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
        <CardTitle className="text-sm font-medium">Orders in Analysis</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-2">{stats?.totalOrders || 0}</div>
        <div className="text-sm text-muted-foreground mb-4">
          Total Value: ${(stats?.totalValue || 0).toLocaleString()}
        </div>
        <div className="space-y-2">
          {Object.entries(stats?.statusCounts || {}).map(([status, data]) => (
            <div key={status} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{status}:</span>
              <div className="text-right">
                <span className="font-medium">{data.count}</span>
                <div className="text-xs text-muted-foreground">
                  ${data.totalValue.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}