
import React, { useState, useEffect } from 'react';
import { Truck, Map, Shovel, Trees, Building, ChevronDown } from 'lucide-react';
import { MaterialCategory, ApplicationType, MaterialSubcategory, MaterialSize } from './ShopCalculator';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import ProductGallery from './ProductGallery';
import SizeSelector from './SizeSelector';
import { cn } from "@/lib/utils";

type MaterialCategorySelectorProps = {
  selectedCategory: MaterialCategory;
  setSelectedCategory: (category: MaterialCategory) => void;
  selectedSubcategory: MaterialSubcategory;
  setSelectedSubcategory: (subcategory: MaterialSubcategory) => void;
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
  const categories = [
    { id: 'gravel' as MaterialCategory, name: 'Gravel', icon: <Truck className="h-7 w-7" /> },
    { id: 'base' as MaterialCategory, name: 'Base', icon: <Building className="h-7 w-7" /> },
    { id: 'dirt' as MaterialCategory, name: 'Dirt', icon: <Shovel className="h-7 w-7" /> },
    { id: 'sand' as MaterialCategory, name: 'Sand', icon: <Map className="h-7 w-7" /> },
    { id: 'mulch' as MaterialCategory, name: 'Mulch', icon: <Trees className="h-7 w-7" /> }
  ];

  // Define subcategories for each material category
  const subcategories: Record<MaterialCategory, MaterialSubcategory[]> = {
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
  const categoriesWithSizes: MaterialCategory[] = ['gravel', 'base'];
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
    const category = value as MaterialCategory;
    setSelectedCategory(category);
    if (subcategories[category] && subcategories[category].length > 0) {
      setSelectedSubcategory(subcategories[category][0]);
    }
  };
  
  // Get description based on selected category and subcategory
  const getDescription = (category: MaterialCategory, subcategory: MaterialSubcategory): string => {
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
        {/* Row 1: Material Category Tabs (with icons) */}
        <TabsList className="grid grid-cols-5 mb-6 bg-gray-100 p-1 rounded-lg">
          {categories.map(category => (
            <TabsTrigger 
              key={category.id} 
              value={category.id}
              className="flex flex-col items-center justify-center p-3 rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {category.icon}
              <span className="mt-1 text-base font-medium">
                {category.name}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="space-y-6">
            <div className="space-y-8">
              {/* Row 2: Subcategory Selection styled like Row 3 */}
              <div className="mt-4 mb-8">
                <div className="flex justify-between gap-2">
                  {subcategories[category.id].map(subcategory => (
                    <button
                      key={subcategory}
                      onClick={() => setSelectedSubcategory(subcategory)}
                      className={cn(
                        "px-4 py-2 rounded-lg transition-colors w-full font-montserrat font-bold text-base",
                        selectedSubcategory === subcategory && selectedCategory === category.id
                          ? 'bg-primary text-black'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      )}
                    >
                      {getSubcategoryDisplayName(subcategory)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Row 3: Third-level options */}
              {thirdLevelOptions.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between gap-2">
                    {thirdLevelOptions.map(option => (
                      <button
                        key={option}
                        onClick={() => setSelectedThirdOption(option)}
                        className={cn(
                          "px-4 py-2 rounded-lg transition-colors w-full font-montserrat font-bold text-base",
                          selectedThirdOption === option
                            ? 'bg-primary text-black'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        )}
                      >
                        {getThirdLevelDisplayName(option)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Size Selector */}
              {categoriesWithSizes.includes(category.id) && (
                <div className="mb-8">
                  <SizeSelector
                    selectedSize={selectedSize}
                    setSelectedSize={setSelectedSize}
                  />
                </div>
              )}
              
              {/* Description and Product Gallery in flex layout */}
              <div className="flex flex-col md:flex-row gap-6 mt-6">
                {/* Description */}
                <div className="flex-1 p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    {getDescription(category.id, selectedCategory === category.id ? selectedSubcategory : subcategories[category.id][0])}
                  </p>
                </div>
                
                {/* Product Gallery */}
                <div className="md:w-1/3 md:max-w-[300px]">
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
