-- Migration 1: Create Market Aliases Table
CREATE TABLE public.market_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_slug TEXT NOT NULL UNIQUE,
  market_id UUID NOT NULL REFERENCES delivery_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Format: lowercase, hyphen-separated, no special chars, 3-100 chars
  CONSTRAINT valid_alias_slug_format CHECK (
    alias_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND
    length(alias_slug) >= 3 AND
    length(alias_slug) <= 100
  )
);

CREATE INDEX idx_market_aliases_market_id ON market_aliases(market_id);

-- RLS
ALTER TABLE market_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_aliases_public_read" ON market_aliases
  FOR SELECT USING (true);

CREATE POLICY "market_aliases_admin_all" ON market_aliases
  FOR ALL USING (is_admin());