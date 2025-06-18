
export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[]; // New field for multiple images
  category: 'gravel' | 'sand' | 'dirt' | 'mulch' | 'base' | 'soil' | 'stone' | 'rock' | 'crushed-gravel' | 'crushed-concrete' | 'rock & stone';
  categories?: string[]; // Added for multiple categories per product
  slug: string;
  tonYardRatio: number;
  usage?: 'driveway' | 'walkway' | 'general';
  subtype?: 'crushed' | 'round' | 'natural' | 'concrete' | 'mason-sand' | 'playground-sand' | 'beach-sand' | 'washed-sand' | 
            'top-soil' | 'compost' | 'fill-dirt' | 'loam' | 'sandy-loam' |
            'road-base' | 'concrete-rca' | 'crusher-base';
  size?: string;
  color?: 'chocolate' | 'jet-black' | 'red' | 'natural-dark' | 'wood-chips';
  specifications?: {
    density?: string;
    size?: string;
    color?: string;
    coverage?: string;
  };
  uses?: string[];
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
  // Exponential pricing parameters for formula: a * e^(b * quantity) + c
  pricing_a?: number; // Multiplier coefficient (default: 400)
  pricing_b?: number; // Exponential decay rate (default: -0.32)
  pricing_c?: number; // Base offset (default: 95)
}

export interface ZipCodeData {
  zip: string;
  lat: number;
  lng: number;
  city: string;
  state_id: string;
  state_name: string;
  population: number;
  density: number;
  county_fips: string;
  county_name: string;
  county_names_all: string;
  county_fips_all: string;
  timezone: string;
}

// Enhanced interface for cart items with all required fields for orders - updated to match schema
export interface CartItemForOrders {
  id: string | number;
  name: string;
  category?: string;
  price: number;
  quantity: number;
  tons?: number;
  yards?: number;
  size?: string;
  image?: string;
  metadata?: {
    deliveryDate?: string;
    deliveryAddress?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    deliveryTimePreference?: string;
    deliveryInstructions?: string;
  };
}

// Updated OrderInsertData to match the actual database schema from Supabase types
export interface OrderInsertData {
  id?: string;
  order_id: string;
  stripe_session_id?: string | null;
  stripe_payment_intent_id?: string | null;
  product_id: string;
  unit: string;
  unit_price: number;
  total_price: number;
  delivery_date?: string | null;
  delivery_address?: string | null; // Updated to match schema
  delivery_city?: string | null;
  delivery_state?: string | null;
  delivery_zip?: string | null;
  delivery_time_preference?: string | null;
  delivery_instructions?: string | null;
  customer_name?: string | null; // Updated to match schema
  customer_email?: string | null; // Updated to match schema
  customer_phone?: string | null; // Updated to match schema
  billing_name?: string | null;
  billing_email?: string | null;
  status?: string | null;
  quantity?: number | null;
  notes?: string | null;
  supplier_id?: string | null;
  supplier_charges?: number | null;
  zip_adjust?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Updated type definition for MaterialSize to be a string instead of specific literal types
export type MaterialCategory = Product['category'];
export type MaterialUsage = NonNullable<Product['usage']>;
export type MaterialSubtype = NonNullable<Product['subtype']>;
export type MaterialSize = string;
export type MaterialColor = NonNullable<Product['color']>;
