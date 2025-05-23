
import React, { useState, useEffect } from 'react';
import { getProducts } from '@/services/productService';
import { Product } from '@/services/productTypes';
import { cn } from '@/lib/utils';
import { Package, Layers, Mountain, RockingChair, Building2, Shovel, Waves, Flower, Filter, Search, SortAsc, SortDesc } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductCategorySelectorProps {
  onSearch: (term: string) => void;
  onSort: (option: string) => void;
  onFilter: (category: string, subcategory?: string, size?: string) => void;
  availableSizes?: string[];
}

export default function ProductCategorySelector({ 
  onSearch, 
  onSort, 
  onFilter,
  availableSizes = [] 
}: ProductCategorySelectorProps) {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [sortOrder, setSortOrder] = useState('nameAsc');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  
  // Hardcoded categories with Lucide icons - same as ProductFilterSelector
  const categories = [
    { id: 'all', label: 'All Products', icon: <Package className="h-5 w-5" /> },
    { id: 'gravel', label: 'Gravel', icon: <Layers className="h-5 w-5" /> },
    { id: 'rock', label: 'Rock & Stone', icon: <Mountain className="h-5 w-5" /> },
    { id: 'crushed-gravel', label: 'Crushed Gravel', icon: <RockingChair className="h-5 w-5" /> },
    { id: 'crushed-concrete', label: 'Crushed Concrete', icon: <Building2 className="h-5 w-5" /> },
    { id: 'soil-dirt', label: 'Soil & Dirt', icon: <Shovel className="h-5 w-5" /> },
    { id: 'sand', label: 'Sand', icon: <Waves className="h-5 w-5" /> },
    { id: 'mulch', label: 'Mulch', icon: <Flower className="h-5 w-5" /> },
  ];
  
  // Define subcategories mapping
  const subcategories: Record<string, string[]> = {
    'gravel': ['all', 'driveway', 'walkway', 'decorative', 'drainage'],
    'rock': ['all', 'river-rock', 'boulders', 'flagstone', 'limestone'],
    'crushed-gravel': ['all', 'standard', 'fine', 'course'],
    'crushed-concrete': ['all', 'rca', 'recycled-base'],
    'soil-dirt': ['all', 'top-soil', 'fill-dirt', 'garden-mix', 'compost'],
    'sand': ['all', 'concrete', 'mason', 'play', 'fill'],
    'mulch': ['all', 'black', 'brown', 'red', 'natural']
  };

  // Determine if we show size options - like ProductFilterSelector
  const categoriesWithSizes = ['gravel', 'rock', 'crushed-gravel', 'crushed-concrete'];
  const showSizeSelector = selectedCategory !== 'all' && categoriesWithSizes.includes(selectedCategory);

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSelectedSubcategory('');
    setSelectedSize('');
    onFilter(category);
  };

  // Handle subcategory selection
  const handleSubcategorySelect = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    const effectiveSubcategory = subcategory === 'all' ? '' : subcategory;
    onFilter(selectedCategory, effectiveSubcategory, selectedSize);
  };

  // Handle size selection
  const handleSizeSelect = (size: string) => {
    setSelectedSize(size);
    const effectiveSubcategory = selectedSubcategory === 'all' ? '' : selectedSubcategory;
    onFilter(selectedCategory, effectiveSubcategory, size);
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  // Handle sort
  const handleSortChange = (value: string) => {
    setSortOrder(value);
    onSort(value);
  };

  return (
    <div className="space-y-6">
      {/* Search and Sort Row */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0">
              {sortOrder.includes('Desc') ? (
                <SortDesc className="h-4 w-4" />
              ) : (
                <SortAsc className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white">
            <DropdownMenuLabel>Sort By</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={sortOrder} onValueChange={handleSortChange}>
              <DropdownMenuRadioItem value="nameAsc">Name (A-Z)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="nameDesc">Name (Z-A)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="priceAsc">Price (Low-High)</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="priceDesc">Price (High-Low)</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Category Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Material Category</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className={cn(
                "flex items-center justify-center p-3 border rounded-md transition-colors",
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
              )}
            >
              {category.icon}
              <span className={cn("ml-2", isMobile ? "text-xs" : "text-sm")}>
                {category.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Subcategory Selection - Only show if a category is selected and it's not "all" */}
      {selectedCategory !== 'all' && subcategories[selectedCategory] && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Type</h3>
          <div className="flex flex-wrap gap-2">
            {subcategories[selectedCategory].map(subcategory => (
              <button
                key={subcategory}
                onClick={() => handleSubcategorySelect(subcategory)}
                className={cn(
                  "px-4 py-2 rounded-md border transition-colors",
                  selectedSubcategory === subcategory
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                )}
              >
                {subcategory === 'all' ? 'All' : 
                  subcategory.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Size Selection - Only show for certain categories */}
      {showSizeSelector && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Size</h3>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleSizeSelect('')}
              className={cn(
                "px-4 py-2 rounded-md border transition-colors",
                selectedSize === ''
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
              )}
            >
              All Sizes
            </button>
            {availableSizes.map(size => (
              <button
                key={size}
                onClick={() => handleSizeSelect(size)}
                className={cn(
                  "px-4 py-2 rounded-md border transition-colors",
                  selectedSize === size
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                )}
              >
                {size}
              </button>
            ))}
            {availableSizes.length === 0 && showSizeSelector && (
              <div className="text-sm text-gray-500 py-2">
                No sizes available for current selection
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
