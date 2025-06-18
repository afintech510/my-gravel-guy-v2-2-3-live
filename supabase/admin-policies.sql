
-- =====================================================
-- PHASE 3: ADMIN TABLE SECURITY POLICIES
-- Row Level Security policies for admin tables
-- =====================================================

-- Enable RLS on admin tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ADMIN_USERS TABLE POLICIES
-- =====================================================

-- Policy: Super admins can view all admin users
CREATE POLICY "admin_users_super_admin_select" ON public.admin_users
  FOR SELECT
  USING (public.is_admin_with_role('super_admin'));

-- Policy: Admins can view admin users with same or lower role
CREATE POLICY "admin_users_admin_select" ON public.admin_users
  FOR SELECT
  USING (
    public.is_admin_with_role('admin') AND
    role IN ('admin', 'manager', 'viewer')
  );

-- Policy: Managers can view managers and viewers
CREATE POLICY "admin_users_manager_select" ON public.admin_users
  FOR SELECT
  USING (
    public.is_admin_with_role('manager') AND
    role IN ('manager', 'viewer')
  );

-- Policy: Users can view their own admin record
CREATE POLICY "admin_users_own_select" ON public.admin_users
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Only super admins can insert new admin users
CREATE POLICY "admin_users_super_admin_insert" ON public.admin_users
  FOR INSERT
  WITH CHECK (public.is_admin_with_role('super_admin'));

-- Policy: Super admins can update any admin user
CREATE POLICY "admin_users_super_admin_update" ON public.admin_users
  FOR UPDATE
  USING (public.is_admin_with_role('super_admin'));

-- Policy: Admins can update lower-role users
CREATE POLICY "admin_users_admin_update" ON public.admin_users
  FOR UPDATE
  USING (
    public.is_admin_with_role('admin') AND
    role IN ('manager', 'viewer')
  );

-- Policy: Users can update their own last_login_at
CREATE POLICY "admin_users_own_login_update" ON public.admin_users
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Only super admins can delete admin users
CREATE POLICY "admin_users_super_admin_delete" ON public.admin_users
  FOR DELETE
  USING (public.is_admin_with_role('super_admin'));

-- =====================================================
-- AUDIT_LOGS TABLE POLICIES
-- =====================================================

-- Policy: Super admins can view all audit logs
CREATE POLICY "audit_logs_super_admin_select" ON public.audit_logs
  FOR SELECT
  USING (public.is_admin_with_role('super_admin'));

-- Policy: Admins can view audit logs
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT
  USING (public.is_admin_with_role('admin'));

-- Policy: System can insert audit logs
CREATE POLICY "audit_logs_system_insert" ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Policy: No updates allowed on audit logs (immutable)
-- (No update policy = no updates allowed)

-- Policy: Only super admins can delete audit logs (for cleanup)
CREATE POLICY "audit_logs_super_admin_delete" ON public.audit_logs
  FOR DELETE
  USING (public.is_admin_with_role('super_admin'));
