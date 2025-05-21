
import React, { useState } from 'react';
import { Product } from '@/services/productTypes';
import { ImageOff } from 'lucide-react';

// Default product image
const DEFAULT_PRODUCT_IMAGE = '/assets/river-rocks.png';

interface ProductImagesProps {
  product: Product;
}

const ProductImages = ({ product }: ProductImagesProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Use the image path directly from the product data
  const imagePath = product?.image || DEFAULT_PRODUCT_IMAGE;
  
  return (
    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
      {imageError ? (
        <div className="w-full h-full flex items-center justify-center">
          <ImageOff className="h-12 w-12 text-gray-400" />
        </div>
      ) : (
        <img 
          src={imagePath} 
          alt={product?.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log(`Image failed to load for ${product?.name}:`, imagePath);
            setImageError(true);
          }}
        />
      )}
    </div>
  );
};

export default ProductImages;
