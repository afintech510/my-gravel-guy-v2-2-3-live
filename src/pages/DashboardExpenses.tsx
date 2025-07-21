
import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ExpenseTable } from '@/components/dashboard/ExpenseTable';
import { ExpenseStatsWidget } from '@/components/dashboard/ExpenseStatsWidget';
import { AddExpenseDialog } from '@/components/dashboard/AddExpenseDialog';
import { EditExpenseDialog } from '@/components/dashboard/EditExpenseDialog';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { useFinancialAuth } from '@/hooks/useFinancialAuth';

interface Expense {
  id: string;
  name: string;
  amount: number;
  expense_type: 'fixed_monthly' | 'variable_monthly' | 'one_time';
  expense_date: string;
  vendor: string | null;
  category: {
    name: string;
    color: string;
  } | null;
  category_id: string | null;
  tax_deductible: boolean;
  notes: string | null;
  payment_method: string | null;
}

const DashboardExpenses = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, isFinancialAdmin, loading } = useFinancialAuth();

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  };

  const handleEditComplete = () => {
    setIsEditDialogOpen(false);
    setEditingExpense(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddComplete = () => {
    setIsAddDialogOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout 
        title="Expense Management" 
        subtitle="Loading..."
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  // Access denied for non-financial admins
  if (!isFinancialAdmin) {
    return (
      <DashboardLayout 
        title="Expense Management" 
        subtitle="Access Restricted"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-2">Hello {user?.email}</p>
            <p className="text-gray-600">You need financial admin permissions to access expense management.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Expense Management" 
      subtitle="Track and manage business expenses"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <ExpenseStatsWidget />
        
        {/* Add Expense Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Recent Expenses</h2>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>
        
        {/* Expense Table */}
        <ExpenseTable 
          onEditExpense={handleEditExpense}
          refreshTrigger={refreshTrigger}
        />
        
        {/* Add Expense Dialog */}
        <AddExpenseDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen}
          onComplete={handleAddComplete}
        />

        {/* Edit Expense Dialog */}
        <EditExpenseDialog 
          open={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen}
          expense={editingExpense}
          onComplete={handleEditComplete}
        />
      </div>
    </DashboardLayout>
  );
};

export default DashboardExpenses;
