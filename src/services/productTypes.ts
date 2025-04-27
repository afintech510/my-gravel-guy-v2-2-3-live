
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'gravel' | 'sand' | 'dirt' | 'mulch' | 'base';
  slug: string;
  tonYardRatio: number;
  usage?: 'driveway' | 'walkway' | 'general';
  subtype?: 'crushed' | 'round' | 'natural' | 'concrete' | 'mason' | 'fill' | 'concrete-mix' | 'top-soil' | 'fill-dirt';
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
}

export type MaterialCategory = Product['category'];
export type MaterialUsage = NonNullable<Product['usage']>;
export type MaterialSubtype = NonNullable<Product['subtype']>;
export type MaterialSize = NonNullable<Product['size']>;
export type MaterialColor = NonNullable<Product['color']>;
