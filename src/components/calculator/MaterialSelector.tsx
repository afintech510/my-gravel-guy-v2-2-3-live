
import React, { useState, useEffect } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Product, MaterialCategory, MaterialUsage, MaterialSubtype, MaterialSize, MaterialColor } from '@/services/productTypes';
import { cn } from '@/lib/utils';
import { Package, BrickWall, Leaf, TreeDeciduous, Hammer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
  base: Hammer,
};

const MaterialSelector = ({ products, selectedProduct, onProductSelect }: MaterialSelectorProps) => {
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory>('gravel');
  const [selectedUsage, setSelectedUsage] = useState<MaterialUsage | ''>('');
  const [selectedSubtype, setSelectedSubtype] = useState<MaterialSubtype | ''>('');
  const [selectedSize, setSelectedSize] = useState<MaterialSize | ''>('');
  const [selectedColor, setSelectedColor] = useState<MaterialColor | ''>('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Reset dependent selections when category changes
  useEffect(() => {
    setSelectedUsage('');
    setSelectedSubtype('');
    setSelectedSize('');
    setSelectedColor('');
  }, [selectedCategory]);
  
  // Update filtered products whenever selection criteria change
  useEffect(() => {
    const filtered = products.filter(product => {
      // Base category filter
      if (product.category !== selectedCategory) return false;
      
      // Check application/usage filter
      if (selectedUsage && product.usage !== selectedUsage) {
        // Also check if usage exists in categories array
        const categoryHasUsage = product.categories?.some(cat => 
          cat.toLowerCase() === selectedUsage.toLowerCase()
        );
        if (!categoryHasUsage) return false;
      }

      // Check size filter - handle various size formats in the database
      if (selectedSize && product.size) {
        const normalizedProductSize = product.size.replace(/\s+/g, '');
        const normalizedSelectedSize = selectedSize.replace(/\s+/g, '');
        if (normalizedProductSize !== normalizedSelectedSize) return false;
      }

      // Check subtype filter
      if (selectedSubtype) {
        // Check if subtype exists directly in product.subtype
        if (product.subtype && product.subtype !== selectedSubtype) return false;
        
        // Also check if subtype exists in categories array
        const categoryHasSubtype = product.categories?.some(cat => 
          cat.toLowerCase() === selectedSubtype.toLowerCase()
        );
        
        // If neither condition is true, filter out the product
        if (!product.subtype && !categoryHasSubtype) return false;
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
  }, [products, selectedCategory, selectedUsage, selectedSubtype, selectedSize, selectedColor, selectedProduct, onProductSelect]);
  
  // Get available options for each filter based on current selections
  const getAvailableOptions = (filterType: 'usage' | 'subtype' | 'size' | 'color') => {
    // Filter products based on current selections except the one we're checking
    const baseFiltered = products.filter(product => {
      if (product.category !== selectedCategory) return false;
      
      // Skip checking the filter type we're getting options for
      if (filterType !== 'usage' && selectedUsage) {
        if (product.usage !== selectedUsage) {
          const categoryHasUsage = product.categories?.some(cat => 
            cat.toLowerCase() === selectedUsage.toLowerCase()
          );
          if (!categoryHasUsage) return false;
        }
      }
      
      if (filterType !== 'subtype' && selectedSubtype) {
        const categoryHasSubtype = product.categories?.some(cat => 
          cat.toLowerCase() === selectedSubtype.toLowerCase()
        );
        if (product.subtype !== selectedSubtype && !categoryHasSubtype) return false;
      }
      
      if (filterType !== 'size' && selectedSize && product.size) {
        const normalizedProductSize = product.size.replace(/\s+/g, '');
        const normalizedSelectedSize = selectedSize.replace(/\s+/g, '');
        if (normalizedProductSize !== normalizedSelectedSize) return false;
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
            ['driveway', 'walkway', 'general'].forEach(usage => {
              if (product.categories?.some(cat => cat.toLowerCase() === usage)) {
                options.add(usage);
              }
            });
          }
          break;
        case 'subtype':
          if (product.subtype) options.add(product.subtype);
          // Also check categories for subtype-related terms
          if (product.categories) {
            ['crushed', 'round', 'natural', 'concrete'].forEach(subtype => {
              if (product.categories?.some(cat => cat.toLowerCase() === subtype)) {
                options.add(subtype);
              }
            });
          }
          break;
        case 'size':
          if (product.size) options.add(product.size);
          break;
        case 'color':
          if (product.color) options.add(product.color);
          break;
      }
    });
    
    return Array.from(options).sort();
  };
  
  const availableUsages = getAvailableOptions('usage');
  const availableSubtypes = getAvailableOptions('subtype');
  const availableSizes = getAvailableOptions('size');
  const availableColors = getAvailableOptions('color');

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value as MaterialCategory);
  };

  const getSandSubtypes = () => [
    { value: 'mason-sand', label: 'Mason Sand' },
    { value: 'playground-sand', label: 'Playground Sand' },
    { value: 'beach-sand', label: 'Beach Sand' },
    { value: 'washed-sand', label: 'Washed Sand' }
  ].filter(subtype => availableSubtypes.includes(subtype.value));

  const getDirtSubtypes = () => [
    { value: 'top-soil', label: 'Topsoil' },
    { value: 'compost', label: 'Compost' },
    { value: 'fill-dirt', label: 'Fill Dirt' },
    { value: 'loam', label: 'Loam' },
    { value: 'sandy-loam', label: 'Sandy Loam' }
  ].filter(subtype => availableSubtypes.includes(subtype.value));

  const getBaseSubtypes = () => [
    { value: 'road-base', label: 'Road Base' },
    { value: 'concrete-rca', label: 'Concrete (RCA)' },
    { value: 'crusher-base', label: 'Crusher Base' }
  ].filter(subtype => availableSubtypes.includes(subtype.value));

  const renderSubtypeSelector = () => {
    let subtypes = [];
    
    switch (selectedCategory) {
      case 'sand':
        subtypes = getSandSubtypes();
        break;
      case 'dirt':
        subtypes = getDirtSubtypes();
        break;
      case 'base':
        subtypes = getBaseSubtypes();
        break;
      case 'gravel':
        // Only show subtype selector if there are available options
        if (availableSubtypes.length === 0) return null;
        
        return (
          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium">Type</label>
            <ToggleGroup
              type="single"
              value={selectedSubtype}
              onValueChange={(value) => setSelectedSubtype(value as MaterialSubtype)}
              className="justify-start gap-2"
            >
              {['crushed', 'round', 'natural', 'concrete'].filter(type => 
                availableSubtypes.includes(type)
              ).map((type) => (
                <ToggleGroupItem
                  key={type}
                  value={type}
                  className="flex-1 py-3 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                  disabled={!availableSubtypes.includes(type)}
                >
                  <span className="capitalize">{type.replace('-', ' ')}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        );
      default:
        return null;
    }

    if (subtypes.length === 0) return null;

    return (
      <div className="space-y-2 mt-4">
        <label className="text-sm font-medium">Type</label>
        <ToggleGroup
          type="single"
          value={selectedSubtype}
          onValueChange={(value) => setSelectedSubtype(value as MaterialSubtype)}
          className="justify-start gap-2 flex-wrap"
        >
          {subtypes.map(({ value, label }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="flex-1 py-3 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
            >
              <span className="capitalize">{label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
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
            return (
              <ToggleGroupItem
                key={category}
                value={category}
                className="flex-1 py-8 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon className="h-6 w-6" />
                  <span className="capitalize">{category}</span>
                </div>
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {selectedCategory === 'gravel' && availableUsages.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Usage</label>
          <ToggleGroup
            type="single"
            value={selectedUsage}
            onValueChange={(value) => setSelectedUsage(value as MaterialUsage)}
            className="justify-start gap-2"
          >
            {['driveway', 'walkway', 'general'].filter(usage => 
              availableUsages.includes(usage)
            ).map((usage) => (
              <ToggleGroupItem
                key={usage}
                value={usage}
                className="flex-1 py-3 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                disabled={!availableUsages.includes(usage)}
              >
                <span className="capitalize">{usage}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {availableSizes.length > 0 && (
            <div className="space-y-2 mt-4">
              <label className="text-sm font-medium">Size</label>
              <ToggleGroup
                type="single"
                value={selectedSize}
                onValueChange={(value) => setSelectedSize(value as MaterialSize)}
                className="justify-start gap-2"
              >
                {['3/8"', '3/4"', '1-1/2"'].filter(size => {
                  // Match normalized sizes (remove spaces)
                  const normalizedSize = size.replace(/\s+/g, '');
                  return availableSizes.some(s => s.replace(/\s+/g, '') === normalizedSize);
                }).map((size) => (
                  <ToggleGroupItem
                    key={size}
                    value={size}
                    className="flex-1 py-3 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                  >
                    {size}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          )}
        </div>
      )}

      {selectedCategory === 'mulch' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <ToggleGroup
            type="single"
            value={selectedColor}
            onValueChange={(value) => setSelectedColor(value as MaterialColor)}
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

      {selectedCategory && renderSubtypeSelector()}

      {filteredProducts.length > 0 ? (
        <div className="space-y-3 border rounded-lg p-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Available Products</h3>
            <Badge variant="outline">{filteredProducts.length} found</Badge>
          </div>
          <div className="grid gap-2">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => onProductSelect(product.id.toString())}
                className={cn(
                  "w-full p-4 text-left rounded-lg border transition-colors",
                  selectedProduct === product.id.toString()
                    ? "border-primary bg-primary/5"
                    : "hover:bg-gray-50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{product.name}</span>
                  <span className="text-sm font-medium text-primary">
                    ${product.price}/ton
                  </span>
                </div>
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
