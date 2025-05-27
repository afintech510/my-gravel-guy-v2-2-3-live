
export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
}

export const categories: Category[] = [
  {
    id: 'popular',
    name: 'Popular',
    icon: '⭐',
    description: 'Most ordered materials',
    keywords: ['river', 'decomposed granite', 'pea gravel', '57 stone', 'fill dirt']
  },
  {
    id: 'gravel',
    name: 'Gravel',
    icon: '🪨',
    description: 'Decorative and functional gravel',
    keywords: ['pea gravel', 'river rock', 'crushed gravel', 'decorative rock']
  },
  {
    id: 'crushed-stone',
    name: 'Crushed Stone',
    icon: '⚒️',
    description: 'Crushed limestone, granite & stone',
    keywords: ['57']
  },
  {
    id: 'sand',
    name: 'Sand',
    icon: '🏖️',
    description: 'Construction & decorative sand',
    keywords: ['mason sand', 'concrete sand', 'play sand', 'beach sand', 'washed sand', 'sand']
  },
  {
    id: 'soil-dirt',
    name: 'Soil & Dirt',
    icon: '🌱',
    description: 'Topsoil, fill dirt & compost',
    keywords: ['topsoil', 'fill dirt', 'compost', 'loam']
  },
  {
    id: 'mulch',
    name: 'Mulch',
    icon: '🌿',
    description: 'Organic mulch & wood chips',
    keywords: ['mulch', 'wood chips', 'bark', 'hardwood mulch']
  },
  {
    id: 'concrete',
    name: 'Concrete & RCA',
    icon: '🏗️',
    description: 'Recycled concrete aggregate',
    keywords: ['recycled', 'rca', 'concrete']
  },
  {
    id: 'driveway',
    name: 'Driveway',
    icon: '🚗',
    description: 'Materials for driveways',
    keywords: ['driveway']
  },
  {
    id: 'walkway',
    name: 'Walkway',
    icon: '🚶',
    description: 'Materials for walkways',
    keywords: ['walkway']
  },
  {
    id: 'patio',
    name: 'Patio',
    icon: '🏡',
    description: 'Materials for patios',
    keywords: ['rca', 'pea gravel', 'mason', '3/8']
  },
  {
    id: 'landscape',
    name: 'Landscape',
    icon: '🌳',
    description: 'Decorative landscape materials',
    keywords: ['decorative rock', 'river rock', 'pea gravel', 'decomposed granite', 'mulch']
  }
];
