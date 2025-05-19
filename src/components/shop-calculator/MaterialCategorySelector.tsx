
import React, { useState } from 'react';
import { Truck, Map, Shovel, Trees, Building } from 'lucide-react';
import { MaterialCategory, ApplicationType } from './ShopCalculator';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type MaterialCategorySelectorProps = {
  selectedCategory: MaterialCategory;
  setSelectedCategory: (category: MaterialCategory) => void;
  selectedApplication: ApplicationType;
  setSelectedApplication: (application: ApplicationType) => void;
};

type SubMenuOption = {
  label: string;
  value: string;
};

const MaterialCategorySelector: React.FC<MaterialCategorySelectorProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedApplication,
  setSelectedApplication
}) => {
  // State for tracking the selected sub-menu option
  const [selectedSubMenu, setSelectedSubMenu] = useState<string>("");

  const categories = [
    { id: 'gravel' as MaterialCategory, name: 'Gravel', icon: <Truck className="h-5 w-5" /> },
    { id: 'sand' as MaterialCategory, name: 'Sand', icon: <Map className="h-5 w-5" /> },
    { id: 'dirt' as MaterialCategory, name: 'Dirt', icon: <Shovel className="h-5 w-5" /> },
    { id: 'mulch' as MaterialCategory, name: 'Mulch', icon: <Trees className="h-5 w-5" /> },
    { id: 'base' as MaterialCategory, name: 'Base', icon: <Building className="h-5 w-5" /> }
  ];

  const applications = [
    { id: 'driveway' as ApplicationType, name: 'Driveway' },
    { id: 'walkway' as ApplicationType, name: 'Walkway' },
    { id: 'landscape' as ApplicationType, name: 'Landscape' },
    { id: 'natural' as ApplicationType, name: 'Natural' },
    { id: 'construction' as ApplicationType, name: 'Construction' }
  ];

  // Define sub-menu options for each category
  const subMenuOptions: Record<MaterialCategory, SubMenuOption[]> = {
    'sand': [
      { label: 'Washed Sand', value: 'washed-sand' },
      { label: 'Mason Sand', value: 'mason-sand' },
      { label: 'Playground Sand', value: 'playground-sand' },
      { label: 'Pool Sand', value: 'pool-sand' },
      { label: 'Beach Sand', value: 'beach-sand' }
    ],
    'dirt': [
      { label: 'Fill Dirt', value: 'fill-dirt' },
      { label: 'Topsoil', value: 'topsoil' },
      { label: 'Compost', value: 'compost' },
      { label: 'Loam', value: 'loam' },
      { label: 'Sandy Loam', value: 'sandy-loam' }
    ],
    'mulch': [
      { label: 'Natural', value: 'natural' },
      { label: 'Black', value: 'black' },
      { label: 'Chocolate Brown', value: 'chocolate-brown' },
      { label: 'Red', value: 'red' },
      { label: 'Request', value: 'request' }
    ],
    'base': [
      { label: '#57 Crushed Stone', value: 'crushed-stone' },
      { label: 'Crusher Run', value: 'crusher-run' },
      { label: 'Road Base', value: 'road-base' },
      { label: 'RCA / Crushed Concrete', value: 'crushed-concrete' },
      { label: 'Drainage Rock', value: 'drainage-rock' }
    ],
    'gravel': [
      { label: '3/8" Gravel', value: '3/8-gravel' },
      { label: '3/4" Gravel', value: '3/4-gravel' },
      { label: '1" Gravel', value: '1-gravel' },
      { label: '1½" Gravel', value: '1-1/2-gravel' },
      { label: '2-3" Gravel', value: '2-3-gravel' }
    ]
  };

  return (
    <div>
      <h3 className="font-medium text-gray-700 mb-2">Material</h3>
      
      {/* Material Categories */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => {
              setSelectedCategory(category.id);
              setSelectedSubMenu(""); // Reset sub-menu selection when changing category
            }}
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

      {/* Sub-menu Dropdown */}
      <div className="mb-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {selectedSubMenu ? 
                subMenuOptions[selectedCategory].find(option => option.value === selectedSubMenu)?.label : 
                `Select ${selectedCategory} Type`
              }
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full">
            {subMenuOptions[selectedCategory].map((option) => (
              <DropdownMenuItem 
                key={option.value} 
                onClick={() => setSelectedSubMenu(option.value)}
                className="cursor-pointer"
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Applications */}
      <div className="grid grid-cols-5 gap-2">
        {applications.map(application => (
          <button
            key={application.id}
            onClick={() => setSelectedApplication(application.id)}
            className={`p-2 text-xs rounded-lg transition-colors ${
              selectedApplication === application.id 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {application.name}
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-600">
          {selectedCategory === 'gravel' && (
            <>Our premium {selectedCategory} is perfect for {selectedApplication} applications. Available in various sizes to meet your specific needs.</>
          )}
          {selectedCategory === 'sand' && (
            <>High-quality {selectedCategory} ideal for {selectedApplication} projects. Clean, consistent grain size for reliable performance.</>
          )}
          {selectedCategory === 'dirt' && (
            <>Premium topsoil and {selectedCategory} options perfect for {selectedApplication} needs. Rich in nutrients for healthy plant growth.</>
          )}
          {selectedCategory === 'mulch' && (
            <>Organic {selectedCategory} options that enhance your {selectedApplication} while protecting plants and improving soil health.</>
          )}
          {selectedCategory === 'base' && (
            <>Sturdy {selectedCategory} materials designed specifically for {selectedApplication} projects requiring solid foundation support.</>
          )}
          {selectedSubMenu && (
            <> We recommend {subMenuOptions[selectedCategory].find(option => option.value === selectedSubMenu)?.label} for optimal results.</>
          )}
        </p>
      </div>
    </div>
  );
};

export default MaterialCategorySelector;
