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

export interface PriceTier {
  id: string;
  product_id: string[];
  min_tons: number;
  max_tons?: number | null;
  multiplier: number;
  created_at?: string;
}

// Updated type definition for MaterialSize to be a string instead of specific literal types
export type MaterialCategory = Product['category'];
export type MaterialUsage = NonNullable<Product['usage']>;
export type MaterialSubtype = NonNullable<Product['subtype']>;
export type MaterialSize = string;
export type MaterialColor = NonNullable<Product['color']>;
