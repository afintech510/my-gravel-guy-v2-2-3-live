
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProductSearchProps {
  onSearch: (term: string) => void;
  onSort: (option: string) => void;
  onFilter: (category: string) => void;
}

const ProductSearch = ({ onSearch, onSort, onFilter }: ProductSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('nameAsc');
  const [category, setCategory] = useState('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
    onSort(value);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    onFilter(value);
  };

  return (
    <div className="w-full space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        
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
              <DropdownMenuRadioItem value="all">All Products</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="gravel">Gravel</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="sand">Sand</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dirt">Dirt</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

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
      </form>
    </div>
  );
};

export default ProductSearch;
