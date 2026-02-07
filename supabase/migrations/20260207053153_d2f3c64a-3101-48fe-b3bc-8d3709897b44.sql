-- Add delivery scheduling columns to leads table for cart save integration
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS delivery_date date,
ADD COLUMN IF NOT EXISTS delivery_time_preference text,
ADD COLUMN IF NOT EXISTS delivery_instructions text;