
-- Create the price_tiers table with product_id as an array
CREATE TABLE IF NOT EXISTS price_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id TEXT[] NOT NULL, -- Array of product IDs
  min_tons NUMERIC NOT NULL,
  max_tons NUMERIC, -- NULL means no upper limit
  multiplier NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO price_tiers (product_id, min_tons, max_tons, multiplier)
VALUES 
  (ARRAY['1', '2'], 0, 5, 1.0),
  (ARRAY['1', '2'], 6, 10, 0.95),
  (ARRAY['1', '2'], 11, 20, 0.90),
  (ARRAY['1', '2'], 21, NULL, 0.85);

-- Create the get_tables function
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE (
  table_name TEXT,
  table_schema TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    t.table_schema::TEXT
  FROM 
    information_schema.tables t
  WHERE 
    t.table_schema = 'public';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions for the RPC function
GRANT EXECUTE ON FUNCTION get_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION get_tables() TO anon;
GRANT EXECUTE ON FUNCTION get_tables() TO service_role;
