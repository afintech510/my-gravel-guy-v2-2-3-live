
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'gravel' | 'sand' | 'dirt';
  slug: string;
  tonYardRatio: number; // Added this required field
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
