import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { useFinancialAuth } from '@/hooks/useFinancialAuth';
import { financialAnalysisService, FinancialSummary, ExpenseByCategory, MonthlyTrend, VendorAnalysis } from '@/services/financialAnalysisService';
import { FinancialOverviewCard } from '@/components/dashboard/FinancialOverviewCard';
import { ExpensePieChart, MonthlyTrendsChart, VendorAnalysisChart } from '@/components/dashboard/FinancialCharts';
import { VendorAnalysisTable, TaxDeductibleSummary } from '@/components/dashboard/FinancialReportsTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CalendarDays, TrendingUp, PieChart, BarChart3, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const DashboardAnalyze = () => {
  const { isFinancialAdmin, loading } = useFinancialAuth();
  const [timePeriod, setTimePeriod] = useState('current-month');
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [expensesByCategory, setExpensesByCategory] = useState<ExpenseByCategory[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrend[]>([]);
  const [vendorAnalysis, setVendorAnalysis] = useState<VendorAnalysis[]>([]);
  const [taxSummary, setTaxSummary] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(false);

  const getDateRange = (period: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    try {
      switch (period) {
        case 'current-month':
          return {
            start: new Date(year, month, 1).toISOString().split('T')[0],
            end: new Date(year, month + 1, 0).toISOString().split('T')[0],
          };
        case 'last-month':
          return {
            start: new Date(year, month - 1, 1).toISOString().split('T')[0],
            end: new Date(year, month, 0).toISOString().split('T')[0],
          };
        case 'current-quarter':
          const quarterStart = new Date(year, Math.floor(month / 3) * 3, 1);
          const quarterEnd = new Date(year, Math.floor(month / 3) * 3 + 3, 0);
          return {
            start: quarterStart.toISOString().split('T')[0],
            end: quarterEnd.toISOString().split('T')[0],
          };
        case 'current-year':
          return {
            start: new Date(year, 0, 1).toISOString().split('T')[0],
            end: new Date(year, 11, 31).toISOString().split('T')[0],
          };
        default:
          return {
            start: new Date(year, month, 1).toISOString().split('T')[0],
            end: new Date(year, month + 1, 0).toISOString().split('T')[0],
          };
      }
    } catch (error) {
      console.error('Error calculating date range:', error);
      // Fallback to current month
      return {
        start: new Date(year, month, 1).toISOString().split('T')[0],
        end: new Date(year, month + 1, 0).toISOString().split('T')[0],
      };
    }
  };

  const loadFinancialData = async () => {
    setDataLoading(true);
    try {
      const { start, end } = getDateRange(timePeriod);
      console.log('Loading financial data for date range:', { start, end });

      const [summary, expenses, trends, vendors, tax] = await Promise.all([
        financialAnalysisService.getFinancialSummary(start, end),
        financialAnalysisService.getExpensesByCategory(start, end),
        financialAnalysisService.getMonthlyTrends(new Date().getFullYear()),
        financialAnalysisService.getVendorAnalysis(start, end),
        financialAnalysisService.getTaxDeductibleSummary(start, end),
      ]);

      setFinancialSummary(summary);
      setExpensesByCategory(expenses);
      setMonthlyTrends(trends);
      setVendorAnalysis(vendors);
      setTaxSummary(tax);
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isFinancialAdmin) {
      loadFinancialData();
    }
  }, [isFinancialAdmin, timePeriod]);

  if (loading) {
    return (
      <DashboardLayout title="Financial Analysis" subtitle="Loading access verification...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!isFinancialAdmin) {
    return (
      <DashboardLayout title="Financial Analysis" subtitle="Access Restricted">
        <Alert className="max-w-md mx-auto mt-8">
          <AlertDescription>
            This page is restricted to financial administrators only. Please contact your system administrator for access.
          </AlertDescription>
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Financial Analysis" subtitle="Comprehensive business financial insights">
      <div className="space-y-6">
        {/* Time Period Filter */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Time Period
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timePeriod} onValueChange={setTimePeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current-month">Current Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="current-quarter">Current Quarter</SelectItem>
                  <SelectItem value="current-year">Current Year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadFinancialData} disabled={dataLoading}>
                Refresh
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Financial Overview Cards */}
        {financialSummary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FinancialOverviewCard
              title="Total Revenue"
              value={financialSummary.totalRevenue}
              formatAsCurrency
              icon={<TrendingUp className="h-4 w-4 text-green-500" />}
            />
            <FinancialOverviewCard
              title="Net Profit"
              value={financialSummary.netProfit}
              formatAsCurrency
              icon={<BarChart3 className="h-4 w-4 text-blue-500" />}
            />
            <FinancialOverviewCard
              title="Total Expenses"
              value={financialSummary.totalExpenses}
              formatAsCurrency
              icon={<PieChart className="h-4 w-4 text-red-500" />}
            />
            <FinancialOverviewCard
              title="Gross Profit Margin"
              value={financialSummary.grossProfitMargin}
              formatAsPercentage
              icon={<FileText className="h-4 w-4 text-purple-500" />}
            />
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {expensesByCategory.length > 0 && (
            <ExpensePieChart data={expensesByCategory} />
          )}
          {monthlyTrends.length > 0 && (
            <MonthlyTrendsChart data={monthlyTrends} />
          )}
        </div>

        {/* Vendor Analysis Chart */}
        {vendorAnalysis.length > 0 && (
          <VendorAnalysisChart data={vendorAnalysis} />
        )}

        {/* Reports Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {vendorAnalysis.length > 0 && (
            <VendorAnalysisTable data={vendorAnalysis} />
          )}
          {taxSummary && (
            <TaxDeductibleSummary 
              totalDeductible={taxSummary.totalDeductible}
              totalNonDeductible={taxSummary.totalNonDeductible}
              deductibleCount={taxSummary.deductibleCount}
              nonDeductibleCount={taxSummary.nonDeductibleCount}
            />
          )}
        </div>

        {/* Detailed Financial Breakdown */}
        {financialSummary && (
          <Card>
            <CardHeader>
              <CardTitle>Detailed Financial Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">Revenue</h4>
                  <p className="text-2xl font-bold">${financialSummary.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-orange-600">Cost of Goods Sold</h4>
                  <p className="text-lg">Supplier Charges: ${financialSummary.supplierCharges.toLocaleString()}</p>
                  <p className="text-lg">Sales Commissions: ${financialSummary.salesCommissions.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-red-600">Operating Expenses</h4>
                  <p className="text-lg">${financialSummary.totalExpenses.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-semibold">Net Profit:</span>
                  <span className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${financialSummary.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default DashboardAnalyze;
