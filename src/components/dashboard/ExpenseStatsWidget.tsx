
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calendar, PieChart } from 'lucide-react';

interface ExpenseStats {
  totalThisMonth: number;
  totalLastMonth: number;
  fixedMonthlyTotal: number;
  averageMonthly: number;
  categoryBreakdown: { category: string; amount: number; color: string }[];
}

export const ExpenseStatsWidget = () => {
  const [stats, setStats] = useState<ExpenseStats>({
    totalThisMonth: 0,
    totalLastMonth: 0,
    fixedMonthlyTotal: 0,
    averageMonthly: 0,
    categoryBreakdown: []
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Get current month and last month dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch this month's expenses
      const { data: thisMonth } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', currentMonthStart.toISOString().split('T')[0]);

      // Fetch last month's expenses
      const { data: lastMonth } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', lastMonthStart.toISOString().split('T')[0])
        .lte('expense_date', lastMonthEnd.toISOString().split('T')[0]);

      // Fetch fixed monthly expenses
      const { data: fixedMonthly } = await supabase
        .from('expenses')
        .select('amount')
        .eq('expense_type', 'fixed_monthly')
        .eq('is_active', true);

      // Fetch category breakdown for this month
      const { data: categoryData } = await supabase
        .from('expenses')
        .select(`
          amount,
          expense_categories:category_id (
            name,
            color
          )
        `)
        .gte('expense_date', currentMonthStart.toISOString().split('T')[0]);

      // Calculate totals
      const totalThisMonth = thisMonth?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      const totalLastMonth = lastMonth?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      const fixedMonthlyTotal = fixedMonthly?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

      // Calculate category breakdown
      const categoryMap = new Map();
      categoryData?.forEach(expense => {
        if (expense.expense_categories) {
          const categoryName = expense.expense_categories.name;
          const existing = categoryMap.get(categoryName) || { 
            amount: 0, 
            color: expense.expense_categories.color 
          };
          categoryMap.set(categoryName, {
            ...existing,
            amount: existing.amount + Number(expense.amount)
          });
        }
      });

      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      setStats({
        totalThisMonth,
        totalLastMonth,
        fixedMonthlyTotal,
        averageMonthly: (totalThisMonth + totalLastMonth) / 2,
        categoryBreakdown
      });
    } catch (error) {
      console.error('Error fetching expense stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const monthlyChange = stats.totalLastMonth > 0 
    ? ((stats.totalThisMonth - stats.totalLastMonth) / stats.totalLastMonth) * 100 
    : 0;

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading stats...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalThisMonth.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {monthlyChange >= 0 ? '+' : ''}{monthlyChange.toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fixed Monthly</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.fixedMonthlyTotal.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Recurring expenses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Monthly</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.averageMonthly.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Based on last 2 months
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats.categoryBreakdown.length > 0 ? (
            <>
              <div className="text-2xl font-bold">
                ${stats.categoryBreakdown[0].amount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: stats.categoryBreakdown[0].color }}
                />
                {stats.categoryBreakdown[0].category}
              </p>
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">$0.00</div>
              <p className="text-xs text-muted-foreground">No expenses yet</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
