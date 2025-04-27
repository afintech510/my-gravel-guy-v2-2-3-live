
import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '../../services/productTypes';
import { cn } from '@/lib/utils';

interface MaterialSelectorProps {
  products: Product[];
  selectedProduct: string;
  onProductSelect: (value: string) => void;
}

const MaterialSelector = ({ products, selectedProduct, onProductSelect }: MaterialSelectorProps) => {
  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Select Material</label>
      <Select value={selectedProduct} onValueChange={onProductSelect}>
        <SelectTrigger className="w-full h-12 text-left bg-white">
          <SelectValue placeholder="Choose your material" />
        </SelectTrigger>
        <SelectContent className="bg-white">
          {Object.entries(groupedProducts).map(([category, items]) => (
            <SelectGroup key={category}>
              <SelectLabel className="font-semibold capitalize">
                {category}
              </SelectLabel>
              {items.map((product) => (
                <SelectItem
                  key={product.id}
                  value={product.id.toString()}
                  className="py-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <span>{product.name}</span>
                    <span className={cn(
                      "ml-2 px-2 py-1 rounded text-sm",
                      "bg-gray-100 text-gray-700"
                    )}>
                      ${product.price}/ton
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MaterialSelector;
