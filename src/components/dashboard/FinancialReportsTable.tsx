import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { VendorAnalysis } from '@/services/financialAnalysisService';

interface VendorAnalysisTableProps {
  data: VendorAnalysis[];
}

export function VendorAnalysisTable({ data }: VendorAnalysisTableProps) {
  const exportToCSV = () => {
    const headers = ['Vendor', 'Total Amount', 'Expense Count', 'Categories'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => [
        row.vendor,
        row.totalAmount,
        row.expenseCount,
        row.categories.join('; ')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vendor-analysis.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Vendor Analysis</CardTitle>
        <Button onClick={exportToCSV} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Expense Count</TableHead>
              <TableHead>Categories</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((vendor, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{vendor.vendor}</TableCell>
                <TableCell>${vendor.totalAmount.toLocaleString()}</TableCell>
                <TableCell>{vendor.expenseCount}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {vendor.categories.map((category, catIndex) => (
                      <span 
                        key={catIndex}
                        className="px-2 py-1 bg-secondary text-secondary-foreground rounded-sm text-xs"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

interface TaxDeductibleSummaryProps {
  totalDeductible: number;
  totalNonDeductible: number;
  deductibleCount: number;
  nonDeductibleCount: number;
}

export function TaxDeductibleSummary({ 
  totalDeductible, 
  totalNonDeductible, 
  deductibleCount, 
  nonDeductibleCount 
}: TaxDeductibleSummaryProps) {
  const total = totalDeductible + totalNonDeductible;
  const deductiblePercentage = total > 0 ? (totalDeductible / total) * 100 : 0;

  const exportTaxReport = () => {
    const taxData = {
      'Total Deductible Expenses': `$${totalDeductible.toLocaleString()}`,
      'Total Non-Deductible Expenses': `$${totalNonDeductible.toLocaleString()}`,
      'Deductible Expense Count': deductibleCount,
      'Non-Deductible Expense Count': nonDeductibleCount,
      'Deductible Percentage': `${deductiblePercentage.toFixed(1)}%`,
    };

    const csvContent = [
      'Category,Amount',
      ...Object.entries(taxData).map(([key, value]) => `${key},${value}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tax-deductible-summary.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tax Deductible Summary</CardTitle>
        <Button onClick={exportTaxReport} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Tax Report
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Tax Deductible Expenses</p>
            <p className="text-2xl font-bold text-green-600">${totalDeductible.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{deductibleCount} expenses</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Non-Deductible Expenses</p>
            <p className="text-2xl font-bold text-red-600">${totalNonDeductible.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">{nonDeductibleCount} expenses</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Deductible Percentage</span>
            <span className="text-lg font-bold">{deductiblePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2 mt-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${deductiblePercentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}