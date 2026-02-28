-- Track abandoned cart email sequences
CREATE TABLE IF NOT EXISTS public.abandoned_cart_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_order_id TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  sequence_number INTEGER NOT NULL CHECK (sequence_number IN (1, 2, 3)),
  sent_at TIMESTAMPTZ DEFAULT now(),
  cart_created_at TIMESTAMPTZ NOT NULL,
  cart_items_json JSONB NOT NULL,
  unsubscribed BOOLEAN DEFAULT false,
  UNIQUE (cart_order_id, sequence_number)
);

CREATE INDEX idx_ace_order_id ON public.abandoned_cart_emails(cart_order_id);
CREATE INDEX idx_ace_email_unsub ON public.abandoned_cart_emails(customer_email, unsubscribed);

ALTER TABLE public.abandoned_cart_emails ENABLE ROW LEVEL SECURITY;

-- Service role (edge functions) can do everything
CREATE POLICY "service_role_full" ON public.abandoned_cart_emails
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Anon can only set unsubscribed=true (for unsubscribe links)
CREATE POLICY "anon_unsubscribe" ON public.abandoned_cart_emails
  FOR UPDATE TO anon USING (true) WITH CHECK (unsubscribed = true);
