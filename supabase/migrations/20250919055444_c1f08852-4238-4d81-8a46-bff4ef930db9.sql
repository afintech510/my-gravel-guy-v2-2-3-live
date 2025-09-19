-- Add columns to orders table for deposit payment tracking
ALTER TABLE public.orders 
ADD COLUMN is_deposit_payment boolean DEFAULT false,
ADD COLUMN deposit_amount numeric DEFAULT NULL,
ADD COLUMN balance_due numeric DEFAULT NULL,
ADD COLUMN payment_terms text DEFAULT NULL;