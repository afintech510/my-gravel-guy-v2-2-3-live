
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { ImageOff } from 'lucide-react';

// Default product image
const DEFAULT_PRODUCT_IMAGE = '/lovable-uploads/85eef0fe-9a59-406e-ba6b-54e1aaf6f56b.png';

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productName }) => {
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [imageError, setImageError] = useState(false);
  
  // Fallback images if no product images are available
  const fallbackImages = [
    DEFAULT_PRODUCT_IMAGE,
    DEFAULT_PRODUCT_IMAGE,
    DEFAULT_PRODUCT_IMAGE,
  ];
  
  const displayImages = images && images.length > 0 ? images : fallbackImages;
  // Limit to maximum 3 images
  const limitedImages = displayImages.slice(0, 3);
  
  console.log('ProductGallery - images received:', images);
  console.log('ProductGallery - using images:', limitedImages);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-gray-200">
        <AspectRatio ratio={1} className="bg-gray-100">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="h-12 w-12 text-gray-400" />
            </div>
          ) : (
            <img
              src={limitedImages[selectedImage]}
              alt={`${productName} - View ${selectedImage + 1}`}
              loading="lazy"
              className="object-cover w-full h-full"
              onError={() => {
                console.log(`Image failed to load for ${productName}:`, limitedImages[selectedImage]);
                setImageError(true);
              }}
            />
          )}
        </AspectRatio>
      </div>
      
      {limitedImages.length > 1 && (
        <div className="flex space-x-2 overflow-auto pb-1">
          {limitedImages.map((image, index) => (
            <div 
              key={index}
              onClick={() => {
                setSelectedImage(index);
                setImageError(false); // Reset error state when changing images
              }}
              className={cn(
                "cursor-pointer rounded-md overflow-hidden border-2 h-12 w-12 flex-shrink-0 transition-all",
                selectedImage === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              )}
            >
              <img 
                src={image} 
                alt={`${productName} thumbnail ${index + 1}`} 
                className="object-cover w-full h-full"
                onError={(e) => {
                  console.log(`Thumbnail failed to load for ${productName}:`, image);
                  e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
