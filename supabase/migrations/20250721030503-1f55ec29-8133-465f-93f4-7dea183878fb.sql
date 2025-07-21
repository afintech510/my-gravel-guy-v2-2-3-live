
-- Create enum for expense types
CREATE TYPE expense_type AS ENUM ('fixed_monthly', 'variable_monthly', 'one_time');

-- Create enum for payment methods
CREATE TYPE payment_method_type AS ENUM ('credit_card', 'bank_transfer', 'cash', 'check', 'paypal', 'venmo', 'zelle');

-- Create expense categories table
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  expense_type expense_type NOT NULL DEFAULT 'one_time',
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recurring_day INTEGER CHECK (recurring_day >= 1 AND recurring_day <= 31),
  vendor TEXT,
  payment_method payment_method_type,
  receipt_url TEXT,
  notes TEXT,
  tax_deductible BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for expense_categories
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expense_categories_admin_select" ON public.expense_categories
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "expense_categories_admin_insert" ON public.expense_categories
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "expense_categories_admin_update" ON public.expense_categories
  FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "expense_categories_admin_delete" ON public.expense_categories
  FOR DELETE TO authenticated
  USING (is_admin());

-- Add RLS policies for expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_admin_select" ON public.expenses
  FOR SELECT TO authenticated
  USING (is_admin());

CREATE POLICY "expenses_admin_insert" ON public.expenses
  FOR INSERT TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "expenses_admin_update" ON public.expenses
  FOR UPDATE TO authenticated
  USING (is_admin());

CREATE POLICY "expenses_admin_delete" ON public.expenses
  FOR DELETE TO authenticated
  USING (is_admin());

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expense_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expense_categories_updated_at
  BEFORE UPDATE ON public.expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_updated_at();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_updated_at();

-- Insert initial expense categories
INSERT INTO public.expense_categories (name, description, color) VALUES
  ('Technology', 'Software subscriptions, cloud services, development tools', '#3B82F6'),
  ('Marketing', 'Advertising, SEO tools, content creation', '#10B981'),
  ('Operations', 'Phone, internet, banking fees, transaction costs', '#F59E0B'),
  ('Professional Services', 'Legal, accounting, consulting', '#8B5CF6'),
  ('Equipment', 'Computer hardware, software licenses, tools', '#EF4444'),
  ('Transportation', 'Vehicle expenses, fuel, delivery costs', '#06B6D4'),
  ('Office', 'Supplies, utilities, rent', '#84CC16'),
  ('Insurance', 'Business insurance, equipment insurance', '#F97316'),
  ('Banking', 'Transaction fees, service charges, merchant fees', '#6B7280');

-- Insert some common fixed monthly expenses as examples
INSERT INTO public.expenses (category_id, name, amount, expense_type, recurring_day, vendor, tax_deductible) VALUES
  ((SELECT id FROM public.expense_categories WHERE name = 'Technology'), 'Supabase Subscription', 25.00, 'fixed_monthly', 1, 'Supabase', true),
  ((SELECT id FROM public.expense_categories WHERE name = 'Technology'), 'Lovable Subscription', 50.00, 'fixed_monthly', 1, 'Lovable', true),
  ((SELECT id FROM public.expense_categories WHERE name = 'Technology'), 'Email Service', 15.00, 'fixed_monthly', 1, 'Email Provider', true),
  ((SELECT id FROM public.expense_categories WHERE name = 'Operations'), 'Business Phone', 40.00, 'fixed_monthly', 5, 'Phone Company', true);
