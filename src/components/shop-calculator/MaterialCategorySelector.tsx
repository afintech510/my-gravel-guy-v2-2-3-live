
import React, { useState, useEffect } from 'react';
import { Truck, Map, Shovel, Trees, Building, ChevronDown } from 'lucide-react';
import { MaterialSize } from '@/services/productTypes';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import ProductGallery from './ProductGallery';
import SizeSelector from './SizeSelector';
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';

// Define the types used specifically in the shop calculator
export type ShopMaterialCategory = 'gravel' | 'base' | 'dirt' | 'sand' | 'mulch';

export type ShopMaterialSubcategory = 
  | 'washed-sand' | 'mason-sand' | 'playground-sand' | 'pool-sand' | 'beach-sand'
  | 'fill-dirt' | 'top-soil' | 'compost' | 'loam' | 'sandy-loam'
  | 'natural' | 'black' | 'chocolate-brown' | 'red' | 'request'
  | '57-crushed-stone' | 'crusher-run' | 'road-base' | 'rca-crushed-concrete' | 'drainage-rock'
  | 'driveway' | 'walkway' | 'landscape' | 'construction'
  | 'pea-gravel' | 'river-rock' | 'crushed-stone' | 'decorative-gravel' | 'drainage-gravel';

export type ApplicationType = 'residential' | 'commercial' | 'landscaping';

type MaterialCategorySelectorProps = {
  selectedCategory: ShopMaterialCategory;
  setSelectedCategory: (category: ShopMaterialCategory) => void;
  selectedSubcategory: ShopMaterialSubcategory;
  setSelectedSubcategory: (subcategory: ShopMaterialSubcategory) => void;
  selectedSize: MaterialSize;
  setSelectedSize: (size: MaterialSize) => void;
  productImages: string[];
};

const MaterialCategorySelector: React.FC<MaterialCategorySelectorProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  selectedSize,
  setSelectedSize,
  productImages
}) => {
  const isMobile = useIsMobile();
  const categories = [
    { id: 'gravel' as ShopMaterialCategory, name: 'Gravel', icon: <Truck className="h-7 w-7" /> },
    { id: 'base' as ShopMaterialCategory, name: 'Base', icon: <Building className="h-7 w-7" /> },
    { id: 'dirt' as ShopMaterialCategory, name: 'Dirt', icon: <Shovel className="h-7 w-7" /> },
    { id: 'sand' as ShopMaterialCategory, name: 'Sand', icon: <Map className="h-7 w-7" /> },
    { id: 'mulch' as ShopMaterialCategory, name: 'Mulch', icon: <Trees className="h-7 w-7" /> }
  ];

  // Define subcategories for each material category
  const subcategories: Record<ShopMaterialCategory, ShopMaterialSubcategory[]> = {
    sand: ['washed-sand', 'mason-sand', 'playground-sand', 'pool-sand', 'beach-sand'],
    dirt: ['fill-dirt', 'top-soil', 'compost', 'loam', 'sandy-loam'],
    mulch: ['natural', 'black', 'chocolate-brown', 'red', 'request'],
    base: ['57-crushed-stone', 'crusher-run', 'road-base', 'rca-crushed-concrete', 'drainage-rock'],
    gravel: ['driveway', 'walkway', 'landscape', 'natural', 'construction']
  };

  // Define third-level options for specific subcategories
  const [thirdLevelOptions, setThirdLevelOptions] = useState<string[]>([]);
  const [selectedThirdOption, setSelectedThirdOption] = useState<string>('');

  // Define third-level options mapping
  const thirdLevelMapping: Record<string, Record<string, string[]>> = {
    'gravel': {
      'landscape': ['river-rock', 'pea-gravel'],
      'construction': ['rca-crushed-concrete', 'road-base', 'crusher-run']
    }
  };

  // Categories that should show size selection
  const categoriesWithSizes: ShopMaterialCategory[] = ['gravel', 'base'];
  const showSizeSelector = categoriesWithSizes.includes(selectedCategory);

  // Update third-level options when category or subcategory changes
  useEffect(() => {
    const options = thirdLevelMapping[selectedCategory]?.[selectedSubcategory] || [];
    setThirdLevelOptions(options);
    if (options.length > 0) {
      setSelectedThirdOption(options[0]);
    } else {
      setSelectedThirdOption('');
    }
  }, [selectedCategory, selectedSubcategory]);

  // Get formatted display name for subcategory
  const getSubcategoryDisplayName = (subcategory: ShopMaterialSubcategory): string => {
    const nameMap: Record<ShopMaterialSubcategory, string> = {
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
      'driveway': 'Driveway',
      'walkway': 'Walkway',
      'landscape': 'Landscape',
      'construction': 'Construction',
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

  // Get formatted display name for third-level options
  const getThirdLevelDisplayName = (option: string): string => {
    const nameMap: Record<string, string> = {
      'river-rock': 'River Rock',
      'pea-gravel': 'Pea Gravel',
      'rca-crushed-concrete': 'RCA #1',
      'road-base': 'Road Base',
      'crusher-run': 'Crusher Run'
    };
    
    return nameMap[option] || option.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    const category = value as ShopMaterialCategory;
    setSelectedCategory(category);
    if (subcategories[category] && subcategories[category].length > 0) {
      setSelectedSubcategory(subcategories[category][0]);
    }
  };
  
  // Get description based on selected category and subcategory
  const getDescription = (category: ShopMaterialCategory, subcategory: ShopMaterialSubcategory): string => {
    if (category === 'gravel') {
      return `Our premium ${getSubcategoryDisplayName(subcategory)} is perfect for driveways, landscaping, and drainage applications.`;
    } else if (category === 'sand') {
      return `${getSubcategoryDisplayName(subcategory)} is ideal for construction, playgrounds, and landscaping projects.`;
    } else if (category === 'dirt') {
      return `${getSubcategoryDisplayName(subcategory)} is perfect for your gardening, landscaping, and construction needs.`;
    } else if (category === 'mulch') {
      return `${getSubcategoryDisplayName(subcategory)} mulch enhances your landscape while protecting plants and improving soil health.`;
    } else if (category === 'base') {
      return `${getSubcategoryDisplayName(subcategory)} provides a sturdy foundation for driveways, patios, and construction projects.`;
    }
    return '';
  };

  return (
    <div>
      <Tabs 
        defaultValue={selectedCategory} 
        value={selectedCategory}
        onValueChange={handleTabChange}
        className="w-full"
      >
        {/* Row 1: Material Category Tabs (with icons) - Now more mobile-friendly */}
        <TabsList className={cn(
          "grid mb-6 bg-gray-100 p-1 rounded-lg",
          isMobile ? "grid-cols-3 gap-y-2" : "grid-cols-5"
        )}>
          {categories.map(category => (
            <div key={category.id} className="flex justify-center">
              <TabsTrigger 
                value={category.id}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
                  isMobile ? "w-full" : ""
                )}
              >
                {category.icon}
                <span className="mt-1 text-base font-medium">
                  {category.name}
                </span>
              </TabsTrigger>
            </div>
          ))}
        </TabsList>
        
        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            <div className="space-y-8">
              {/* Row 2: Subcategory Selection - Mobile-friendly with wrapping */}
              <div className="mt-4 mb-8">
                <div className={cn(
                  "flex flex-wrap gap-2",
                  isMobile ? "justify-center" : "justify-between"
                )}>
                  {subcategories[category.id].map(subcategory => (
                    <button
                      key={subcategory}
                      onClick={() => setSelectedSubcategory(subcategory)}
                      className={cn(
                        "px-4 py-2 rounded-lg transition-colors font-montserrat font-bold text-base",
                        selectedSubcategory === subcategory && selectedCategory === category.id
                          ? 'bg-primary text-black'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
                        isMobile ? "flex-grow min-w-[45%] max-w-full text-sm" : "w-auto"
                      )}
                    >
                      {getSubcategoryDisplayName(subcategory)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Row 3: Third-level options - Also mobile-friendly */}
              {thirdLevelOptions.length > 0 && (
                <div className="mb-8">
                  <div className={cn(
                    "flex flex-wrap gap-2",
                    isMobile ? "justify-center" : "justify-between"
                  )}>
                    {thirdLevelOptions.map(option => (
                      <button
                        key={option}
                        onClick={() => setSelectedThirdOption(option)}
                        className={cn(
                          "px-4 py-2 rounded-lg transition-colors font-montserrat font-bold text-base",
                          selectedThirdOption === option
                            ? 'bg-primary text-black'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
                          isMobile ? "flex-grow min-w-[45%] text-sm" : "w-auto"
                        )}
                      >
                        {getThirdLevelDisplayName(option)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Size Selector - Also made mobile-friendly */}
              {categoriesWithSizes.includes(category.id) && (
                <div className="mb-8">
                  <SizeSelector
                    selectedSize={selectedSize}
                    setSelectedSize={setSelectedSize}
                  />
                </div>
              )}
              
              {/* Description and Product Gallery in flex layout - Stack on mobile */}
              <div className={cn(
                "flex gap-6 mt-6",
                isMobile ? "flex-col" : "flex-row"
              )}>
                {/* Description */}
                <div className="flex-1 p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    {getDescription(category.id, selectedCategory === category.id ? selectedSubcategory : subcategories[category.id][0])}
                  </p>
                </div>
                
                {/* Product Gallery */}
                <div className={cn(
                  isMobile ? "w-full" : "md:w-1/3 md:max-w-[300px]"
                )}>
                  <ProductGallery 
                    images={productImages.slice(0, 3)} 
                    productName={getSubcategoryDisplayName(selectedSubcategory)} 
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MaterialCategorySelector;
