
-- Server-side admin authorization function
-- This ensures admin checks happen on the server, not in client-side code

CREATE OR REPLACE FUNCTION check_user_admin_status(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_emails TEXT[] := ARRAY[
    'admin@mygravelguy.com',
    'manager@mygravelguy.com', 
    'adam@easternbuilding.supply',
    'techminded.xyz@gmail.com',
    'ronnie@easternbuilding.supply'
  ];
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user email is in admin list
  IF user_email = ANY(admin_emails) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_user_admin_status(TEXT) TO authenticated;
