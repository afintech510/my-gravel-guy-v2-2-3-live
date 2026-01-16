
-- Create a more restrictive admin check function specifically for financial analysis
CREATE OR REPLACE FUNCTION check_financial_admin_status(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  financial_admin_emails TEXT[] := ARRAY[
    'techminded.xyz@gmail.com',
    'adam@easternbuilding.supply',
    'adam.larkin@mygravelguy.com'
  ];
BEGIN
  -- Ensure user is authenticated
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user email is in financial admin list
  IF user_email = ANY(financial_admin_emails) THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_financial_admin_status(TEXT) TO authenticated;
