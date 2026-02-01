-- Migration 2: Create Market Materials Join Table
CREATE TABLE public.market_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  market_id UUID NOT NULL REFERENCES delivery_locations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'paused', 'draft')),
  slug_path TEXT UNIQUE,
  published_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  
  CONSTRAINT active_requires_slug CHECK (status != 'active' OR slug_path IS NOT NULL),
  
  market_display_name TEXT NOT NULL,
  material_display_name TEXT,
  
  hero_image_url TEXT,
  gallery_image_urls TEXT[],
  hero_headline TEXT,
  hero_subheadline TEXT,
  local_intro_copy TEXT,
  local_logistics_copy TEXT,
  spec_notes TEXT,
  material_caveats TEXT,
  best_uses TEXT[],
  
  seo_title TEXT,
  seo_description TEXT,
  
  faq_json JSONB DEFAULT '[]'::jsonb,
  
  min_tons INTEGER DEFAULT 20,
  max_tons INTEGER DEFAULT 500,
  expedite_enabled BOOLEAN DEFAULT true,
  sat_enabled BOOLEAN DEFAULT true,
  expedite_fee_pct NUMERIC DEFAULT 0.15,
  sat_fee_pct NUMERIC DEFAULT 0.15,
  confirmation_window_hours INTEGER DEFAULT 4,
  standard_lead_time_hours INTEGER DEFAULT 48,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(market_id, product_id)
);

CREATE INDEX idx_market_materials_status ON market_materials(status);
CREATE INDEX idx_market_materials_market_status ON market_materials(market_id, status);
CREATE INDEX idx_market_materials_product_status ON market_materials(product_id, status);

ALTER TABLE market_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_materials_public_read" ON market_materials
  FOR SELECT USING (status = 'active');

CREATE POLICY "market_materials_admin_all" ON market_materials
  FOR ALL USING (is_admin());