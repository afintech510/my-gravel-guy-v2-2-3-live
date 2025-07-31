import { supabase } from '@/integrations/supabase/client';

// Processing fee rate (3%)
export const PROCESSING_FEE_RATE = 0.03;

export interface FinancialSummary {
  totalRevenue: number;
  adjustedRevenue: number;
  processingFees: number;
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

export interface OrderForFinancialAnalysis {
  id: string;
  order_id: string;
  created_at: string;
  total_price: number;
  supplier_charges?: number;
  sales_commission?: number;
  fulfillment_status?: string;
  delivery_name?: string;
  billing_name?: string;
  sales_person?: string;
}

export const financialAnalysisService = {
  async getOrdersForFinancialAnalysis(startDate: string, endDate: string): Promise<OrderForFinancialAnalysis[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_id,
        created_at,
        total_price,
        supplier_charges,
        sales_commission,
        fulfillment_status,
        delivery_name,
        billing_name,
        sales_person
      `)
      .like('order_id', 'ORDER-%')
      .neq('fulfillment_status', 'Refunded')
      .neq('fulfillment_status', 'Archived')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(order => ({
      id: order.id,
      order_id: order.order_id,
      created_at: order.created_at,
      total_price: Number(order.total_price || 0),
      supplier_charges: Number(order.supplier_charges || 0),
      sales_commission: Number(order.sales_commission || 0),
      fulfillment_status: order.fulfillment_status,
      delivery_name: order.delivery_name,
      billing_name: order.billing_name,
      sales_person: order.sales_person,
    }));
  },

  async getFinancialSummary(startDate: string, endDate: string): Promise<FinancialSummary> {
    // Get revenue, supplier charges, and sales commissions from orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('total_price, supplier_charges, sales_commission, order_id, fulfillment_status')
      .like('order_id', 'ORDER-%')
      .neq('fulfillment_status', 'Refunded')
      .neq('fulfillment_status', 'Archived')
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

    // Calculate 3% processing fee
    const processingFees = totalRevenue * PROCESSING_FEE_RATE;
    const adjustedRevenue = totalRevenue - processingFees;

    const netProfit = adjustedRevenue - supplierCharges - salesCommissions - totalExpenses;
    const grossProfitMargin = totalRevenue > 0 ? ((totalRevenue - supplierCharges) / totalRevenue) * 100 : 0;

    return {
      totalRevenue,
      adjustedRevenue,
      processingFees,
      totalExpenses,
      supplierCharges,
      salesCommissions,
      netProfit,
      grossProfitMargin,
    };
  },

  async getExpensesByCategory(startDate: string, endDate: string): Promise<ExpenseByCategory[]> {
    // Get regular expenses
    const { data, error } = await supabase
      .from('expenses')
      .select(`
        amount,
        expense_categories!inner(name)
      `)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate);

    if (error) throw error;

    // Get processing fees from orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('total_price')
      .like('order_id', 'ORDER-%')
      .neq('fulfillment_status', 'Refunded')
      .neq('fulfillment_status', 'Archived')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (ordersError) throw ordersError;

    const categoryTotals = new Map<string, number>();
    let totalAmount = 0;

    // Add regular expenses
    data?.forEach(expense => {
      const category = expense.expense_categories?.name || 'Uncategorized';
      const amount = Number(expense.amount || 0);
      categoryTotals.set(category, (categoryTotals.get(category) || 0) + amount);
      totalAmount += amount;
    });

    // Add processing fees
    const totalRevenue = ordersData?.reduce((sum, order) => sum + Number(order.total_price || 0), 0) || 0;
    const processingFees = totalRevenue * PROCESSING_FEE_RATE;
    if (processingFees > 0) {
      categoryTotals.set('Processing Fees', processingFees);
      totalAmount += processingFees;
    }

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
          revenue: summary.adjustedRevenue,
          expenses: summary.totalExpenses + summary.supplierCharges + summary.salesCommissions + summary.processingFees,
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
