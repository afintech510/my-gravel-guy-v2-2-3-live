
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
    <div className="space-y-3 mb-8">
      <label className="block text-base font-semibold text-gray-900">
        What material do you need?
      </label>
      <Select value={selectedProduct} onValueChange={onProductSelect}>
        <SelectTrigger className="w-full h-14 text-left bg-white border-2 border-gray-200 hover:border-primary transition-colors">
          <SelectValue placeholder="Choose your material" />
        </SelectTrigger>
        <SelectContent className="bg-white max-h-[400px]">
          {Object.entries(groupedProducts).map(([category, items]) => (
            <SelectGroup key={category}>
              <SelectLabel className="font-semibold capitalize px-2 py-1.5 text-sm bg-gray-50">
                {category}
              </SelectLabel>
              {items.map((product) => (
                <SelectItem
                  key={product.id}
                  value={product.id.toString()}
                  className="py-3 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-medium">{product.name}</span>
                    <span className={cn(
                      "ml-2 px-3 py-1 rounded-full text-sm",
                      "bg-primary/10 text-primary font-medium"
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
      <p className="text-sm text-gray-500">
        Select the material you need for your project. Prices are per ton.
      </p>
    </div>
  );
};

export default MaterialSelector;
