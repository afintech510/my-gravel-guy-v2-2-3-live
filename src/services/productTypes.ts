
export interface Product {
  id: string | number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'gravel' | 'sand' | 'dirt' | 'mulch' | 'base';
  categories?: string[]; // Added for multiple categories per product
  category1?: string; // Primary category (dirt, gravel, base, mulch)
  category2?: string; // Secondary category
  slug: string;
  tonYardRatio: number;
  usage?: 'driveway' | 'walkway' | 'general';
  subtype?: 'crushed' | 'round' | 'natural' | 'concrete' | 'mason-sand' | 'playground-sand' | 'beach-sand' | 'washed-sand' | 
            'top-soil' | 'compost' | 'fill-dirt' | 'loam' | 'sandy-loam' |
            'road-base' | 'concrete-rca' | 'crusher-base';
  size?: string; // Changed from union type to string for flexibility
  color?: string; // Changed from union type to string for flexibility
  application?: string; // New field for application type
  efficiency?: string; // New field for efficiency rating
  shape?: string; // New field for material shape
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

export type MaterialCategory = Product['category'];
export type MaterialUsage = NonNullable<Product['usage']>;
export type MaterialSubtype = NonNullable<Product['subtype']>;
export type MaterialSize = NonNullable<Product['size']>;
export type MaterialColor = NonNullable<Product['color']>;
export type MaterialApplication = NonNullable<Product['application']>;
export type MaterialShape = NonNullable<Product['shape']>;
