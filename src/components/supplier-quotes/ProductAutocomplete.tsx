import React, { useState, useEffect } from 'react';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Check, ChevronsUpDown, Package } from 'lucide-react';
import { getProducts } from '@/services/products/productQueries';
import { Product } from '@/services/productTypes';

interface ProductAutocompleteProps {
  value: string;
  productId: string | null;
  onSelect: (product: Product | null, customText?: string) => void;
  placeholder?: string;
}

export function ProductAutocomplete({ 
  value, 
  productId, 
  onSelect, 
  placeholder = "Search or type material..." 
}: ProductAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState(value);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    getProducts()
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);
  
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);
  
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelect = (product: Product) => {
    onSelect(product);
    setSearchTerm(product.name);
    setOpen(false);
  };
  
  const handleCustomEntry = () => {
    if (searchTerm.trim()) {
      onSelect(null, searchTerm.trim());
      setOpen(false);
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-muted border-border text-left font-normal"
        >
          <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={placeholder}
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Loading products...
              </div>
            ) : (
              <>
                {filteredProducts.length === 0 && searchTerm && (
                  <CommandEmpty>
                    <button 
                      onClick={handleCustomEntry} 
                      className="w-full p-3 text-left hover:bg-accent rounded-md transition-colors"
                    >
                      <span className="text-muted-foreground">Use custom: </span>
                      <span className="font-medium text-foreground">"{searchTerm}"</span>
                    </button>
                  </CommandEmpty>
                )}
                
                {filteredProducts.length > 0 && (
                  <CommandGroup heading="Products">
                    {searchTerm && !filteredProducts.some(p => p.name.toLowerCase() === searchTerm.toLowerCase()) && (
                      <CommandItem
                        value={`custom-${searchTerm}`}
                        onSelect={handleCustomEntry}
                        className="cursor-pointer"
                      >
                        <span className="text-muted-foreground mr-1">Use custom:</span>
                        <span className="font-medium">"{searchTerm}"</span>
                      </CommandItem>
                    )}
                    {filteredProducts.slice(0, 10).map(product => (
                      <CommandItem
                        key={product.id}
                        value={product.name}
                        onSelect={() => handleSelect(product)}
                        className="cursor-pointer"
                      >
                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {product.category}
                        </span>
                        {productId === product.id && (
                          <Check className="ml-2 h-4 w-4 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                
                {!searchTerm && filteredProducts.length > 0 && (
                  <CommandGroup heading="All Products">
                    {products.slice(0, 8).map(product => (
                      <CommandItem
                        key={product.id}
                        value={product.name}
                        onSelect={() => handleSelect(product)}
                        className="cursor-pointer"
                      >
                        <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">{product.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {product.category}
                        </span>
                        {productId === product.id && (
                          <Check className="ml-2 h-4 w-4 text-primary" />
                        )}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
