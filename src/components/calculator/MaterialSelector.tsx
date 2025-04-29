import React, { useState } from 'react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Product, MaterialCategory, MaterialUsage, MaterialSubtype, MaterialSize, MaterialColor } from '@/services/productTypes';
import { cn } from '@/lib/utils';
import { Package, BrickWall, Leaf, TreeDeciduous, Hammer } from 'lucide-react';

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
  const [selectedUsage, setSelectedUsage] = useState<MaterialUsage>('general');
  const [selectedSubtype, setSelectedSubtype] = useState<MaterialSubtype | ''>('');
  const [selectedSize, setSelectedSize] = useState<MaterialSize | ''>('');
  const [selectedColor, setSelectedColor] = useState<MaterialColor | ''>('');

  const filteredProducts = products.filter(product => {
    if (product.category !== selectedCategory) return false;
    if (product.usage && product.usage !== selectedUsage) return false;
    if (product.subtype && selectedSubtype && product.subtype !== selectedSubtype) return false;
    if (product.size && selectedSize && product.size !== selectedSize) return false;
    if (product.color && selectedColor && product.color !== selectedColor) return false;
    return true;
  });

  const handleCategorySelect = (value: string) => {
    setSelectedCategory(value as MaterialCategory);
    setSelectedUsage('general');
    setSelectedSubtype('');
    setSelectedSize('');
    setSelectedColor('');
  };

  const getSandSubtypes = () => [
    { value: 'mason-sand', label: 'Mason Sand' },
    { value: 'playground-sand', label: 'Playground Sand' },
    { value: 'beach-sand', label: 'Beach Sand' },
    { value: 'washed-sand', label: 'Washed Sand' }
  ];

  const getDirtSubtypes = () => [
    { value: 'top-soil', label: 'Topsoil' },
    { value: 'compost', label: 'Compost' },
    { value: 'fill-dirt', label: 'Fill Dirt' },
    { value: 'loam', label: 'Loam' },
    { value: 'sandy-loam', label: 'Sandy Loam' }
  ];

  const getBaseSubtypes = () => [
    { value: 'road-base', label: 'Road Base' },
    { value: 'concrete-rca', label: 'Concrete (RCA)' },
    { value: 'crusher-base', label: 'Crusher Base' }
  ];

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
        return (
          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium">Type</label>
            <ToggleGroup
              type="single"
              value={selectedSubtype}
              onValueChange={(value) => setSelectedSubtype(value as MaterialSubtype)}
              className="justify-start gap-2"
            >
              {['crushed', 'round', 'natural', 'concrete'].map((type) => (
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
        );
      default:
        return null;
    }

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

      {selectedCategory === 'gravel' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Usage</label>
          <ToggleGroup
            type="single"
            value={selectedUsage}
            onValueChange={(value) => setSelectedUsage(value as MaterialUsage)}
            className="justify-start gap-2"
          >
            {['driveway', 'walkway', 'general'].map((usage) => (
              <ToggleGroupItem
                key={usage}
                value={usage}
                className="flex-1 py-3 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
              >
                <span className="capitalize">{usage}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium">Size</label>
            <ToggleGroup
              type="single"
              value={selectedSize}
              onValueChange={(value) => setSelectedSize(value as MaterialSize)}
              className="justify-start gap-2"
            >
              {['3/8"', '3/4"', '1-1/2"'].map((size) => (
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
            {['chocolate', 'jet-black', 'red', 'natural-dark', 'wood-chips'].map((color) => (
              <ToggleGroupItem
                key={color}
                value={color}
                className="flex-1 py-3 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
              >
                <span className="capitalize">{color.replace('-', ' ')}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      )}

      {selectedCategory && renderSubtypeSelector()}

      {filteredProducts.length > 0 && (
        <div className="space-y-3 border rounded-lg p-4">
          <h3 className="font-medium">Available Products</h3>
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
      )}
    </div>
  );
};

export default MaterialSelector;
