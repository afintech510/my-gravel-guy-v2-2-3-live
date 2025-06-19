
-- Fix rate_limits table schema to match rate limiter code expectations
-- The rate limiter code expects 'client_id' but table currently has 'identifier'

-- First, rename the column if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rate_limits' 
        AND column_name = 'identifier'
    ) THEN
        ALTER TABLE rate_limits RENAME COLUMN identifier TO client_id;
    END IF;
END $$;

-- Ensure the table has the correct structure expected by the rate limiter
CREATE TABLE IF NOT EXISTS rate_limits (
    id BIGSERIAL PRIMARY KEY,
    client_id TEXT NOT NULL,
    function_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_rate_limits_client_function_time 
ON rate_limits (client_id, function_name, created_at);

-- Create index for cleanup queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at 
ON rate_limits (created_at);

-- Enable Row Level Security
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow service role to manage rate limits
DROP POLICY IF EXISTS "Service role can manage rate limits" ON rate_limits;
CREATE POLICY "Service role can manage rate limits" ON rate_limits
    FOR ALL USING (auth.role() = 'service_role');
