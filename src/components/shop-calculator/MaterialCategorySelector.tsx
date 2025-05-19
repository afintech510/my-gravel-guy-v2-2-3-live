
import React from 'react';
import { Truck, Road, Shovel, Tree, Building } from 'lucide-react';
import { MaterialCategory, ApplicationType } from './ShopCalculator';

type MaterialCategorySelectorProps = {
  selectedCategory: MaterialCategory;
  setSelectedCategory: (category: MaterialCategory) => void;
  selectedApplication: ApplicationType;
  setSelectedApplication: (application: ApplicationType) => void;
};

const MaterialCategorySelector: React.FC<MaterialCategorySelectorProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedApplication,
  setSelectedApplication
}) => {
  const categories = [
    { id: 'gravel' as MaterialCategory, name: 'Gravel', icon: <Truck className="h-5 w-5" /> },
    { id: 'sand' as MaterialCategory, name: 'Sand', icon: <Road className="h-5 w-5" /> },
    { id: 'dirt' as MaterialCategory, name: 'Dirt', icon: <Shovel className="h-5 w-5" /> },
    { id: 'mulch' as MaterialCategory, name: 'Mulch', icon: <Tree className="h-5 w-5" /> },
    { id: 'base' as MaterialCategory, name: 'Base', icon: <Building className="h-5 w-5" /> }
  ];

  const applications = [
    { id: 'driveway' as ApplicationType, name: 'Driveway' },
    { id: 'walkway' as ApplicationType, name: 'Walkway' },
    { id: 'landscape' as ApplicationType, name: 'Landscape' },
    { id: 'natural' as ApplicationType, name: 'Natural' },
    { id: 'construction' as ApplicationType, name: 'Construction' }
  ];

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
        </p>
      </div>
    </div>
  );
};

export default MaterialCategorySelector;
