import React from 'react';
import { BarChart3, DollarSign } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SidebarKPIsProps {
  quoteCount: number;
  lastPriceSummary: string | null;
}

export function SidebarKPIs({ quoteCount, lastPriceSummary }: SidebarKPIsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <BarChart3 className="h-4 w-4" />
          <span className="text-xs">Count</span>
        </div>
        <div className="text-2xl font-bold text-foreground">{quoteCount}</div>
      </Card>
      
      <Card className="p-4 bg-card border-border">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <DollarSign className="h-4 w-4" />
          <span className="text-xs">Last $</span>
        </div>
        <div className="text-sm font-medium text-foreground truncate">
          {lastPriceSummary || 'No quotes yet'}
        </div>
      </Card>
    </div>
  );
}
