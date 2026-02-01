// Market Landing Page Types

export interface MarketMaterialData {
  id: string;
  market_id: string;
  product_id: string;
  status: 'active' | 'paused' | 'draft';
  slug_path: string | null;
  published_at: string | null;
  activated_at: string | null;
  paused_at: string | null;
  market_display_name: string;
  material_display_name: string | null;
  hero_image_url: string | null;
  gallery_image_urls: string[] | null;
  hero_headline: string | null;
  hero_subheadline: string | null;
  local_intro_copy: string | null;
  local_logistics_copy: string | null;
  spec_notes: string | null;
  material_caveats: string | null;
  best_uses: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  faq_json: FAQItem[];
  min_tons: number;
  max_tons: number;
  expedite_enabled: boolean;
  sat_enabled: boolean;
  expedite_fee_pct: number;
  sat_fee_pct: number;
  confirmation_window_hours: number;
  standard_lead_time_hours: number;
  created_at: string;
  updated_at: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface DeliveryLocation {
  id: string;
  city: string;
  state: string;
  slug: string | null;
  lat: number;
  lng: number;
  region?: string | null;
  title?: string | null;
  description?: string | null;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  short_description: string | null;
  price: number;
  slug: string | null;
  category: string | null;
  size: string | null;
  color: string | null;
  images: string[] | null;
  ton_yard_ratio: string | null;
  pricing_a: number | null;
  pricing_b: number | null;
  pricing_c: number | null;
}

export interface MarketMaterialResolution {
  market: DeliveryLocation;
  product: Product;
  pageData: MarketMaterialData;
  canonicalMarketSlug: string;
  canonicalMaterialSlug: string;
  isMarketAlias: boolean;
}

export interface OrderModuleState {
  tons: number;
  zipCode: string | null;
  email: string | null;
  phone: string | null;
  expediteEnabled: boolean;
  saturdayEnabled: boolean;
  deliveryDate: Date | null;
  deliveryStreet: string | null;
  deliveryCity: string | null;
  deliveryState: string | null;
  name: string | null;
  instructions: string | null;
}

export interface UTMData {
  gclid?: string;
  gbraid?: string;
  wbraid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  landing_page_url?: string;
  referrer?: string;
  user_agent?: string;
  captured_at: string;
}
