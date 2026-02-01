-- Migration 3: Create All Slug Immutability Triggers (with secure search_path)

-- Trigger 1: Market Materials (with slug_path override fix)
CREATE OR REPLACE FUNCTION public.enforce_market_material_slug_immutability()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  market_slug TEXT;
  material_slug TEXT;
  canonical_slug_path TEXT;
BEGIN
  SELECT slug INTO market_slug FROM public.delivery_locations WHERE id = NEW.market_id;
  SELECT slug INTO material_slug FROM public.products WHERE id = NEW.product_id;
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
$$;

CREATE TRIGGER enforce_market_material_immutability
  BEFORE INSERT OR UPDATE ON public.market_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_market_material_slug_immutability();

-- Trigger 2: Prevent market slug changes when referenced
CREATE OR REPLACE FUNCTION public.prevent_market_slug_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    IF EXISTS (
      SELECT 1 FROM public.market_materials 
      WHERE market_id = OLD.id AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Cannot change delivery_locations.slug when referenced by active pages. Create an alias in market_aliases instead. Market: %', OLD.city || ', ' || OLD.state;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_market_slug_modification
  BEFORE UPDATE ON public.delivery_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_market_slug_change();

-- Trigger 3: Prevent material slug changes when referenced
CREATE OR REPLACE FUNCTION public.prevent_material_slug_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    IF EXISTS (
      SELECT 1 FROM public.market_materials 
      WHERE product_id = OLD.id AND status = 'active'
    ) THEN
      RAISE EXCEPTION 'Cannot change products.slug when referenced by active pages. Material: %', OLD.name;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_material_slug_modification
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_material_slug_change();