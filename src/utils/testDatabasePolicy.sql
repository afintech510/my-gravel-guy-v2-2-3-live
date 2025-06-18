
-- Enable Row Level Security on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow inserts for all authenticated users (for testing)
CREATE POLICY "allow_insert_orders_test" ON public.orders
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow users to select all orders (for testing)
CREATE POLICY "allow_select_orders_test" ON public.orders
  FOR SELECT
  USING (true);

-- Create policy to allow updates for all authenticated users (for testing)
CREATE POLICY "allow_update_orders_test" ON public.orders
  FOR UPDATE
  USING (true);
