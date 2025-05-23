
import React, { useState } from 'react';
import { 
  Truck, Map, Shovel, Trees, Building, ChevronDown, ChevronUp 
} from 'lucide-react';
import { MaterialCategory, MaterialSubcategory, MaterialSize } from './ShopCalculator';
import { cn } from "@/lib/utils";
import { Card } from '@/components/ui/card';
import ProductGallery from './ProductGallery';
import { Product } from '@/services/productTypes';

type ShopMaterialSelectorProps = {
  selectedCategory: MaterialCategory;
  setSelectedCategory: (category: MaterialCategory) => void;
  selectedSubcategory: MaterialSubcategory;
  setSelectedSubcategory: (subcategory: MaterialSubcategory) => void;
  selectedSize: MaterialSize;
  setSelectedSize: (size: MaterialSize) => void;
  productImages: string[];
  onProductSelected?: (product: Product | null) => void; // New callback for product selection
};

const ShopMaterialSelector: React.FC<ShopMaterialSelectorProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  selectedSize,
  setSelectedSize,
  productImages,
  onProductSelected
}) => {
  const [showSubcategories, setShowSubcategories] = React.useState(true);
  
  // Category definitions with icons
  const categories: Array<{id: MaterialCategory, name: string, icon: JSX.Element}> = [
    { id: 'gravel', name: 'Gravel', icon: <Truck className="h-5 w-5" /> },
    { id: 'base', name: 'Base', icon: <Building className="h-5 w-5" /> },
    { id: 'dirt', name: 'Dirt', icon: <Shovel className="h-5 w-5" /> },
    { id: 'sand', name: 'Sand', icon: <Map className="h-5 w-5" /> },
    { id: 'mulch', name: 'Mulch', icon: <Trees className="h-5 w-5" /> }
  ];

  // Define subcategories for each material category
  const subcategories: Record<MaterialCategory, MaterialSubcategory[]> = {
    sand: ['washed-sand', 'mason-sand', 'playground-sand', 'pool-sand', 'beach-sand'],
    dirt: ['fill-dirt', 'top-soil', 'compost', 'loam', 'sandy-loam'],
    mulch: ['natural', 'black', 'chocolate-brown', 'red', 'request'],
    base: ['57-crushed-stone', 'crusher-run', 'road-base', 'rca-crushed-concrete', 'drainage-rock'],
    gravel: ['driveway', 'walkway', 'landscape', 'natural', 'construction']
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
    <div className="space-y-6">
      {/* Material Categories Section */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-sm">Select Material Type</h3>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 p-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-md transition-colors border",
                selectedCategory === category.id 
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              )}
            >
              {category.icon}
              <span className="mt-1 text-xs font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Subcategories Section */}
      <Card>
        <div 
          className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer"
          onClick={() => setShowSubcategories(!showSubcategories)}
        >
          <h3 className="font-medium text-sm">Material Options</h3>
          {showSubcategories ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
        
        {showSubcategories && (
          <div className="p-4 space-y-4">
            {/* Subcategory Selection */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {subcategories[selectedCategory].map(subcategory => (
                <button
                  key={subcategory}
                  onClick={() => setSelectedSubcategory(subcategory)}
                  className={cn(
                    "px-3 py-2 rounded-md border text-sm transition-colors",
                    selectedSubcategory === subcategory
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                  )}
                >
                  {getSubcategoryDisplayName(subcategory)}
                </button>
              ))}
            </div>
            
            {/* Material Description */}
            <div className="pt-2 mt-2 border-t border-gray-100">
              <p className="text-sm text-gray-600">
                {getDescription(selectedCategory, selectedSubcategory)}
              </p>
            </div>
          </div>
        )}
      </Card>
      
      {/* Product Gallery Card */}
      <Card>
        <div className="p-4">
          <h3 className="font-medium text-sm mb-2">{getSubcategoryDisplayName(selectedSubcategory)} Preview</h3>
          <ProductGallery 
            images={productImages.slice(0, 3)}
            productName={getSubcategoryDisplayName(selectedSubcategory)}
          />
        </div>
      </Card>
    </div>
  );
};

export default ShopMaterialSelector;
