
export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[]; // New field for multiple images
  category: 'gravel' | 'sand' | 'dirt' | 'mulch' | 'base';
  categories?: string[]; // Added for multiple categories per product
  slug: string;
  tonYardRatio: number;
  usage?: 'driveway' | 'walkway' | 'general';
  subtype?: 'crushed' | 'round' | 'natural' | 'concrete' | 'mason-sand' | 'playground-sand' | 'beach-sand' | 'washed-sand' | 
            'top-soil' | 'compost' | 'fill-dirt' | 'loam' | 'sandy-loam' |
            'road-base' | 'concrete-rca' | 'crusher-base';
  size?: '3/8"' | '3/4"' | '1-1/2"';
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
  priceTiers?: PriceTier[]; // New field for price tiers
}

export interface PriceTier {
  id: string;
  product_id: string[] | string | number; // Updated to allow array of product IDs
  min_tons: number;
  max_tons: number | null;
  multiplier: number;
  created_at?: string;
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

// Add missing interfaces needed by other files
export interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  product_id?: string;
}

export interface ProductWithLocations extends Product {
  locations: Location[];
}

export interface ZipCodeValidationResult {
  inServiceArea: boolean;
  priceAdjustment?: number;
}

export type MaterialCategory = Product['category'];
export type MaterialUsage = NonNullable<Product['usage']>;
export type MaterialSubtype = NonNullable<Product['subtype']>;
export type MaterialSize = NonNullable<Product['size']>;
export type MaterialColor = NonNullable<Product['color']>;
