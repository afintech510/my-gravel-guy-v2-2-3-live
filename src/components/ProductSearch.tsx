
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Search, Filter, SortAsc, SortDesc, ChevronDown, Package } from 'lucide-react';
import { Leaf, BrickWall, TreeDeciduous, Hammer, Grid3X3 } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { getUniqueCategories } from '@/services/productService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Define the category and subcategory structure
const categoryStructure = {
  'all': [],
  'gravel': ['walkway', 'driveway', 'drainage', 'natural', 'crushed', 'round'],
  'dirt': ['top-soil', 'compost', 'fill-dirt', 'loam', 'sandy-loam'],
  'base': ['road-base', 'concrete-rca', 'crusher-base'],
  'sand': ['concrete', 'mason', 'playground', 'beach', 'washed'],
  'mulch': ['chocolate', 'jet-black', 'red', 'natural-dark', 'wood-chips']
};

// Define main categories to display - limited to just the 6 main ones
const mainCategories = ['all', 'gravel', 'dirt', 'base', 'sand', 'mulch'];

// Define size options for gravel and base
const sizeOptions = ['3/8"', '3/4"', '1"', '1½"', '2-3"'];

// Define category icons - making sure each category has a valid icon
const CategoryIcons = {
  'all': Grid3X3,
  'gravel': Package,
  'dirt': Leaf,
  'base': Hammer,
  'sand': BrickWall,
  'mulch': TreeDeciduous,
};

interface ProductSearchProps {
  onSearch: (term: string) => void;
  onSort: (option: string) => void;
  onFilter: (category: string, subcategory?: string, size?: string) => void;
}

const ProductSearch = ({ onSearch, onSort, onFilter }: ProductSearchProps) => {
  const [sortOrder, setSortOrder] = useState('nameAsc');
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState('');
  const [size, setSize] = useState('');
  const [categories, setCategories] = useState<string[]>(mainCategories);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const isMobile = useIsMobile();

  // Helper to check if the current category should show size options
  const shouldShowSizes = () => ['gravel', 'base'].includes(category);

  useEffect(() => {
    // Fetch unique categories from the database but only use our predefined main categories
    async function loadCategories() {
      try {
        // We'll still fetch all categories but only use the ones in our mainCategories array
        await getUniqueCategories();
        
        // Only use the predefined main categories
        setCategories(mainCategories);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    }

    loadCategories();
  }, []);

  // Update subcategories when category changes
  useEffect(() => {
    if (category === 'all') {
      setSubcategories([]);
      setSubcategory('');
    } else {
      const availableSubcategories = categoryStructure[category as keyof typeof categoryStructure] || [];
      setSubcategories(availableSubcategories);
      setSubcategory(''); // Reset subcategory when category changes
    }
    
    // Reset size when category changes
    setSize('');
  }, [category]);

  const handleSortChange = (value: string) => {
    setSortOrder(value);
    onSort(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSubcategory('');
    setSize(''); // Reset size when category changes
    onFilter(value);
    console.log(`Category changed to: ${value}, subcategory reset to empty`);
  };

  const handleSubcategoryChange = (value: string) => {
    setSubcategory(value);
    
    // Critical fix: Always pass both category and subcategory to onFilter
    // This ensures that when we select a subcategory, we still filter by the main category
    const effectiveSubcategory = value === 'all' ? '' : value;
    console.log(`Subcategory changed to: ${value} (effective: ${effectiveSubcategory}), category: ${category}`);
    onFilter(category, effectiveSubcategory, size);
  };

  const handleSizeChange = (value: string) => {
    setSize(value);
    console.log(`Size changed to: ${value}, category: ${category}, subcategory: ${subcategory}`);
    
    // Update filters with new size
    const effectiveSubcategory = subcategory === 'all' ? '' : subcategory;
    onFilter(category, effectiveSubcategory, value);
  };

  // Format name for display
  const formatName = (name: string) => {
    if (name === 'all') return 'All Products';
    return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        {!isMobile ? (
          <div className="flex flex-col gap-4 w-full">
            <ToggleGroup
              type="single"
              value={category}
              onValueChange={(value) => value && handleCategoryChange(value)}
              className="grid grid-cols-6 gap-2 w-full"
            >
              {categories.map((cat) => {
                // Safe guard for categories that don't have defined icons
                const IconComponent = CategoryIcons[cat as keyof typeof CategoryIcons] || Grid3X3;
                return (
                  <ToggleGroupItem 
                    key={cat} 
                    value={cat}
                    className={`flex-1 py-8 ${cat === category ? 'bg-primary text-primary-foreground' : 'bg-background dark:bg-secondary'} 
                              data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md transition-colors duration-200`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <IconComponent className="h-7 w-7" />
                      <span className="capitalize text-sm">{formatName(cat)}</span>
                    </div>
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>

            {/* Subcategory toggle buttons - only shown when a main category is selected */}
            {category !== 'all' && subcategories.length > 0 && (
              <ToggleGroup
                type="single"
                value={subcategory}
                onValueChange={(value) => value && handleSubcategoryChange(value)}
                className="grid grid-cols-3 sm:grid-cols-6 gap-2 w-full"
              >
                <ToggleGroupItem 
                  value="all"
                  className={`flex-1 py-3 text-xs ${subcategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-background dark:bg-secondary'} 
                            data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md transition-colors duration-200`}
                >
                  <div className="flex flex-col items-center">
                    <span>All {formatName(category)}</span>
                  </div>
                </ToggleGroupItem>
                {subcategories.map((sub) => (
                  <ToggleGroupItem 
                    key={sub} 
                    value={sub}
                    className={`flex-1 py-3 text-xs ${sub === subcategory ? 'bg-primary text-primary-foreground' : 'bg-background dark:bg-secondary'} 
                              data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md transition-colors duration-200`}
                  >
                    <div className="flex flex-col items-center">
                      <span>{formatName(sub)}</span>
                    </div>
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            )}

            {/* Size selector - only shown for gravel and base categories */}
            {shouldShowSizes() && (
              <div className="mt-1">
                <h3 className="font-medium text-sm mb-2">Size</h3>
                <ToggleGroup
                  type="single"
                  value={size}
                  onValueChange={(value) => value && handleSizeChange(value)}
                  className="grid grid-cols-3 sm:grid-cols-5 gap-2 w-full"
                >
                  <ToggleGroupItem 
                    value=""
                    className={`flex-1 py-3 text-xs ${size === '' ? 'bg-primary text-primary-foreground' : 'bg-background dark:bg-secondary'} 
                              data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md transition-colors duration-200`}
                  >
                    <div className="flex flex-col items-center">
                      <span>All Sizes</span>
                    </div>
                  </ToggleGroupItem>
                  {sizeOptions.map((sizeOption) => (
                    <ToggleGroupItem 
                      key={sizeOption} 
                      value={sizeOption}
                      className={`flex-1 py-3 text-xs ${sizeOption === size ? 'bg-primary text-primary-foreground' : 'bg-background dark:bg-secondary'} 
                                data-[state=on]:bg-primary data-[state=on]:text-primary-foreground rounded-md transition-colors duration-200`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{sizeOption}</span>
                      </div>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            )}
          </div>
        ) : (
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={toggleMobileFilters}
                className="flex items-center text-sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter Products
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
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
            
            {showMobileFilters && (
              <div className="space-y-6 mb-6 bg-gray-50 p-4 rounded-lg">
                {/* Mobile Category Selection Buttons */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm mb-2">Categories</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((cat) => {
                      // Safe guard for categories that don't have defined icons
                      const IconComponent = CategoryIcons[cat as keyof typeof CategoryIcons] || Grid3X3;
                      return (
                        <button
                          key={cat}
                          onClick={() => handleCategoryChange(cat)}
                          className={`flex flex-col items-center justify-center p-3 rounded-md ${
                            cat === category ? 'bg-primary text-primary-foreground' : 'bg-white border border-gray-200'
                          }`}
                        >
                          <IconComponent className="h-5 w-5 mb-1" />
                          <span className="text-xs font-medium">{formatName(cat)}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Mobile Subcategory Selection - only shown when a main category is selected */}
                {category !== 'all' && subcategories.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm mb-2">Type</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleSubcategoryChange('all')}
                        className={`py-2 px-3 text-xs rounded-md ${
                          subcategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-white border border-gray-200'
                        }`}
                      >
                        All {formatName(category)}
                      </button>
                      {subcategories.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => handleSubcategoryChange(sub)}
                          className={`py-2 px-3 text-xs rounded-md ${
                            sub === subcategory ? 'bg-primary text-primary-foreground' : 'bg-white border border-gray-200'
                          }`}
                        >
                          {formatName(sub)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Mobile Size Selection - only shown for gravel and base categories */}
                {shouldShowSizes() && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-sm mb-2">Size</h3>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleSizeChange('')}
                        className={`py-2 px-3 text-xs rounded-md ${
                          size === '' ? 'bg-primary text-primary-foreground' : 'bg-white border border-gray-200'
                        }`}
                      >
                        All Sizes
                      </button>
                      {sizeOptions.map((sizeOption) => (
                        <button
                          key={sizeOption}
                          onClick={() => handleSizeChange(sizeOption)}
                          className={`py-2 px-3 text-xs rounded-md ${
                            sizeOption === size ? 'bg-primary text-primary-foreground' : 'bg-white border border-gray-200'
                          }`}
                        >
                          {sizeOption}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {!isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
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
        )}
      </div>
    </div>
  );
};

export default ProductSearch;
