
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Search, Filter, SortAsc, SortDesc, Grid3X3, ChevronDown } from 'lucide-react';
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
  'sand': ['concrete', 'mason', 'playground', 'beach', 'washed'],
  'dirt': ['top-soil', 'compost', 'fill-dirt', 'loam', 'sandy-loam'],
  'mulch': ['chocolate', 'jet-black', 'red', 'natural-dark', 'wood-chips'],
  'base': ['road-base', 'concrete-rca', 'crusher-base']
};

interface ProductSearchProps {
  onSearch: (term: string) => void;
  onSort: (option: string) => void;
  onFilter: (category: string, subcategory?: string) => void;
}

const ProductSearch = ({ onSearch, onSort, onFilter }: ProductSearchProps) => {
  const [sortOrder, setSortOrder] = useState('nameAsc');
  const [category, setCategory] = useState('all');
  const [subcategory, setSubcategory] = useState('');
  const [categories, setCategories] = useState<string[]>(['all', 'gravel', 'sand', 'dirt', 'mulch', 'base']);
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Fetch unique categories from the database
    async function loadCategories() {
      try {
        const uniqueCategories = await getUniqueCategories();
        // Always include 'all' as the first option
        setCategories(['all', ...uniqueCategories]);
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
  }, [category]);

  const handleSortChange = (value: string) => {
    setSortOrder(value);
    onSort(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setSubcategory('');
    onFilter(value);
  };

  const handleSubcategoryChange = (value: string) => {
    setSubcategory(value);
    onFilter(category, value);
  };

  // Format name for display
  const formatName = (name: string) => {
    if (name === 'all') return 'All Products';
    return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
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
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <ToggleGroup
              type="single"
              value={category}
              onValueChange={(value) => value && handleCategoryChange(value)}
              className="justify-start"
            >
              {categories.slice(0, 5).map((cat) => (
                <ToggleGroupItem key={cat} value={cat}>
                  {formatName(cat)}
                </ToggleGroupItem>
              ))}
              {categories.length > 5 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Grid3X3 className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-white">
                    <DropdownMenuLabel>More Categories</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {categories.slice(5).map((cat) => (
                      <DropdownMenuRadioItem 
                        key={cat} 
                        value={cat}
                        onClick={() => handleCategoryChange(cat)}
                      >
                        {formatName(cat)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </ToggleGroup>

            {/* Subcategory selector - only shown when a main category is selected */}
            {category !== 'all' && subcategories.length > 0 && (
              <div className="flex-grow">
                <Select value={subcategory} onValueChange={handleSubcategoryChange}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    <SelectItem value="">All {formatName(category)}</SelectItem>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub} value={sub}>
                        {formatName(sub)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 bg-white">
              <DropdownMenuLabel>Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2">
                <RadioGroup value={category} onValueChange={handleCategoryChange}>
                  {categories.map((cat) => (
                    <div className="flex items-center space-x-2 py-1" key={cat}>
                      <RadioGroupItem value={cat} id={`category-${cat}`} />
                      <Label htmlFor={`category-${cat}`}>{formatName(cat)}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              {category !== 'all' && subcategories.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>Type</DropdownMenuLabel>
                  <div className="p-2">
                    <RadioGroup value={subcategory} onValueChange={handleSubcategoryChange}>
                      <div className="flex items-center space-x-2 py-1">
                        <RadioGroupItem value="" id="subcategory-all" />
                        <Label htmlFor="subcategory-all">All {formatName(category)}</Label>
                      </div>
                      {subcategories.map((sub) => (
                        <div className="flex items-center space-x-2 py-1" key={sub}>
                          <RadioGroupItem value={sub} id={`subcategory-${sub}`} />
                          <Label htmlFor={`subcategory-${sub}`}>{formatName(sub)}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

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
    </div>
  );
};

export default ProductSearch;
