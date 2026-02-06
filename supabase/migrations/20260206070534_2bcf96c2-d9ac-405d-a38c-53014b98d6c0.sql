-- Create leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  material TEXT,
  requested_qty NUMERIC,
  requested_unit TEXT DEFAULT 'tons',
  job_address TEXT,
  job_city TEXT,
  job_state TEXT,
  job_zip TEXT,
  target_price NUMERIC,
  timeline TEXT,
  site_access TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create supplier_quotes table
CREATE TABLE public.supplier_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id),
  
  -- Product Association
  product_id UUID REFERENCES public.products(id),
  material TEXT,
  
  -- Supplier Module
  supplier_name TEXT,
  supplier_phone TEXT,
  supplier_address TEXT,
  supplier_notes TEXT,
  
  -- Project Requirements
  qty_tons NUMERIC,
  qty_cy NUMERIC,
  spec_requirement TEXT,
  application TEXT,
  delivery_address TEXT,
  delivery_city TEXT,
  delivery_state TEXT,
  delivery_zip TEXT,
  site_access TEXT[],
  project_notes TEXT,
  
  -- Quote Details Flags
  is_all_in BOOLEAN DEFAULT false,
  material_is_unit BOOLEAN DEFAULT true,
  material_is_total BOOLEAN DEFAULT false,
  delivery_included BOOLEAN DEFAULT false,
  delivery_flat BOOLEAN DEFAULT true,
  delivery_hourly BOOLEAN DEFAULT false,
  
  -- Quote Details Values
  material_price NUMERIC,
  material_unit TEXT DEFAULT 'ton',
  delivery_rate NUMERIC,
  delivery_basis TEXT DEFAULT 'total',
  all_in_delivered_total NUMERIC,
  max_qty_per_load NUMERIC,
  max_qty_unit TEXT DEFAULT 'ton',
  lead_time TEXT,
  lead_time_notes TEXT,
  available_trucks TEXT[],
  truck_notes TEXT,
  
  -- Billing & Payment
  payment_methods TEXT[],
  cc_fee_percent NUMERIC DEFAULT 0,
  bill_by_load_tickets BOOLEAN DEFAULT false,
  payment_notes TEXT,
  
  -- Computed
  price_summary TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

-- Create indexes
CREATE INDEX idx_leads_created ON public.leads(created_at DESC);
CREATE INDEX idx_supplier_quotes_lead ON public.supplier_quotes(lead_id, created_at DESC);
CREATE INDEX idx_supplier_quotes_recent ON public.supplier_quotes(created_at DESC);
CREATE INDEX idx_supplier_quotes_product ON public.supplier_quotes(product_id);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_quotes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads (admin only)
CREATE POLICY "leads_admin_select" ON public.leads
  FOR SELECT USING (is_admin());

CREATE POLICY "leads_admin_insert" ON public.leads
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "leads_admin_update" ON public.leads
  FOR UPDATE USING (is_admin());

CREATE POLICY "leads_admin_delete" ON public.leads
  FOR DELETE USING (is_admin());

-- RLS Policies for supplier_quotes (admin only)
CREATE POLICY "supplier_quotes_admin_select" ON public.supplier_quotes
  FOR SELECT USING (is_admin());

CREATE POLICY "supplier_quotes_admin_insert" ON public.supplier_quotes
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "supplier_quotes_admin_update" ON public.supplier_quotes
  FOR UPDATE USING (is_admin());

CREATE POLICY "supplier_quotes_admin_delete" ON public.supplier_quotes
  FOR DELETE USING (is_admin());