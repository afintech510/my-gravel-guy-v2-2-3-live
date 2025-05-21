
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ImageOff } from 'lucide-react';

// Default product image
const DEFAULT_PRODUCT_IMAGE = '/lovable-uploads/85eef0fe-9a59-406e-ba6b-54e1aaf6f56b.png';

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productName }) => {
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [imageError, setImageError] = useState<boolean[]>([]);
  
  // Handle special case for crushed stone
  const processImages = () => {
    if (productName.toLowerCase().includes('crushed stone')) {
      return ['/lovable-uploads/85eef0fe-9a59-406e-ba6b-54e1aaf6f56b.png'];
    }
    
    // Fallback images if no product images are available
    if (!images || !Array.isArray(images) || images.length === 0) {
      return [DEFAULT_PRODUCT_IMAGE];
    }
    
    return images;
  };
  
  const processedImages = processImages();
  // Limit to maximum 3 images
  const limitedImages = processedImages.slice(0, 3);
  
  const handleImageError = (index: number) => {
    console.log(`Gallery image failed to load at index ${index}:`, limitedImages[index]);
    const newImageError = [...imageError];
    newImageError[index] = true;
    setImageError(newImageError);
  };

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-gray-200" style={{ height: '380px' }}>
        {imageError[selectedImage] ? (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="h-12 w-12 text-gray-400" />
          </div>
        ) : (
          <img
            src={limitedImages[selectedImage]}
            alt={`${productName} - View ${selectedImage + 1}`}
            className="object-cover w-full h-full"
            onError={() => handleImageError(selectedImage)}
          />
        )}
      </div>
      
      {limitedImages.length > 1 && (
        <div className="flex space-x-2 overflow-auto pb-1">
          {limitedImages.map((image, index) => (
            <div 
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "cursor-pointer rounded-md overflow-hidden border-2 h-12 w-12 flex-shrink-0 transition-all",
                selectedImage === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img 
                src={image} 
                alt={`${productName} thumbnail ${index + 1}`} 
                className="object-cover w-full h-full"
                onError={() => handleImageError(index)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
