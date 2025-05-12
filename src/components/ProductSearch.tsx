
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Search, Filter, SortAsc, SortDesc, Grid3X3 } from 'lucide-react';
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

interface ProductSearchProps {
  onSearch: (term: string) => void;
  onSort: (option: string) => void;
  onFilter: (category: string) => void;
}

const ProductSearch = ({ onSearch, onSort, onFilter }: ProductSearchProps) => {
  const [sortOrder, setSortOrder] = useState('nameAsc');
  const [category, setCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>(['all', 'gravel', 'sand', 'dirt', 'mulch']);
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

  const handleSortChange = (value: string) => {
    setSortOrder(value);
    onSort(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    onFilter(value);
  };

  // Format category name for display
  const formatCategoryName = (category: string) => {
    if (category === 'all') return 'All Products';
    return category.charAt(0).toUpperCase() + category.slice(1);
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
          <ToggleGroup
            type="single"
            value={category}
            onValueChange={(value) => value && handleCategoryChange(value)}
            className="justify-start"
          >
            {categories.slice(0, 5).map((cat) => (
              <ToggleGroupItem key={cat} value={cat}>
                {formatCategoryName(cat)}
              </ToggleGroupItem>
            ))}
            {categories.length > 5 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>More Categories</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {categories.slice(5).map((cat) => (
                    <DropdownMenuRadioItem 
                      key={cat} 
                      value={cat}
                      onClick={() => handleCategoryChange(cat)}
                    >
                      {formatCategoryName(cat)}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </ToggleGroup>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={category} onValueChange={handleCategoryChange}>
                {categories.map((cat) => (
                  <DropdownMenuRadioItem key={cat} value={cat}>
                    {formatCategoryName(cat)}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
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
          <DropdownMenuContent align="end" className="w-48">
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
