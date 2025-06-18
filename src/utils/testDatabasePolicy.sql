
-- =====================================================
-- NOTICE: This file has been replaced by databaseSecurityPolicies.sql
-- =====================================================

-- The test policies in this file have been replaced with comprehensive
-- Row Level Security policies in databaseSecurityPolicies.sql
-- 
-- To apply the new security policies, run the SQL commands in:
-- src/utils/databaseSecurityPolicies.sql
--
-- This will:
-- 1. Enable RLS on all tables
-- 2. Create proper security policies for each table
-- 3. Implement admin-only and user-specific access controls
-- 4. Secure customer data in the orders table
--
-- The old test policies below are commented out and should not be used:

/*
-- OLD TEST POLICIES - DO NOT USE IN PRODUCTION

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
*/

-- To implement the new security policies, execute the SQL file:
-- src/utils/databaseSecurityPolicies.sql

