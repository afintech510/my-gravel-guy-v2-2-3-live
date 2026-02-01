// Market Material Service - handles resolution, fetching, and alias lookups

import { supabase } from '@/integrations/supabase/client';
import type { 
  MarketMaterialResolution, 
  MarketMaterialData, 
  DeliveryLocation, 
  Product 
} from '@/components/market-landing/types';

/**
 * Resolve a market slug (or alias) to the canonical market
 */
export const resolveMarketSlug = async (slugOrAlias: string): Promise<{
  market: DeliveryLocation;
  canonicalSlug: string;
  isAlias: boolean;
} | null> => {
  // First try exact match on delivery_locations.slug
  const { data: market, error: marketError } = await supabase
    .from('delivery_locations')
    .select('id, city, state, slug, lat, lng, region, title, description')
    .eq('slug', slugOrAlias)
    .single();

  if (market && !marketError) {
    return { 
      market: market as DeliveryLocation, 
      canonicalSlug: slugOrAlias, 
      isAlias: false 
    };
  }

  // Try alias lookup
  const { data: alias, error: aliasError } = await supabase
    .from('market_aliases')
    .select('market_id')
    .eq('alias_slug', slugOrAlias)
    .single();

  if (alias && !aliasError) {
    const { data: canonicalMarket, error: canonicalError } = await supabase
      .from('delivery_locations')
      .select('id, city, state, slug, lat, lng, region, title, description')
      .eq('id', alias.market_id)
      .single();

    if (canonicalMarket && !canonicalError) {
      return {
        market: canonicalMarket as DeliveryLocation,
        canonicalSlug: canonicalMarket.slug || '',
        isAlias: true
      };
    }
  }

  return null;
};

/**
 * Resolve a full market/material page URL
 * Returns null if the combination doesn't exist or isn't active
 */
export const resolveMarketMaterialPage = async (
  marketSlugOrAlias: string,
  materialSlug: string
): Promise<MarketMaterialResolution | null> => {
  // Step 1: Resolve market (direct or alias)
  const marketResolution = await resolveMarketSlug(marketSlugOrAlias);
  
  if (!marketResolution) {
    console.log(`Market not found: ${marketSlugOrAlias}`);
    return null;
  }

  const { market, canonicalSlug, isAlias } = marketResolution;

  // Step 2: Validate material slug exists in products table
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, description, short_description, price, slug, category, size, color, images, ton_yard_ratio, pricing_a, pricing_b, pricing_c')
    .eq('slug', materialSlug)
    .single();

  if (!product || productError) {
    console.log(`Material not found: ${materialSlug}`);
    return null;
  }

  // Step 3: Fetch market_materials join record (must be active)
  const { data: pageData, error: pageError } = await supabase
    .from('market_materials')
    .select('*')
    .eq('market_id', market.id)
    .eq('product_id', product.id)
    .eq('status', 'active')
    .single();

  if (!pageData || pageError) {
    console.log(`No active market_material page for: ${canonicalSlug}/${materialSlug}`);
    return null;
  }

  // Parse faq_json safely - handle Json type from Supabase
  let parsedFaqJson: Array<{ question: string; answer: string }> = [];
  if (Array.isArray(pageData.faq_json)) {
    parsedFaqJson = pageData.faq_json
      .filter((item): item is { question: string; answer: string } => 
        typeof item === 'object' && 
        item !== null && 
        'question' in item && 
        'answer' in item
      );
  }

  return {
    market,
    product: product as Product,
    pageData: {
      ...pageData,
      faq_json: parsedFaqJson
    } as unknown as MarketMaterialData,
    canonicalMarketSlug: canonicalSlug,
    canonicalMaterialSlug: materialSlug,
    isMarketAlias: isAlias
  };
};

/**
 * Get all active market material pages (for sitemap/prerender)
 */
export const getActiveMarketMaterialPages = async (): Promise<{
  slug_path: string;
  updated_at: string;
}[]> => {
  const { data, error } = await supabase
    .from('market_materials')
    .select('slug_path, updated_at')
    .eq('status', 'active')
    .not('slug_path', 'is', null);

  if (error) {
    console.error('Error fetching active market material pages:', error);
    return [];
  }

  return data || [];
};

/**
 * Get material display name (from page data or product)
 */
export const getMaterialDisplayName = (
  pageData: MarketMaterialData, 
  product: Product
): string => {
  return pageData.material_display_name || product.name;
};

/**
 * Get product image URL
 */
export const getProductImage = (
  pageData: MarketMaterialData, 
  product: Product
): string => {
  if (pageData.hero_image_url) return pageData.hero_image_url;
  if (product.images && product.images.length > 0) return product.images[0];
  return '/placeholder.svg';
};
