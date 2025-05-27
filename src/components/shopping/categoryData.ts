
import { 
  Star, 
  Mountain, 
  Hammer, 
  Waves, 
  Sprout, 
  Trees, 
  Building2, 
  Car, 
  User, 
  Home, 
  TreePine 
} from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  keywords: string[];
}

export const categories: Category[] = [
  {
    id: 'popular',
    name: 'Popular',
    icon: Star,
    description: 'Most ordered materials',
    keywords: ['river', 'decomposed granite', 'pea gravel', '57 stone', 'fill dirt']
  },
  {
    id: 'gravel',
    name: 'Gravel',
    icon: Mountain,
    description: 'Decorative and functional gravel',
    keywords: ['pea gravel', 'river rock', 'crushed gravel', 'decorative rock']
  },
  {
    id: 'crushed-stone',
    name: 'Crushed Stone',
    icon: Hammer,
    description: 'Crushed limestone, granite & stone',
    keywords: ['57']
  },
  {
    id: 'sand',
    name: 'Sand',
    icon: Waves,
    description: 'Construction & decorative sand',
    keywords: ['mason sand', 'concrete sand', 'play sand', 'beach sand', 'washed sand', 'sand']
  },
  {
    id: 'soil-dirt',
    name: 'Soil & Dirt',
    icon: Sprout,
    description: 'Topsoil, fill dirt & compost',
    keywords: ['topsoil', 'fill dirt', 'compost', 'loam']
  },
  {
    id: 'mulch',
    name: 'Mulch',
    icon: Trees,
    description: 'Organic mulch & wood chips',
    keywords: ['mulch', 'wood chips', 'bark', 'hardwood mulch']
  },
  {
    id: 'concrete',
    name: 'Concrete & RCA',
    icon: Building2,
    description: 'Recycled concrete aggregate',
    keywords: ['recycled', 'rca', 'concrete']
  },
  {
    id: 'driveway',
    name: 'Driveway',
    icon: Car,
    description: 'Materials for driveways',
    keywords: ['driveway']
  },
  {
    id: 'walkway',
    name: 'Walkway',
    icon: User,
    description: 'Materials for walkways',
    keywords: ['walkway']
  },
  {
    id: 'patio',
    name: 'Patio',
    icon: Home,
    description: 'Materials for patios',
    keywords: ['rca', 'pea gravel', 'mason', '3/8']
  },
  {
    id: 'landscape',
    name: 'Landscape',
    icon: TreePine,
    description: 'Decorative landscape materials',
    keywords: ['decorative rock', 'river rock', 'pea gravel', 'decomposed granite', 'mulch']
  }
];
