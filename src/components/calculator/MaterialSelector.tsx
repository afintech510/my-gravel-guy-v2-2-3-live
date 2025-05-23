
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product } from '@/services/productTypes';

interface MaterialSelectorProps {
  products: Product[];
  selectedProduct: string;
  onProductSelect: (productId: string) => void;
}

const MaterialSelector = ({ products, selectedProduct, onProductSelect }: MaterialSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select Material</label>
      <Select value={selectedProduct} onValueChange={onProductSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Choose a material" />
        </SelectTrigger>
        <SelectContent>
          {products.map((product) => (
            <SelectItem key={product.id} value={product.id.toString()}>
              {product.name} - ${product.price}/ton
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MaterialSelector;
