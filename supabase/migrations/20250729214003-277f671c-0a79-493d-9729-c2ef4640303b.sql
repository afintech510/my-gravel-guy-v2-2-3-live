-- Create a function to get fulfillment status enum values
CREATE OR REPLACE FUNCTION get_fulfillment_status_enum_values()
RETURNS TABLE(enumlabel text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT e.enumlabel::text
  FROM pg_type t 
  JOIN pg_enum e ON t.oid = e.enumtypid 
  WHERE t.typname = 'fulfillment_status_enum' 
  ORDER BY e.enumsortorder;
$$;