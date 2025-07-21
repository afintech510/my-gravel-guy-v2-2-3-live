import { supabase } from '@/integrations/supabase/client';

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  supplierCharges: number;
  salesCommissions: number;
  netProfit: number;
  grossProfitMargin: number;
}

export interface ExpenseByCategory {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface VendorAnalysis {
  vendor: string;
  totalAmount: number;
  expenseCount: number;
  categories: string[];
}

const CATEGORY_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(var(--accent))',
  'hsl(220, 70%, 50%)',
  'hsl(280, 70%, 50%)',
  'hsl(340, 70%, 50%)',
  'hsl(40, 70%, 50%)',
  'hsl(160, 70%, 50%)',
];

export const financialAnalysisService = {
  async getFinancialSummary(startDate: string, endDate: string): Promise<FinancialSummary> {
    // Get revenue, supplier charges, and sales commissions from orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('total_price, supplier_charges, sales_commission')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (ordersError) throw ordersError;

    // Get expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('amount')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

    if (expensesError) throw expensesError;

    const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_price || 0), 0) || 0;
    const supplierCharges = ordersData?.reduce((sum, order) => sum + Number(order.supplier_charges || 0), 0) || 0;
    const salesCommissions = ordersData?.reduce((sum, order) => sum + Number(order.sales_commission || 0), 0) || 0;
    const totalExpenses = expensesData?.reduce((sum, expense) => sum + Number(expense.amount || 0), 0) || 0;

    const netProfit = totalRevenue - supplierCharges - salesCommissions - totalExpenses;
    const grossProfitMargin = totalRevenue > 0 ? ((totalRevenue - supplierCharges) / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      supplierCharges,
      salesCommissions,
      netProfit,
      grossProfitMargin,
    };
  },

  async getExpensesByCategory(startDate: string, endDate: string): Promise<ExpenseByCategory[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        amount,
        expense_categories!inner(name)
      `)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

    if (error) throw error;

    const categoryTotals = new Map<string, number>();
    let totalAmount = 0;

    data?.forEach(expense => {
      const category = expense.expense_categories?.name || 'Uncategorized';
      const amount = Number(expense.amount || 0);
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
      totalAmount += amount;
    });

    return Array.from(categoryTotals.entries()).map(([category, amount], index) => ({
      category,
      amount,
      percentage: totalAmount > 0 ? (amount / totalAmount) * 100 : 0,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }));
  },

  async getMonthlyTrends(year: number): Promise<MonthlyTrend[]> {
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const trends: MonthlyTrend[] = [];

    for (const month of months) {
      try {
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        console.log(`Processing month ${month}: ${startDate} to ${endDate}`);

        const summary = await this.getFinancialSummary(startDate, endDate);
        
        trends.push({
          month: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' }),
          revenue: summary.totalRevenue,
          expenses: summary.totalExpenses + summary.supplierCharges + summary.salesCommissions,
          profit: summary.netProfit,
        });
      } catch (error) {
        console.error(`Error processing month ${month}:`, error);
        // Add empty data for this month to maintain chart structure
        trends.push({
          month: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' }),
          revenue: 0,
          expenses: 0,
          profit: 0,
        });
      }
    }

    return trends;
  },

  async getVendorAnalysis(startDate: string, endDate: string): Promise<VendorAnalysis[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        vendor,
        amount,
        expense_categories!inner(name)
      `)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .not('vendor', 'is', null);

    if (error) throw error;

    const vendorMap = new Map<string, { totalAmount: number; expenseCount: number; categories: Set<string> }>();

    data?.forEach(expense => {
      const vendor = expense.vendor || 'Unknown';
      const amount = Number(expense.amount || 0);
      const category = expense.expense_categories?.name || 'Uncategorized';

      if (!vendorMap.has(vendor)) {
        vendorMap.set(vendor, { totalAmount: 0, expenseCount: 0, categories: new Set() });
      }

      const vendorData = vendorMap.get(vendor)!;
      vendorData.totalAmount += amount;
      vendorData.expenseCount += 1;
      vendorData.categories.add(category);
    });

    return Array.from(vendorMap.entries()).map(([vendor, data]) => ({
      vendor,
      totalAmount: data.totalAmount,
      expenseCount: data.expenseCount,
      categories: Array.from(data.categories),
    })).sort((a, b) => b.totalAmount - a.totalAmount);
  },

  async getTaxDeductibleSummary(startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        amount,
        tax_deductible,
        expense_categories!inner(name)
      `)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

    if (error) throw error;

    const deductibleExpenses = data?.filter(expense => expense.tax_deductible) || [];
    const nonDeductibleExpenses = data?.filter(expense => !expense.tax_deductible) || [];

    const totalDeductible = deductibleExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
    const totalNonDeductible = nonDeductibleExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    return {
      totalDeductible,
      totalNonDeductible,
      deductibleCount: deductibleExpenses.length,
      nonDeductibleCount: nonDeductibleExpenses.length,
      deductibleExpenses,
    };
  },
};
