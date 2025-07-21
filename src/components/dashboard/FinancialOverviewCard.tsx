import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

interface FinancialOverviewCardProps {
  title: string;
  value: number;
  previousValue?: number;
  formatAsCurrency?: boolean;
  formatAsPercentage?: boolean;
  icon?: React.ReactNode;
}

export function FinancialOverviewCard({ 
  title, 
  value, 
  previousValue, 
  formatAsCurrency = false,
  formatAsPercentage = false,
  icon 
}: FinancialOverviewCardProps) {
  const formatValue = (val: number) => {
    if (formatAsPercentage) {
      return `${val.toFixed(1)}%`;
    }
    if (formatAsCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(val);
    }
    return val.toLocaleString();
  };

  const getTrendInfo = () => {
    if (previousValue === undefined) return null;
    
    const change = value - previousValue;
    const percentChange = previousValue !== 0 ? (change / previousValue) * 100 : 0;
    const isPositive = change > 0;
    
    return {
      change,
      percentChange,
      isPositive,
    };
  };

  const trendInfo = getTrendInfo();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon || <DollarSign className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatValue(value)}
        </div>
        {trendInfo && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            {trendInfo.isPositive ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={trendInfo.isPositive ? 'text-green-500' : 'text-red-500'}>
              {Math.abs(trendInfo.percentChange).toFixed(1)}%
            </span>
            <span>vs previous period</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}