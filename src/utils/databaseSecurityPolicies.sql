

-- =====================================================
-- PHASE 1: CRITICAL DATABASE SECURITY IMPLEMENTATION
-- Row Level Security (RLS) Policies for All Tables
-- =====================================================

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.email IN (
      'admin@mygravelguy.com',
      'manager@mygravelguy.com',
      'adam@easternbuilding.supply',
      'techminded.xyz@gmail.com',
      'ronnie@easternbuilding.supply'
    )
  );
$$;

-- =====================================================
-- 1. ORDERS TABLE - Critical Customer Data Protection
-- =====================================================

-- Enable RLS on orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing test policies if they exist
DROP POLICY IF EXISTS "allow_insert_orders_test" ON public.orders;
DROP POLICY IF EXISTS "allow_select_orders_test" ON public.orders;
DROP POLICY IF EXISTS "allow_update_orders_test" ON public.orders;

-- Policy: Users can only view their own orders (by email)
CREATE POLICY "orders_select_own_data" ON public.orders
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      delivery_email = auth.email() OR
      billing_email = auth.email() OR
      public.is_admin()
    )
  );

-- Policy: Users can only insert orders with their own email
CREATE POLICY "orders_insert_own_data" ON public.orders
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      delivery_email = auth.email() OR
      billing_email = auth.email() OR
      public.is_admin()
    )
  );

-- Policy: Users can only update their own orders (limited fields)
CREATE POLICY "orders_update_own_data" ON public.orders
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      delivery_email = auth.email() OR
      billing_email = auth.email() OR
      public.is_admin()
    )
  );

-- Policy: Only admins can delete orders
CREATE POLICY "orders_delete_admin_only" ON public.orders
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 2. CUSTOMER REVIEWS - Public Read, Authenticated Write
-- =====================================================

-- Enable RLS on customer_reviews table
ALTER TABLE public.customer_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for all reviews
CREATE POLICY "reviews_public_read" ON public.customer_reviews
  FOR SELECT
  USING (true);

-- Policy: Authenticated users can insert reviews
CREATE POLICY "reviews_authenticated_insert" ON public.customer_reviews
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update their own reviews or admins can update any
CREATE POLICY "reviews_update_own_or_admin" ON public.customer_reviews
  FOR UPDATE
  USING (
    public.is_admin() OR
    (auth.uid() IS NOT NULL AND user_name = auth.email())
  );

-- Policy: Only admins can delete reviews
CREATE POLICY "reviews_delete_admin_only" ON public.customer_reviews
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 3. BLOG POSTS - Public Read, Admin Write
-- =====================================================

-- Enable RLS on blog_posts table
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for published posts
CREATE POLICY "blog_posts_public_read" ON public.blog_posts
  FOR SELECT
  USING (published_at IS NOT NULL OR public.is_admin());

-- Policy: Only admins can insert blog posts
CREATE POLICY "blog_posts_admin_insert" ON public.blog_posts
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy: Only admins can update blog posts
CREATE POLICY "blog_posts_admin_update" ON public.blog_posts
  FOR UPDATE
  USING (public.is_admin());

-- Policy: Only admins can delete blog posts
CREATE POLICY "blog_posts_admin_delete" ON public.blog_posts
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 4. BLOG CATEGORIES - Public Read, Admin Write
-- =====================================================

-- Enable RLS on blog_categories table
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for all categories
CREATE POLICY "blog_categories_public_read" ON public.blog_categories
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert categories
CREATE POLICY "blog_categories_admin_insert" ON public.blog_categories
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy: Only admins can update categories
CREATE POLICY "blog_categories_admin_update" ON public.blog_categories
  FOR UPDATE
  USING (public.is_admin());

-- Policy: Only admins can delete categories
CREATE POLICY "blog_categories_admin_delete" ON public.blog_categories
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 5. PRODUCTS - Public Read, Admin Write
-- =====================================================

-- Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for all products
CREATE POLICY "products_public_read" ON public.products
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert products
CREATE POLICY "products_admin_insert" ON public.products
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy: Only admins can update products
CREATE POLICY "products_admin_update" ON public.products
  FOR UPDATE
  USING (public.is_admin());

-- Policy: Only admins can delete products
CREATE POLICY "products_admin_delete" ON public.products
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 6. DELIVERY LOCATIONS - Public Read, Admin Write
-- =====================================================

-- Enable RLS on delivery_locations table
ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for all delivery locations
CREATE POLICY "delivery_locations_public_read" ON public.delivery_locations
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert delivery locations
CREATE POLICY "delivery_locations_admin_insert" ON public.delivery_locations
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy: Only admins can update delivery locations
CREATE POLICY "delivery_locations_admin_update" ON public.delivery_locations
  FOR UPDATE
  USING (public.is_admin());

-- Policy: Only admins can delete delivery locations
CREATE POLICY "delivery_locations_admin_delete" ON public.delivery_locations
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 7. LOCATION SEARCH - Internal Logging Only
-- =====================================================

-- Enable RLS on location_search table
ALTER TABLE public.location_search ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read location search logs
CREATE POLICY "location_search_admin_read" ON public.location_search
  FOR SELECT
  USING (public.is_admin());

-- Policy: System can insert search logs (for internal logging)
CREATE POLICY "location_search_system_insert" ON public.location_search
  FOR INSERT
  WITH CHECK (true); -- Allow system logging

-- Policy: Only admins can update search logs
CREATE POLICY "location_search_admin_update" ON public.location_search
  FOR UPDATE
  USING (public.is_admin());

-- Policy: Only admins can delete search logs
CREATE POLICY "location_search_admin_delete" ON public.location_search
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 8. SERVICE ZIP CODES - Public Read, Admin Write
-- =====================================================

-- Enable RLS on service_zip_codes table
ALTER TABLE public.service_zip_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for pricing calculations
CREATE POLICY "service_zip_codes_public_read" ON public.service_zip_codes
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert zip codes
CREATE POLICY "service_zip_codes_admin_insert" ON public.service_zip_codes
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy: Only admins can update zip codes
CREATE POLICY "service_zip_codes_admin_update" ON public.service_zip_codes
  FOR UPDATE
  USING (public.is_admin());

-- Policy: Only admins can delete zip codes
CREATE POLICY "service_zip_codes_admin_delete" ON public.service_zip_codes
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- 9. PRICE TIERS - Public Read, Admin Write
-- =====================================================

-- Enable RLS on price_tiers table (if it exists)
ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access for pricing calculations
CREATE POLICY "price_tiers_public_read" ON public.price_tiers
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert price tiers
CREATE POLICY "price_tiers_admin_insert" ON public.price_tiers
  FOR INSERT
  WITH CHECK (public.is_admin());

-- Policy: Only admins can update price tiers
CREATE POLICY "price_tiers_admin_update" ON public.price_tiers
  FOR UPDATE
  USING (public.is_admin());

-- Policy: Only admins can delete price tiers
CREATE POLICY "price_tiers_admin_delete" ON public.price_tiers
  FOR DELETE
  USING (public.is_admin());

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Query to verify RLS is enabled on all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'orders', 'customer_reviews', 'blog_posts', 'blog_categories',
    'products', 'delivery_locations', 'location_search', 
    'service_zip_codes', 'price_tiers'
  )
ORDER BY tablename;

-- Query to list all policies created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

