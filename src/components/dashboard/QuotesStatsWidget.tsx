
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText } from 'lucide-react';

export function QuotesStatsWidget() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['quotes-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('fulfillment_status')
        .eq('status', 'Quote');

      if (error) throw error;

      const statusCounts = data.reduce((acc: Record<string, number>, quote) => {
        const status = quote.fulfillment_status || 'Not Set';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const totalQuotes = data.length;
      return { statusCounts, totalQuotes };
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
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
        <CardTitle className="text-sm font-medium">Total Quotes</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">{stats?.totalQuotes || 0}</div>
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
