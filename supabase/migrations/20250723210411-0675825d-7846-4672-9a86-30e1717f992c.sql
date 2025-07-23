-- Drop existing hardcoded RLS policies on messages table
DROP POLICY IF EXISTS "Admin users can view all messages" ON messages;
DROP POLICY IF EXISTS "Admin users can insert messages" ON messages;
DROP POLICY IF EXISTS "Admin users can update messages" ON messages;

-- Create new RLS policies using the is_admin() function
CREATE POLICY "admins_can_view_all_messages" ON messages
  FOR SELECT 
  USING (is_admin());

CREATE POLICY "admins_can_insert_messages" ON messages
  FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "admins_can_update_messages" ON messages
  FOR UPDATE 
  USING (is_admin());

-- Allow service role to insert messages (for webhook functionality)
CREATE POLICY "service_role_can_insert_messages" ON messages
  FOR INSERT 
  TO service_role
  WITH CHECK (true);