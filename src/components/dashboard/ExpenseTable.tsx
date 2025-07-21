
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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

interface ExpenseTableProps {
  onEditExpense: (expense: Expense) => void;
  refreshTrigger: number;
}

export const ExpenseTable = ({ onEditExpense, refreshTrigger }: ExpenseTableProps) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          id,
          name,
          amount,
          expense_type,
          expense_date,
          vendor,
          tax_deductible,
          notes,
          payment_method,
          category_id,
          expense_categories:category_id (
            name,
            color
          )
        `)
        .order('expense_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedData = data?.map(expense => ({
        ...expense,
        category: expense.expense_categories
      })) || [];

      setExpenses(formattedData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to load expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExpenses(expenses.filter(expense => expense.id !== id));
      toast({
        title: "Success",
        description: "Expense deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshTrigger]);

  const getExpenseTypeBadge = (type: string) => {
    const variants = {
      fixed_monthly: 'default',
      variable_monthly: 'secondary',
      one_time: 'outline'
    } as const;

    const labels = {
      fixed_monthly: 'Fixed Monthly',
      variable_monthly: 'Variable Monthly',
      one_time: 'One Time'
    };

    return (
      <Badge variant={variants[type as keyof typeof variants]}>
        {labels[type as keyof typeof labels]}
      </Badge>
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading expenses...</div>;
  }

  return (
    <div className="border rounded-lg border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Vendor</TableHead>
            <TableHead>Tax Deductible</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell className="font-medium">{expense.name}</TableCell>
              <TableCell>
                {expense.category && (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: expense.category.color }}
                    />
                    <span className="text-foreground">{expense.category.name}</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-foreground">${expense.amount.toFixed(2)}</TableCell>
              <TableCell>{getExpenseTypeBadge(expense.expense_type)}</TableCell>
              <TableCell className="text-foreground">{format(new Date(expense.expense_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell className="text-foreground">{expense.vendor || '-'}</TableCell>
              <TableCell>
                <Badge variant={expense.tax_deductible ? 'default' : 'outline'}>
                  {expense.tax_deductible ? 'Yes' : 'No'}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onEditExpense(expense)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => deleteExpense(expense.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {expenses.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No expenses found. Add your first expense to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
