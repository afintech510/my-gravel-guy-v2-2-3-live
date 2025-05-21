
import React from 'react';
import { Product } from '@/services/productTypes';

interface ProductHeaderProps {
  product: Product;
  adjustedPrice: number;
  zipCode?: string;
}

const ProductHeader = ({ product, zipCode }: ProductHeaderProps) => {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
      
      {/* Removed price per ton display here */}
      
      {zipCode && (
        <p className="text-sm mb-6">
          Delivery available to ZIP {zipCode}
          <b>3 ton Minimum Order</b>
        </p>
      )}
    </div>
  );
};

export default ProductHeader;
