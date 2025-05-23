
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
  const [sortOrder, setSortOrder] = useState('nameAsc');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Updated categories with correct IDs matching the mapping requirements
  const categories = [
    { id: 'all', label: 'All Products', icon: <Package className="h-5 w-5" /> },
    { id: 'gravel', label: 'Gravel', icon: <Layers className="h-5 w-5" /> },
    { id: 'rock-stone', label: 'Rock & Stone', icon: <Mountain className="h-5 w-5" /> },
    { id: 'crushed-gravel', label: 'Crushed Gravel', icon: <RockingChair className="h-5 w-5" /> },
    { id: 'crushed-concrete', label: 'Crushed Concrete', icon: <Building2 className="h-5 w-5" /> },
    { id: 'soil-dirt', label: 'Soil & Dirt', icon: <Shovel className="h-5 w-5" /> },
    { id: 'sand', label: 'Sand', icon: <Waves className="h-5 w-5" /> },
    { id: 'mulch', label: 'Mulch', icon: <Flower className="h-5 w-5" /> },
  ];

  // Handle category selection with correct mapping
  const handleCategorySelect = (category: string) => {
    console.log(`ProductCategorySelector: Selected category ${category}`);
    setSelectedCategory(category);
    
    // Map the UI category to the actual category strings used in product data
    let mappedCategories: string[] = [];
    
    switch (category) {
      case 'soil-dirt':
        mappedCategories = ['dirt', 'soil']; // Check both 'dirt' and 'soil'
        break;
      case 'crushed-concrete':
        mappedCategories = ['crushed concrete']; // Exact match for 'crushed concrete'
        break;
      case 'crushed-gravel':
        mappedCategories = ['crushed gravel']; // Exact match for 'crushed gravel'
        break;
      case 'rock-stone':
        mappedCategories = ['rock stone']; // Exact match for 'rock stone'
        break;
      case 'mulch':
        mappedCategories = ['mulch']; // Direct mapping
        break;
      case 'gravel':
        mappedCategories = ['gravel']; // Direct mapping
        break;
      case 'sand':
        mappedCategories = ['sand']; // Direct mapping
        break;
      case 'all':
      default:
        mappedCategories = ['all']; // Show all products
        break;
    }
    
    console.log(`ProductCategorySelector: Mapped ${category} to ${mappedCategories.join(', ')}`);
    
    // Pass the first category or 'all' for the filter
    const filterCategory = mappedCategories[0] || 'all';
    
    // Store the additional categories for the ProductGrid to use
    onFilter(filterCategory, undefined, undefined);
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
    </div>
  );
}
