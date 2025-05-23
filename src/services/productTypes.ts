
export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image: string;
  images?: string[]; // New field for multiple images
  category: 'Gravel' | 'Sand' | 'Dirt' | 'Mulch' | 'Soil' | 'Rock-Stone' | 'Crushed-Gravel-Stone' | 'Crushed-Concrete';
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

// Database Material Categories (capitalized as in the database)
export type MaterialCategory = Product['category'];
export type MaterialUsage = NonNullable<Product['usage']>;
export type MaterialSubtype = NonNullable<Product['subtype']>;
export type MaterialSize = string;
export type MaterialColor = NonNullable<Product['color']>;

// UI Material Categories (lowercase as used in UI)
export type UIMaterialCategory = 'gravel' | 'sand' | 'dirt' | 'mulch' | 'base' | 'soil' | 'stone' | 'rock' | 'crushed-gravel' | 'crushed-concrete';

// Mapping function to convert UI category to database category
export const mapUICategoryToDBCategory = (uiCategory: UIMaterialCategory | string): MaterialCategory[] => {
  switch(uiCategory) {
    case 'gravel':
      return ['Gravel'];
    case 'sand':
      return ['Sand'];
    case 'dirt':
      return ['Dirt'];
    case 'soil':
      return ['Soil'];
    case 'mulch':
      return ['Mulch'];
    case 'base':
      return ['Rock-Stone', 'Crushed-Concrete'];
    case 'stone':
    case 'rock':
    case 'rock & stone':
      return ['Rock-Stone'];
    case 'crushed-gravel':
    case 'crushed gravel':
      return ['Crushed-Gravel-Stone'];
    case 'crushed-concrete':
    case 'crushed concrete':
      return ['Crushed-Concrete'];
    default:
      return ['Gravel']; // Default case
  }
};
