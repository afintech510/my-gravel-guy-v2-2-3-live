
import React from 'react';
import { Product } from '@/services/productTypes';

interface ProductHeaderProps {
  product: Product;
  adjustedPrice: number;
  zipCode?: string;
}

const ProductHeader = ({ product, adjustedPrice, zipCode }: ProductHeaderProps) => {
  return (
    <div>
      <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
      <p className="text-2xl font-bold text-gray-900 mb-2">
        ${adjustedPrice.toFixed(2)}/ton
      </p>
      
      {adjustedPrice !== product.price && zipCode && (
        <p className="text-sm mb-6">
          <span className={adjustedPrice > product.price ? "text-red-500" : "text-green-500"}>
            {adjustedPrice > product.price ? "+" : "-"}
            {Math.abs(((adjustedPrice - product.price) / product.price) * 100).toFixed(0)}%
          </span>
          {" "}price adjusted for ZIP {zipCode}
        </p>
      )}
    </div>
  );
};

export default ProductHeader;
