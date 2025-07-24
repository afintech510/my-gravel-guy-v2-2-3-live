
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export function OrdersStatsWidget() {
  const { data: totalOrders, isLoading } = useQuery({
    queryKey: ['orders-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .like('order_id', 'ORDER-%')
        .neq('status', 'Quote')
        .neq('status', 'Cancelled')
        .neq('status', 'Refunded');

      if (error) throw error;
      return data.length;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading orders...
      </div>
    );
  }

  return (
    <span className="text-sm font-medium">
      Total Orders: {totalOrders || 0}
    </span>
  );
}
