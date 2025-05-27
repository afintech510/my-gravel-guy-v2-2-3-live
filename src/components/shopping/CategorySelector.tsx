
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onCategorySelect
}) => {
  return (
    <Card className="mb-6 md:mb-8">
      <CardContent className="p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold mb-4">FREE SHIPPING NATIONWIDE</h3>
        
        {/* Mobile: 2 columns for 11 categories */}
        <div className="grid grid-cols-2 gap-2 md:hidden">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={`p-3 rounded-lg border text-xs font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="text-lg mb-1">{category.icon}</div>
              <div className="leading-tight">{category.name}</div>
            </button>
          ))}
        </div>

        {/* Desktop: 3 columns to accommodate 11 categories better */}
        <div className="hidden md:grid grid-cols-3 gap-3">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={`p-4 rounded-lg border text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-green-500 text-white border-green-500'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="text-xl mb-2">{category.icon}</div>
              <div className="font-semibold mb-1">{category.name}</div>
              <div className="text-xs opacity-75 leading-tight">{category.description}</div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CategorySelector;
