
-- =====================================================
-- PHASE 3: STORAGE & AUTHENTICATION - ADMIN SCHEMA
-- Create admin_users table and audit logging
-- =====================================================

-- 1. Create admin_users table with role-based permissions
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'viewer')),
  permissions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by uuid REFERENCES auth.users(id),
  last_login_at timestamp with time zone,
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON public.admin_users(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);

-- 2. Create audit_logs table for admin action tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  user_email text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  session_id text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for audit logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user ON public.audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);

-- 3. Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to admin_users table
DROP TRIGGER IF EXISTS update_admin_users_updated_at ON public.admin_users;
CREATE TRIGGER update_admin_users_updated_at
    BEFORE UPDATE ON public.admin_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Enhanced admin check function with role-based permissions
CREATE OR REPLACE FUNCTION public.is_admin_with_role(required_role text DEFAULT 'viewer')
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users au
    JOIN auth.users u ON au.user_id = u.id
    WHERE u.id = auth.uid()
    AND au.is_active = true
    AND (
      au.role = 'super_admin' OR
      (required_role = 'viewer' AND au.role IN ('admin', 'manager', 'viewer')) OR
      (required_role = 'manager' AND au.role IN ('admin', 'manager')) OR
      (required_role = 'admin' AND au.role = 'admin') OR
      (required_role = 'super_admin' AND au.role = 'super_admin')
    )
  );
$$;

-- 5. Function to get current admin user info
CREATE OR REPLACE FUNCTION public.get_current_admin_user()
RETURNS TABLE(
  id uuid,
  email text,
  role text,
  permissions jsonb,
  last_login_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT au.id, au.email, au.role, au.permissions, au.last_login_at
  FROM public.admin_users au
  JOIN auth.users u ON au.user_id = u.id
  WHERE u.id = auth.uid() AND au.is_active = true;
$$;

-- 6. Function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_action text,
  p_resource_type text,
  p_resource_id text DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_user_id uuid;
  v_user_email text;
  v_audit_id uuid;
BEGIN
  -- Get current admin user
  SELECT au.id, au.email INTO v_admin_user_id, v_user_email
  FROM public.admin_users au
  JOIN auth.users u ON au.user_id = u.id
  WHERE u.id = auth.uid() AND au.is_active = true;

  -- Insert audit log
  INSERT INTO public.audit_logs (
    admin_user_id,
    user_email,
    action,
    resource_type,
    resource_id,
    old_values,
    new_values
  ) VALUES (
    v_admin_user_id,
    COALESCE(v_user_email, auth.email()),
    p_action,
    p_resource_type,
    p_resource_id,
    p_old_values,
    p_new_values
  ) RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$;

-- 7. Insert initial admin users based on existing email list
INSERT INTO public.admin_users (user_id, email, role, created_by)
SELECT 
  u.id,
  u.email,
  CASE 
    WHEN u.email IN ('admin@mygravelguy.com', 'techminded.xyz@gmail.com') THEN 'super_admin'
    WHEN u.email IN ('manager@mygravelguy.com', 'adam@easternbuilding.supply') THEN 'admin'
    ELSE 'manager'
  END as role,
  u.id as created_by
FROM auth.users u
WHERE u.email IN (
  'admin@mygravelguy.com',
  'manager@mygravelguy.com', 
  'adam@easternbuilding.supply',
  'techminded.xyz@gmail.com',
  'ronnie@easternbuilding.supply'
)
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  updated_at = timezone('utc'::text, now());

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.admin_users TO authenticated;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
