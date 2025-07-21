import React, { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { ExpenseTable } from '@/components/dashboard/ExpenseTable';
import { ExpenseStatsWidget } from '@/components/dashboard/ExpenseStatsWidget';
import { AddExpenseDialog } from '@/components/dashboard/AddExpenseDialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const DashboardExpenses = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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
        <ExpenseTable />
        
        {/* Add Expense Dialog */}
        <AddExpenseDialog 
          open={isAddDialogOpen} 
          onOpenChange={setIsAddDialogOpen}
        />
      </div>
    </DashboardLayout>
  );
};

export default DashboardExpenses;