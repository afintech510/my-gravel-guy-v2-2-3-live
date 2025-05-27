
import React, { useState, useEffect } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Product, MaterialCategory } from '@/services/productTypes';
import { cn } from '@/lib/utils';
import { Package, BrickWall, Leaf, TreeDeciduous, Mountain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface MaterialSelectorProps {
  products: Product[];
  selectedProduct: string;
  onProductSelect: (value: string) => void;
}

const CategoryIcons = {
  gravel: Package,
  sand: BrickWall,
  dirt: Leaf,
  mulch: TreeDeciduous,
  rock: Mountain,
};

// Define multi-select options
const USAGE_OPTIONS = ['driveway', 'walkway', 'drainage', 'general'];
const TYPE_OPTIONS = ['crushed', 'natural', 'round', 'concrete'];
const SIZE_OPTIONS = ['3/8"', '1/2"', '3/4"', '1"', '1 1/2"', '2"', '3"', '4"'];

// Category mapping to handle database vs UI category differences
const getCategoryMatches = (selectedCategory: string, productCategory: MaterialCategory): boolean => {
  switch (selectedCategory) {
    case 'gravel':
      return productCategory === 'gravel' || productCategory === 'crushed gravel';
    case 'dirt':
      return productCategory === 'dirt' || productCategory === 'soil';
    case 'rock':
      return productCategory === 'rock' || productCategory === 'stone' || productCategory === 'rock & stone';
    case 'sand':
      return productCategory === 'sand';
    case 'mulch':
      return productCategory === 'mulch';
    case 'base':
      return productCategory === 'base' || productCategory === 'crushed concrete';
    default:
      return productCategory === selectedCategory;
  }
};

const MaterialSelector = ({ products, selectedProduct, onProductSelect }: MaterialSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('gravel');
  
  // Multi-select states
  const [selectedUsages, setSelectedUsages] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('');

  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Reset dependent selections when category changes
  useEffect(() => {
    setSelectedUsages([]);
    setSelectedTypes([]);
    setSelectedSizes([]);
    setSelectedColor('');
  }, [selectedCategory]);
  
  // Update filtered products whenever selection criteria change
  useEffect(() => {
    const filtered = products.filter(product => {
      // Use the new category matching logic
      const categoryMatch = getCategoryMatches(selectedCategory, product.category);
      
      if (!categoryMatch) return false;
      
      // Check application/usage filter (if any selected)
      if (selectedUsages.length > 0) {
        // Check if product matches any of the selected usages
        const matchesUsage = selectedUsages.some(usage => {
          // Check both usage field and categories array
          const usageMatch = product.usage === usage;
          const categoryHasUsage = product.categories?.some(cat => 
            cat.toLowerCase() === usage.toLowerCase()
          );
          return usageMatch || categoryHasUsage;
        });
        
        if (!matchesUsage) return false;
      }

      // Check size filter (if any selected)
      if (selectedSizes.length > 0 && product.size) {
        // Normalize sizes for comparison
        const normalizedProductSize = product.size.replace(/\s+/g, '').toLowerCase();
        
        // Check if product size matches any of the selected sizes
        const matchesSize = selectedSizes.some(size => {
          const normalizedSelectedSize = size.replace(/\s+/g, '').toLowerCase();
          return normalizedProductSize.includes(normalizedSelectedSize);
        });
        
        if (!matchesSize) return false;
      }

      // Check type filter (if any selected)
      if (selectedTypes.length > 0) {
        // Check if product matches any of the selected types
        const matchesType = selectedTypes.some(type => {
          // Check both subtype field and categories array
          const subtypeMatch = product.subtype === type;
          const categoryHasSubtype = product.categories?.some(cat => 
            cat.toLowerCase() === type.toLowerCase()
          );
          return subtypeMatch || categoryHasSubtype;
        });
        
        if (!matchesType) return false;
      }
      
      // Check color filter
      if (selectedColor && product.color && product.color !== selectedColor) return false;
      
      return true;
    });
    
    setFilteredProducts(filtered);
    
    // Auto-select the first product when filters change if the currently selected product is filtered out
    if (filtered.length > 0) {
      const currentProductStillAvailable = filtered.some(p => p.id.toString() === selectedProduct);
      if (!currentProductStillAvailable) {
        onProductSelect(filtered[0].id.toString());
      }
    }
  }, [products, selectedCategory, selectedUsages, selectedTypes, selectedSizes, selectedColor, selectedProduct, onProductSelect]);
  
  // Get available options for each filter based on current selections
  const getAvailableOptions = (filterType: 'usage' | 'type' | 'size' | 'color') => {
    // Filter products based on current selections except the one we're checking
    const baseFiltered = products.filter(product => {
      // Use the new category matching logic for availability check
      const categoryMatch = getCategoryMatches(selectedCategory, product.category);
      
      if (!categoryMatch) return false;
      
      // Skip checking the filter type we're getting options for
      if (filterType !== 'usage' && selectedUsages.length > 0) {
        const matchesUsage = selectedUsages.some(usage => {
          const usageMatch = product.usage === usage;
          const categoryHasUsage = product.categories?.some(cat => 
            cat.toLowerCase() === usage.toLowerCase()
          );
          return usageMatch || categoryHasUsage;
        });
        if (!matchesUsage) return false;
      }
      
      if (filterType !== 'type' && selectedTypes.length > 0) {
        const matchesType = selectedTypes.some(type => {
          const subtypeMatch = product.subtype === type;
          const categoryHasSubtype = product.categories?.some(cat => 
            cat.toLowerCase() === type.toLowerCase()
          );
          return subtypeMatch || categoryHasSubtype;
        });
        if (!matchesType) return false;
      }
      
      if (filterType !== 'size' && selectedSizes.length > 0 && product.size) {
        const normalizedProductSize = product.size.replace(/\s+/g, '').toLowerCase();
        const matchesSize = selectedSizes.some(size => {
          const normalizedSelectedSize = size.replace(/\s+/g, '').toLowerCase();
          return normalizedProductSize.includes(normalizedSelectedSize);
        });
        if (!matchesSize) return false;
      }
      
      if (filterType !== 'color' && selectedColor && product.color !== selectedColor) return false;
      
      return true;
    });
    
    const options = new Set<string>();
    
    baseFiltered.forEach(product => {
      switch (filterType) {
        case 'usage':
          if (product.usage) options.add(product.usage);
          // Also check categories for usage-related terms
          if (product.categories) {
            USAGE_OPTIONS.forEach(usage => {
              if (product.categories?.some(cat => cat.toLowerCase() === usage)) {
                options.add(usage);
              }
            });
          }
          break;
        case 'type':
          if (product.subtype) options.add(product.subtype);
          // Also check categories for type-related terms
          if (product.categories) {
            TYPE_OPTIONS.forEach(type => {
              if (product.categories?.some(cat => cat.toLowerCase() === type)) {
                options.add(type);
              }
            });
          }
          break;
        case 'size':
          if (product.size) {
            // Map to standard size option
            SIZE_OPTIONS.forEach(sizeOption => {
              const normalizedSizeOption = sizeOption.replace(/\s+/g, '').toLowerCase();
              const normalizedProductSize = product.size?.replace(/\s+/g, '').toLowerCase() || '';
              if (normalizedProductSize.includes(normalizedSizeOption)) {
                options.add(sizeOption);
              }
            });
          }
          break;
        case 'color':
          if (product.color) options.add(product.color);
          break;
      }
    });
    
    return Array.from(options).sort();
  };
  
  const availableUsages = getAvailableOptions('usage');
  const availableTypes = getAvailableOptions('type');
  const availableSizes = getAvailableOptions('size');
  const availableColors = getAvailableOptions('color');

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value);
  };

  // Toggle selection in a multi-select array
  const toggleSelection = (value: string, currentSelections: string[], setSelections: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (currentSelections.includes(value)) {
      setSelections(currentSelections.filter(item => item !== value));
    } else {
      setSelections([...currentSelections, value]);
    }
  };

  // Render the multi-select checkboxes for a filter type
  const renderMultiSelect = (
    title: string,
    options: string[],
    availableOptions: string[],
    selectedOptions: string[],
    setSelectedOptions: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (availableOptions.length === 0) return null;

    return (
      <div className="space-y-2 mt-4">
        <label className="text-sm font-medium">{title}</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {options.map((option) => {
            const isAvailable = availableOptions.includes(option);
            return (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox 
                  id={`${title.toLowerCase()}-${option}`}
                  checked={selectedOptions.includes(option)}
                  disabled={!isAvailable}
                  onCheckedChange={() => {
                    if (isAvailable) {
                      toggleSelection(option, selectedOptions, setSelectedOptions);
                    }
                  }}
                />
                <Label 
                  htmlFor={`${title.toLowerCase()}-${option}`}
                  className={cn(
                    "capitalize",
                    !isAvailable && "text-gray-400"
                  )}
                >
                  {option.replace(/-/g, ' ')}
                </Label>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Material Category</label>
        <ToggleGroup
          type="single"
          value={selectedCategory}
          onValueChange={handleCategorySelect}
          className="justify-start gap-2"
        >
          {Object.keys(CategoryIcons).map((category) => {
            const Icon = CategoryIcons[category as keyof typeof CategoryIcons];
            const displayName = category === 'rock' ? 'Rock' : category.charAt(0).toUpperCase() + category.slice(1);
            return (
              <ToggleGroupItem
                key={category}
                value={category}
                className="flex-1 py-8 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className="h-6 w-6" />
                  <span className="capitalize">{displayName}</span>
                </div>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {/* Multi-select filter options based on category */}
      {selectedCategory === 'gravel' && (
        <>
          {renderMultiSelect('Usage', USAGE_OPTIONS, availableUsages, selectedUsages, setSelectedUsages)}
          {renderMultiSelect('Type', TYPE_OPTIONS, availableTypes, selectedTypes, setSelectedTypes)}
          {renderMultiSelect('Size', SIZE_OPTIONS, availableSizes, selectedSizes, setSelectedSizes)}
        </>
      )}

      {selectedCategory === 'mulch' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <ToggleGroup
            type="single"
            value={selectedColor}
            onValueChange={(value) => setSelectedColor(value)}
            className="justify-start gap-2"
          >
            {['chocolate', 'jet-black', 'red', 'natural-dark', 'wood-chips'].filter(color => 
              availableColors.includes(color)
            ).map((color) => (
              <ToggleGroupItem
                key={color}
                value={color}
                className="flex-1 py-3 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                disabled={!availableColors.includes(color)}
              >
                <span className="capitalize">{color.replace('-', ' ')}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {/* Render different subtype selectors based on category */}
      {['sand', 'dirt', 'rock'].includes(selectedCategory) && (
        <div className="space-y-2 mt-4">
          <label className="text-sm font-medium">Type</label>
          <ToggleGroup
            type="single"
            value={selectedTypes[0] || ''}
            onValueChange={(value) => setSelectedTypes(value ? [value] : [])}
            className="justify-start gap-2 flex-wrap"
          >
            {availableTypes.map((type) => (
              <ToggleGroupItem
                key={type}
                value={type}
                className="flex-1 py-3 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
              >
                <span className="capitalize">{type.replace('-', ' ')}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {/* Available Products Display */}
      {filteredProducts.length > 0 ? (
        <div className="space-y-3 border rounded-lg p-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Available Products</h3>
            <Badge variant="outline">{filteredProducts.length} found</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onProductSelect(product.id.toString())}
                className={cn(
                  "w-full p-3 text-left rounded-lg border transition-colors",
                  selectedProduct === product.id.toString()
                    ? "border-primary bg-primary/5"
                    : "hover:bg-gray-50"
                )}
              >
                <span className="font-medium">{product.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-4 text-center text-muted-foreground">
          No products match the selected criteria. Try different options.
        </div>
      )}
    </div>
  );
};

export default MaterialSelector;
