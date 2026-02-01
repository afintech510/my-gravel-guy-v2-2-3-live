

# MyGravelGuy Dynamic Material × Market Landing Pages System
## SHIP-READY PLAN (Final Polish Items Incorporated)

---

## Summary of Final Polish Fixes Applied

Based on the final AI Agent review, these remaining nitpicks have been incorporated:

| # | Issue | Fix Applied |
|---|-------|-------------|
| 1 | NODE_ENV detection unreliable in Vite | **Use `CI=true` check instead** |
| 2 | Alias CHECK constraint redundant LIKE rules | **Simplified to regex only** |
| 3 | addToCartFiredForSession lost on refresh | **Use sessionStorage** |
| 4 | 404 page doesn't dispatch prerender-ready | **Added dispatch to NotFound** |
| 5 | slug_path can be manually set on first insert | **Always override to canonical on activation** |
| 6 | Sitemap static pages use today's date | **Omit lastmod for static pages** |

### Consistency Check Verified
- `delivery_locations` has `slug` column (e.g., "nashville-tn") 
- `products` has `slug` column (e.g., "57-crushed-stone")
- Plan consistently uses these column names throughout

---

## 1. Pre-Build Script (FIXED: CI-Safe Detection)

```javascript
// scripts/generate-prerender-routes.mjs
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// FIXED: Use CI env var instead of NODE_ENV
const isCI = process.env.CI === 'true';

// In CI, BOTH must be set - fail loudly
if (isCI && (!supabaseUrl || !supabaseServiceKey)) {
  console.error('=========================================');
  console.error('ERROR: CI build requires Supabase credentials');
  console.error('Missing: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Set these in your CI/CD environment variables');
  console.error('=========================================');
  process.exit(1);
}

// In local dev, allow fallback - generate empty routes
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Supabase credentials not set - generating empty routes file for local dev');
  writeFileSync(
    join(__dirname, '../src/prerender-routes.json'),
    JSON.stringify({ 
      routes: [], 
      generated_at: new Date().toISOString(), 
      environment: 'local' 
    }, null, 2)
  );
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateRoutes() {
  console.log('Fetching active market material pages...');
  
  const { data: pages, error } = await supabase
    .from('market_materials')
    .select('slug_path, updated_at')
    .eq('status', 'active')
    .not('slug_path', 'is', null);

  if (error) {
    console.error('Error fetching routes:', error);
    process.exit(1);
  }

  const staticRoutes = [
    '/',
    '/about',
    '/contact',
    '/products',
    '/shop',
    '/contractors',
    '/locations',
    '/faq',
    '/reviews',
    '/blog'
  ];

  const dynamicRoutes = pages?.map(p => `/${p.slug_path}`) || [];

  const output = {
    routes: [...staticRoutes, ...dynamicRoutes],
    generated_at: new Date().toISOString(),
    page_count: dynamicRoutes.length,
    environment: isCI ? 'ci' : 'staging'
  };

  console.log(`Generated ${output.routes.length} routes (${dynamicRoutes.length} market/material pages)`);
  
  writeFileSync(
    join(__dirname, '../src/prerender-routes.json'),
    JSON.stringify(output, null, 2)
  );
  
  console.log('Routes written to src/prerender-routes.json');
}

generateRoutes();
```

---

## 2. Market Aliases Table (FIXED: Simplified CHECK Constraint)

```sql
CREATE TABLE public.market_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_slug TEXT NOT NULL UNIQUE,
  market_id UUID NOT NULL REFERENCES delivery_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- SIMPLIFIED: Regex already prevents slashes, so LIKE rules are redundant
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
```

---

## 3. Add-to-Cart Tracking (FIXED: sessionStorage for Dedupe)

```typescript
// src/utils/analytics.ts

interface OrderModuleState {
  tons: number;
  zipCode: string | null;
  email: string | null;
  phone: string | null;
}

// FIXED: Use sessionStorage instead of in-memory Set
const getAddToCartFiredKeys = (): Set<string> => {
  try {
    const stored = sessionStorage.getItem('mgg_atc_fired_keys');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const markAddToCartFired = (key: string): void => {
  try {
    const keys = getAddToCartFiredKeys();
    keys.add(key);
    sessionStorage.setItem('mgg_atc_fired_keys', JSON.stringify([...keys]));
  } catch {
    console.warn('Failed to store add_to_cart key in sessionStorage');
  }
};

export const shouldFireAddToCart = (state: OrderModuleState, materialSlug: string): boolean => {
  const sessionKey = `${materialSlug}-${state.tons}`;
  
  // FIXED: Check sessionStorage to prevent reload duplicates
  if (getAddToCartFiredKeys().has(sessionKey)) {
    return false;
  }
  
  // PRECISE CONDITIONS (all must be true):
  const validQuantity = state.tons >= 20 && state.tons <= 500;
  const hasZip = !!state.zipCode && state.zipCode.length >= 5;
  const hasContact = !!state.email || !!state.phone;
  
  return validQuantity && hasZip && hasContact;
};

export const trackAddToCart = (
  canonicalSlug: string,
  materialSlug: string,
  materialName: string,
  tons: number,
  value?: number
) => {
  if (!window.gtag) return;
  
  const sessionKey = `${materialSlug}-${tons}`;
  
  // FIXED: Check sessionStorage to prevent duplicates
  if (getAddToCartFiredKeys().has(sessionKey)) {
    console.log('add_to_cart already fired for:', sessionKey);
    return;
  }
  
  // Mark as fired in sessionStorage
  markAddToCartFired(sessionKey);
  
  const eventParams: any = {
    currency: 'USD',
    items: [{
      item_id: materialSlug,
      item_name: materialName,
      item_category: 'aggregate',
      quantity: tons
    }],
    market_slug: canonicalSlug,
    material_slug: materialSlug
  };
  
  if (value && value > 0) {
    eventParams.value = value;
    eventParams.items[0].price = value / tons;
  }
  
  window.gtag('event', 'add_to_cart', eventParams);
  console.log('add_to_cart fired:', sessionKey);
};
```

---

## 4. NotFound Component (FIXED: Dispatch prerender-ready)

```typescript
// src/pages/NotFound.tsx - Updated to dispatch prerender event

import { useLocation, Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const hasDispatchedPrerenderEvent = useRef(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
    
    // FIXED: Dispatch prerender-ready even for 404 to prevent Puppeteer hang
    if (!hasDispatchedPrerenderEvent.current && typeof document !== 'undefined') {
      hasDispatchedPrerenderEvent.current = true;
      document.dispatchEvent(new Event('prerender-ready'));
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="text-center max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Page not found</p>
        <p className="text-gray-500 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link to="/">Return to Home</Link>
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link to="/shop" className="flex items-center justify-center">
              <Store className="mr-2 h-4 w-4" />
              Shop
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
```

---

## 5. Market Materials Trigger (FIXED: Always Override slug_path)

```sql
CREATE OR REPLACE FUNCTION enforce_market_material_slug_immutability()
RETURNS TRIGGER AS $$
DECLARE
  market_slug TEXT;
  material_slug TEXT;
  canonical_slug_path TEXT;
BEGIN
  -- Get current slugs from source tables
  SELECT slug INTO market_slug FROM delivery_locations WHERE id = NEW.market_id;
  SELECT slug INTO material_slug FROM products WHERE id = NEW.product_id;
  
  -- Build canonical slug_path
  canonical_slug_path := 'markets/' || market_slug || '/materials/' || material_slug;
  
  -- On INSERT
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'active' THEN
      -- Validate slugs exist
      IF market_slug IS NULL THEN
        RAISE EXCEPTION 'Cannot activate: delivery_locations.slug is NULL for market_id %', NEW.market_id;
      END IF;
      IF material_slug IS NULL THEN
        RAISE EXCEPTION 'Cannot activate: products.slug is NULL for product_id %', NEW.product_id;
      END IF;
      
      NEW.published_at = now();
      NEW.activated_at = now();
      -- FIXED: Always override to canonical format, even if manually set
      NEW.slug_path = canonical_slug_path;
    END IF;
    RETURN NEW;
  END IF;
  
  -- On UPDATE
  IF TG_OP = 'UPDATE' THEN
    -- If already published, prevent changing market, product, or slug_path
    IF OLD.published_at IS NOT NULL THEN
      IF OLD.market_id != NEW.market_id THEN
        RAISE EXCEPTION 'Cannot change market after publishing. Create alias instead.';
      END IF;
      IF OLD.product_id != NEW.product_id THEN
        RAISE EXCEPTION 'Cannot change product after publishing. Create new entry instead.';
      END IF;
      IF OLD.slug_path IS DISTINCT FROM NEW.slug_path THEN
        RAISE EXCEPTION 'Cannot modify slug_path after publishing. URL immutability required for Google Ads.';
      END IF;
    END IF;
    
    -- Track status changes
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
      IF OLD.published_at IS NULL THEN
        -- First activation - validate and set
        IF market_slug IS NULL THEN
          RAISE EXCEPTION 'Cannot activate: delivery_locations.slug is NULL for market_id %', NEW.market_id;
        END IF;
        IF material_slug IS NULL THEN
          RAISE EXCEPTION 'Cannot activate: products.slug is NULL for product_id %', NEW.product_id;
        END IF;
        
        NEW.published_at = now();
        -- FIXED: Always override to canonical format
        NEW.slug_path = canonical_slug_path;
      END IF;
      NEW.activated_at = now();
    ELSIF NEW.status = 'paused' AND OLD.status != 'paused' THEN
      NEW.paused_at = now();
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_market_material_immutability
  BEFORE INSERT OR UPDATE ON market_materials
  FOR EACH ROW
  EXECUTE FUNCTION enforce_market_material_slug_immutability();
```

---

## 6. Sitemap Generation (FIXED: Omit lastmod for Static Pages)

```javascript
// scripts/generate-sitemap.mjs
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isCI = process.env.CI === 'true';

if (isCI && (!supabaseUrl || !supabaseServiceKey)) {
  console.error('ERROR: Supabase credentials required for CI sitemap generation');
  process.exit(1);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Skipping sitemap generation in local dev');
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function generateSitemap() {
  // Fetch active market_materials pages
  const { data: marketPages, error } = await supabase
    .from('market_materials')
    .select('slug_path, updated_at')
    .eq('status', 'active')
    .not('slug_path', 'is', null);

  if (error) {
    console.error('Error fetching market pages:', error);
    process.exit(1);
  }

  // FIXED: Static pages without lastmod (avoids false "changed daily" signal)
  const staticPages = [
    { loc: '/', priority: '1.0', changefreq: 'weekly' },
    { loc: '/about', priority: '0.8', changefreq: 'monthly' },
    { loc: '/contact', priority: '0.8', changefreq: 'monthly' },
    { loc: '/shop', priority: '0.9', changefreq: 'weekly' },
    { loc: '/products', priority: '0.9', changefreq: 'weekly' },
    { loc: '/bulk-landscape-materials', priority: '0.8', changefreq: 'weekly' },
    { loc: '/product-calculator', priority: '0.8', changefreq: 'monthly' },
    { loc: '/locations', priority: '0.8', changefreq: 'monthly' },
    { loc: '/delivery-map', priority: '0.6', changefreq: 'weekly' },
    { loc: '/delivery', priority: '0.6', changefreq: 'monthly' },
    { loc: '/faq', priority: '0.6', changefreq: 'monthly' },
    { loc: '/reviews', priority: '0.6', changefreq: 'weekly' },
    { loc: '/blog', priority: '0.7', changefreq: 'weekly' },
    { loc: '/contractors', priority: '0.8', changefreq: 'monthly' },
    { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
    { loc: '/refund', priority: '0.3', changefreq: 'yearly' },
  ];

  // Dynamic market/material pages WITH lastmod from DB
  const marketMaterialPages = (marketPages || []).map(page => ({
    loc: `/${page.slug_path}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: page.updated_at?.split('T')[0] // Only dynamic pages get lastmod
  }));

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(p => `  <url>
    <loc>https://mygravelguy.com${p.loc}</loc>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
${marketMaterialPages.map(p => `  <url>
    <loc>https://mygravelguy.com${p.loc}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  writeFileSync(join(__dirname, '../public/sitemap.xml'), xml);
  console.log(`Sitemap generated with ${staticPages.length + marketMaterialPages.length} URLs (${marketMaterialPages.length} market/material pages)`);
}

generateSitemap();
```

---

## 7. Complete Database Migrations

### Migration 1: Create Market Aliases Table

```sql
-- 001_create_market_aliases_table.sql
CREATE TABLE public.market_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias_slug TEXT NOT NULL UNIQUE,
  market_id UUID NOT NULL REFERENCES delivery_locations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_alias_slug_format CHECK (
    alias_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND
    length(alias_slug) >= 3 AND
    length(alias_slug) <= 100
  )
);

CREATE INDEX idx_market_aliases_market_id ON market_aliases(market_id);

ALTER TABLE market_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "market_aliases_public_read" ON market_aliases
  FOR SELECT USING (true);

CREATE POLICY "market_aliases_admin_all" ON market_aliases
  FOR ALL USING (is_admin());
```

### Migration 2: Create Market Materials Join Table

```sql
-- 002_create_market_materials_table.sql
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
```

### Migration 3: Create All Slug Immutability Triggers

```sql
-- 003_create_slug_immutability_triggers.sql

-- Trigger 1: Market Materials (with slug_path override fix)
CREATE OR REPLACE FUNCTION enforce_market_material_slug_immutability()
RETURNS TRIGGER AS $$
DECLARE
  market_slug TEXT;
  material_slug TEXT;
  canonical_slug_path TEXT;
BEGIN
  SELECT slug INTO market_slug FROM delivery_locations WHERE id = NEW.market_id;
  SELECT slug INTO material_slug FROM products WHERE id = NEW.product_id;
  canonical_slug_path := 'markets/' || market_slug || '/materials/' || material_slug;
  
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'active' THEN
      IF market_slug IS NULL THEN
        RAISE EXCEPTION 'Cannot activate: delivery_locations.slug is NULL for market_id %', NEW.market_id;
      END IF;
      IF material_slug IS NULL THEN
        RAISE EXCEPTION 'Cannot activate: products.slug is NULL for product_id %', NEW.product_id;
      END IF;
      NEW.published_at = now();
      NEW.activated_at = now();
      NEW.slug_path = canonical_slug_path;
    END IF;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.published_at IS NOT NULL THEN
      IF OLD.market_id != NEW.market_id THEN
        RAISE EXCEPTION 'Cannot change market after publishing. Create alias instead.';
      END IF;
      IF OLD.product_id != NEW.product_id THEN
        RAISE EXCEPTION 'Cannot change product after publishing. Create new entry instead.';
      END IF;
      IF OLD.slug_path IS DISTINCT FROM NEW.slug_path THEN
        RAISE EXCEPTION 'Cannot modify slug_path after publishing. URL immutability required for Google Ads.';
      END IF;
    END IF;
    
    IF NEW.status = 'active' AND OLD.status != 'active' THEN
      IF OLD.published_at IS NULL THEN
        IF market_slug IS NULL THEN
          RAISE EXCEPTION 'Cannot activate: delivery_locations.slug is NULL for market_id %', NEW.market_id;
        END IF;
        IF material_slug IS NULL THEN
          RAISE EXCEPTION 'Cannot activate: products.slug is NULL for product_id %', NEW.product_id;
        END IF;
        NEW.published_at = now();
        NEW.slug_path = canonical_slug_path;
      END IF;
      NEW.activated_at = now();
    ELSIF NEW.status = 'paused' AND OLD.status != 'paused' THEN
      NEW.paused_at = now();
    END IF;
    
    RETURN NEW;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_market_material_immutability
  BEFORE INSERT OR UPDATE ON market_materials
  FOR EACH ROW
  EXECUTE FUNCTION enforce_market_material_slug_immutability();

-- Trigger 2: Prevent market slug changes when referenced
CREATE OR REPLACE FUNCTION prevent_market_slug_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    IF EXISTS (
      SELECT 1 FROM market_materials 
      WHERE market_id = OLD.id AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Cannot change delivery_locations.slug when referenced by active pages. Create an alias in market_aliases instead. Market: %', OLD.city || ', ' || OLD.state;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_market_slug_modification
  BEFORE UPDATE ON delivery_locations
  FOR EACH ROW
  EXECUTE FUNCTION prevent_market_slug_change();

-- Trigger 3: Prevent material slug changes when referenced
CREATE OR REPLACE FUNCTION prevent_material_slug_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    IF EXISTS (
      SELECT 1 FROM market_materials 
      WHERE product_id = OLD.id AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Cannot change products.slug when referenced by active pages. Material: %', OLD.name;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_material_slug_modification
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION prevent_material_slug_change();
```

### Migration 4: Add Order Attribution Fields

```sql
-- 004_add_order_attribution_fields.sql
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS expedite_fee_pct NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS saturday_fee_pct NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS expedite_fee_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS saturday_fee_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS base_price NUMERIC,
ADD COLUMN IF NOT EXISTS confirmation_deadline_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS market_slug TEXT,
ADD COLUMN IF NOT EXISTS material_slug TEXT,
ADD COLUMN IF NOT EXISTS utm_source TEXT,
ADD COLUMN IF NOT EXISTS utm_medium TEXT,
ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
ADD COLUMN IF NOT EXISTS utm_term TEXT,
ADD COLUMN IF NOT EXISTS utm_content TEXT,
ADD COLUMN IF NOT EXISTS gclid TEXT,
ADD COLUMN IF NOT EXISTS gbraid TEXT,
ADD COLUMN IF NOT EXISTS wbraid TEXT,
ADD COLUMN IF NOT EXISTS landing_page_url TEXT,
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS ga4_purchase_fired BOOLEAN DEFAULT false;
```

---

## 8. Updated package.json

```json
{
  "scripts": {
    "dev": "vite",
    "prebuild": "node scripts/generate-prerender-routes.mjs && node scripts/generate-sitemap.mjs",
    "build": "npm run prebuild && vite build",
    "build:dev": "vite build --mode development",
    "lint": "eslint .",
    "preview": "vite preview"
  }
}
```

---

## 9. Files to Create/Modify

### New Files
```
scripts/generate-prerender-routes.mjs     -- Route generation with CI check
scripts/generate-sitemap.mjs              -- Sitemap with proper lastmod handling
src/prerender-routes.json                 -- Generated (gitignored)
src/pages/MarketMaterialPage.tsx          -- Main landing page
src/components/market-landing/MarketHero.tsx
src/components/market-landing/OrderModule.tsx
src/components/market-landing/ManagedQuoteModule.tsx
src/components/market-landing/ContentSections.tsx
src/components/market-landing/StickyCTAMobile.tsx
src/components/market-landing/types.ts
src/services/marketMaterialService.ts
src/data/materialCopyBlocks.ts
src/utils/feeCalculation.ts
```

### Modified Files
```
src/App.tsx                               -- Add /markets/:marketSlug/materials/:materialSlug route
src/pages/NotFound.tsx                    -- Add prerender-ready dispatch
src/utils/analytics.ts                    -- Add market landing tracking with sessionStorage
vite.config.ts                            -- Add prerender plugin
package.json                              -- Add prebuild scripts
supabase/functions/verify-payment/index.ts -- Rename stripeCheckoutSessionId
```

### Database Migrations (4 files)
```
001_create_market_aliases_table.sql
002_create_market_materials_table.sql
003_create_slug_immutability_triggers.sql
004_add_order_attribution_fields.sql
```

---

## 10. Ship-It Verification Checklist

- [ ] Prebuild script uses `CI=true` check (not NODE_ENV)
- [ ] Prebuild script fails loudly in CI when credentials missing
- [ ] Alias CHECK constraint uses regex only (no redundant LIKE rules)
- [ ] addToCartFiredForSession uses sessionStorage (persists across refresh)
- [ ] NotFound component dispatches prerender-ready event
- [ ] Trigger always overrides slug_path to canonical format on activation
- [ ] Sitemap omits lastmod for static pages
- [ ] Code uses `delivery_locations.slug` (not market_slug)
- [ ] Code uses `products.slug` (not material_slug)
- [ ] All existing checkout flows continue unchanged

---

## 11. Implementation Phases

### Phase 1: Database Foundation (3-4 days)
- Create market_aliases table with regex CHECK constraint
- Create market_materials table with all constraints
- Create all slug immutability triggers
- Add order attribution fields

### Phase 2: Core Page + Components (4-5 days)
- Build MarketMaterialPage with 404 handling + prerender dispatch
- Update NotFound to dispatch prerender-ready
- Build OrderModule with sessionStorage add_to_cart tracking
- Build ManagedQuoteModule

### Phase 3: Content + Checkout (3-4 days)
- Implement ContentSections with material copy blocks
- Integrate with Stripe checkout
- Store fees as explicit line items + attribution

### Phase 4: Pre-render + Sitemap + Analytics (2-3 days)
- Create prebuild scripts with CI checks
- Configure vite-plugin-prerender with document event
- Generate sitemap with proper lastmod handling
- Test full attribution flow

### Phase 5: Data Population + Launch
- Create market_materials rows for pilot markets
- Test with 2-3 markets x 2-3 materials
- Verify sitemap includes all active pages
- Launch with monitoring

