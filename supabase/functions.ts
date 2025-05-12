
// This file contains SQL functions that can be executed in Supabase SQL editor

export const getTableInfoFunction = `
CREATE OR REPLACE FUNCTION get_table_info(table_name TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable BOOLEAN,
  column_default TEXT
) LANGUAGE sql SECURITY DEFINER AS $$
SELECT 
  column_name::text, 
  data_type::text, 
  (is_nullable = 'YES') as is_nullable, 
  column_default::text
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' AND 
  table_name = $1
ORDER BY 
  ordinal_position;
$$;
`;
