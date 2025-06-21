
-- Production Database Policies with Proper RLS
-- This replaces the test policies with secure, production-ready policies

-- Drop existing test policies (these were too permissive)
DROP POLICY IF EXISTS "allow_insert_orders_test" ON public.orders;
DROP POLICY IF EXISTS "allow_select_orders_test" ON public.orders;
DROP POLICY IF EXISTS "allow_update_orders_test" ON public.orders;

-- Ensure RLS is enabled on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create secure policies that restrict access to user's own data

-- Allow authenticated users to insert their own orders
CREATE POLICY "users_can_insert_own_orders" ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    (delivery_email = auth.jwt() ->> 'email' OR billing_email = auth.jwt() ->> 'email')
  );

-- Allow users to view only their own orders
CREATE POLICY "users_can_view_own_orders" ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    delivery_email = auth.jwt() ->> 'email' OR 
    billing_email = auth.jwt() ->> 'email'
  );

-- Allow admins to view all orders (server-side admin check will be implemented)
CREATE POLICY "admins_can_view_all_orders" ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data ->> 'is_admin' = 'true'
    )
  );

-- Allow admins to update orders
CREATE POLICY "admins_can_update_orders" ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data ->> 'is_admin' = 'true'
    )
  );

-- Allow system/service role to insert orders (for payment processing)
CREATE POLICY "service_role_can_insert_orders" ON public.orders
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Secure storage bucket policies
-- Remove overly permissive public access, require authentication

-- Drop existing public policies
DROP POLICY IF EXISTS "Allow public uploads to customer-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads from customer-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public deletes from customer-uploads" ON storage.objects;

-- Create secure authenticated-only policies
CREATE POLICY "authenticated_users_can_upload" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'customer-uploads' AND auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_can_read_own_files" ON storage.objects
  FOR SELECT 
  TO authenticated
  USING (
    bucket_id = 'customer-uploads' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "authenticated_users_can_delete_own_files" ON storage.objects
  FOR DELETE 
  TO authenticated
  USING (
    bucket_id = 'customer-uploads' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
