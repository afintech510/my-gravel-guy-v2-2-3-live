
import React from 'react';
import { Truck, Map, Shovel, Trees, Building, ChevronDown } from 'lucide-react';
import { MaterialCategory, ApplicationType, MaterialSubcategory } from './ShopCalculator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

type MaterialCategorySelectorProps = {
  selectedCategory: MaterialCategory;
  setSelectedCategory: (category: MaterialCategory) => void;
  selectedSubcategory: MaterialSubcategory;
  setSelectedSubcategory: (subcategory: MaterialSubcategory) => void;
};

const MaterialCategorySelector: React.FC<MaterialCategorySelectorProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory
}) => {
  const categories = [
    { id: 'gravel' as MaterialCategory, name: 'Gravel', icon: <Truck className="h-5 w-5" /> },
    { id: 'sand' as MaterialCategory, name: 'Sand', icon: <Map className="h-5 w-5" /> },
    { id: 'dirt' as MaterialCategory, name: 'Dirt', icon: <Shovel className="h-5 w-5" /> },
    { id: 'mulch' as MaterialCategory, name: 'Mulch', icon: <Trees className="h-5 w-5" /> },
    { id: 'base' as MaterialCategory, name: 'Base', icon: <Building className="h-5 w-5" /> }
  ];

  // Define subcategories for each material category
  const subcategories: Record<MaterialCategory, MaterialSubcategory[]> = {
    sand: ['washed-sand', 'mason-sand', 'playground-sand', 'pool-sand', 'beach-sand'],
    dirt: ['fill-dirt', 'top-soil', 'compost', 'loam', 'sandy-loam'],
    mulch: ['natural', 'black', 'chocolate-brown', 'red', 'request'],
    base: ['57-crushed-stone', 'crusher-run', 'road-base', 'rca-crushed-concrete', 'drainage-rock'],
    gravel: ['pea-gravel', 'river-rock', 'crushed-stone', 'decorative-gravel', 'drainage-gravel']
  };

  // Get formatted display name for subcategory
  const getSubcategoryDisplayName = (subcategory: MaterialSubcategory): string => {
    const nameMap: Record<MaterialSubcategory, string> = {
      'washed-sand': 'Washed Sand',
      'mason-sand': 'Mason Sand',
      'playground-sand': 'Playground Sand',
      'pool-sand': 'Pool Sand',
      'beach-sand': 'Beach Sand',
      'fill-dirt': 'Fill Dirt',
      'top-soil': 'Topsoil',
      'compost': 'Compost',
      'loam': 'Loam',
      'sandy-loam': 'Sandy Loam',
      'natural': 'Natural',
      'black': 'Black',
      'chocolate-brown': 'Chocolate Brown',
      'red': 'Red',
      'request': 'Request',
      '57-crushed-stone': '#57 Crushed Stone',
      'crusher-run': 'Crusher Run',
      'road-base': 'Road Base',
      'rca-crushed-concrete': 'RCA / Crushed Concrete',
      'drainage-rock': 'Drainage Rock',
      'pea-gravel': 'Pea Gravel',
      'river-rock': 'River Rock',
      'crushed-stone': 'Crushed Stone',
      'decorative-gravel': 'Decorative Gravel',
      'drainage-gravel': 'Drainage Gravel'
    };
    
    return nameMap[subcategory] || subcategory.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // When category changes, select first subcategory by default
  React.useEffect(() => {
    if (subcategories[selectedCategory] && subcategories[selectedCategory].length > 0) {
      setSelectedSubcategory(subcategories[selectedCategory][0]);
    }
  }, [selectedCategory, setSelectedSubcategory]);

  return (
    <div>
      <h3 className="font-medium text-gray-700 mb-2">Material</h3>
      
      {/* Material Categories */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex flex-col items-center justify-center p-3 rounded-lg transition-colors ${
              selectedCategory === category.id 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {category.icon}
            <span className="mt-1 text-xs font-medium">{category.name}</span>
          </button>
        ))}
      </div>

      {/* Dynamic Subcategories Dropdown */}
      <div className="mb-4">
        <h3 className="font-medium text-gray-700 mb-2">Type</h3>
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center justify-between p-2 border rounded-lg bg-white">
            <span>{getSubcategoryDisplayName(selectedSubcategory)}</span>
            <ChevronDown className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 bg-white">
            {subcategories[selectedCategory].map((subcategory) => (
              <DropdownMenuItem 
                key={subcategory}
                onClick={() => setSelectedSubcategory(subcategory)}
                className={`cursor-pointer ${
                  selectedSubcategory === subcategory ? 'bg-green-100' : ''
                }`}
              >
                {getSubcategoryDisplayName(subcategory)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          {selectedCategory === 'gravel' && (
            <>Our premium {getSubcategoryDisplayName(selectedSubcategory)} is perfect for driveways, landscaping, and drainage applications.</>
          )}
          {selectedCategory === 'sand' && (
            <>{getSubcategoryDisplayName(selectedSubcategory)} is ideal for construction, playgrounds, and landscaping projects.</>
          )}
          {selectedCategory === 'dirt' && (
            <>{getSubcategoryDisplayName(selectedSubcategory)} is perfect for your gardening, landscaping, and construction needs.</>
          )}
          {selectedCategory === 'mulch' && (
            <>{getSubcategoryDisplayName(selectedSubcategory)} mulch enhances your landscape while protecting plants and improving soil health.</>
          )}
          {selectedCategory === 'base' && (
            <>{getSubcategoryDisplayName(selectedSubcategory)} provides a sturdy foundation for driveways, patios, and construction projects.</>
          )}
        </p>
      </div>
    </div>
  );
};

export default MaterialCategorySelector;
