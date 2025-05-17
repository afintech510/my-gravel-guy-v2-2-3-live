
import React, { useState } from 'react';
import { Product } from '@/services/productTypes';
import { ImageOff } from 'lucide-react';

interface ProductImagesProps {
  product: Product;
}

const ProductImages = ({ product }: ProductImagesProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Use the default image if no image is provided
  const defaultImage = "/placeholder.svg";
  
  return (
    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
      {imageError ? (
        <div className="w-full h-full flex items-center justify-center">
          <ImageOff className="h-12 w-12 text-gray-400" />
        </div>
      ) : (
        <img 
          src={product?.image || defaultImage} 
          alt={product?.name} 
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
};

export default ProductImages;
