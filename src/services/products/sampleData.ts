
import { Product } from './types';

// Default product image
export const DEFAULT_PRODUCT_IMAGE = '/lovable-uploads/85eef0fe-9a59-406e-ba6b-54e1aaf6f56b.png';

// Sample products to use when database is empty or when there's an error
export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 'sample-1',
    name: 'River Rock Gravel',
    description: 'Smooth rounded stones perfect for landscaping and garden paths.',
    price: 45.99,
    image: '/assets/river-rocks.png',
    images: ['/assets/river-rocks.png', DEFAULT_PRODUCT_IMAGE, DEFAULT_PRODUCT_IMAGE],
    category: 'Gravel',
    categories: ['gravel', 'landscaping', 'garden'],
    slug: 'river-rock-gravel',
    tonYardRatio: 1.5,
    specifications: {
      density: '90-110 lb/ft³',
      size: '3/4" - 1 1/2"',
      color: 'Natural mix',
      coverage: 'Approximately 90 sq ft at 2" depth per ton'
    },
    uses: ['Driveways', 'Walkways', 'Landscape beds', 'Drainage']
  },
  {
    id: 'sample-2',
    name: 'Washed Sand',
    description: 'Fine grain washed sand suitable for concrete mixing and play areas.',
    price: 38.50,
    image: DEFAULT_PRODUCT_IMAGE,
    images: [DEFAULT_PRODUCT_IMAGE, DEFAULT_PRODUCT_IMAGE, DEFAULT_PRODUCT_IMAGE],
    category: 'Sand',
    categories: ['sand', 'construction', 'playground'],
    slug: 'washed-sand',
    tonYardRatio: 1.4,
    specifications: {
      density: '100-120 lb/ft³',
      size: 'Fine grain',
      color: 'Tan',
      coverage: 'Approximately 80 sq ft at 2" depth per ton'
    },
    uses: ['Concrete mixing', 'Sandbox filling', 'Paver base', 'Golf bunkers']
  },
  {
    id: 'sample-3',
    name: 'Premium Topsoil',
    description: 'Rich organic topsoil perfect for gardening and lawn preparation.',
    price: 32.99,
    image: DEFAULT_PRODUCT_IMAGE,
    category: 'Dirt',
    categories: ['dirt', 'soil', 'gardening'],
    slug: 'premium-topsoil',
    tonYardRatio: 1.3,
    specifications: {
      density: '75-100 lb/ft³',
      size: 'Fine to medium texture',
      color: 'Dark brown',
      coverage: 'Approximately 100 sq ft at 2" depth per ton'
    },
    uses: ['Garden beds', 'Lawn preparation', 'Potting mix', 'Raised beds']
  },
  {
    id: 'sample-4',
    name: 'Decorative Mulch',
    description: 'Premium wood mulch for garden beds and landscaping projects.',
    price: 28.75,
    image: DEFAULT_PRODUCT_IMAGE,
    category: 'Mulch',
    categories: ['mulch', 'landscaping', 'garden'],
    slug: 'decorative-mulch',
    tonYardRatio: 1.0,
    specifications: {
      density: '400-500 lb/yd³',
      size: 'Medium shred',
      color: 'Chocolate brown',
      coverage: 'Approximately 100 sq ft at 3" depth per yard'
    },
    uses: ['Flower beds', 'Tree rings', 'Playground areas', 'Erosion control']
  },
  {
    id: 'sample-5',
    name: 'Crushed Limestone',
    description: 'Durable crushed limestone for driveways and base material.',
    price: 42.50,
    image: '/assets/crushed-stone.png',
    category: 'Gravel',
    categories: ['gravel', 'limestone', 'driveway'],
    slug: 'crushed-limestone',
    tonYardRatio: 1.6,
    specifications: {
      density: '100-120 lb/ft³',
      size: '3/4"',
      color: 'Light gray',
      coverage: 'Approximately 80 sq ft at 2" depth per ton'
    },
    uses: ['Driveways', 'Road base', 'Drainage', 'Walking paths']
  }
];
