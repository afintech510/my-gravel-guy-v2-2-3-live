
import React from 'react';
import { Product } from '@/services/productTypes';

interface ProductImagesProps {
  product: Product;
}

const ProductImages = ({ product }: ProductImagesProps) => {
  return (
    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
      <img 
        src={product?.image} 
        alt={product?.name} 
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default ProductImages;
