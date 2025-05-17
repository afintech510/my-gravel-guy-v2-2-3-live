
import React, { useState } from 'react';
import { Product } from '@/services/productTypes';
import { ImageOff } from 'lucide-react';

interface ProductImagesProps {
  product: Product;
}

// Helper function to handle image paths
const getCorrectImagePath = (path: string | undefined) => {
  if (!path) return "/placeholder.svg";
  
  // Handle /src/assets/ paths by removing the /src prefix
  if (path.startsWith('/src/assets/')) {
    return path.replace('/src/', '/');
  }
  
  return path;
};

const ProductImages = ({ product }: ProductImagesProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Use the default image if no image is provided
  const defaultImage = "/placeholder.svg";
  const correctedImagePath = getCorrectImagePath(product?.image);
  
  return (
    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
      {imageError ? (
        <div className="w-full h-full flex items-center justify-center">
          <ImageOff className="h-12 w-12 text-gray-400" />
        </div>
      ) : (
        <img 
          src={correctedImagePath || defaultImage} 
          alt={product?.name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            console.log(`Image failed to load for ${product?.name}:`, product?.image, "Tried path:", correctedImagePath);
            setImageError(true);
          }}
        />
      )}
    </div>
  );
};

export default ProductImages;
