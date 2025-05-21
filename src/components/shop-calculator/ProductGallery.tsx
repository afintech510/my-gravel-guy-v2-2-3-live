
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';

type ProductGalleryProps = {
  images: string[];
  productName: string;
};

const ProductGallery: React.FC<ProductGalleryProps> = ({ images, productName }) => {
  const [selectedImage, setSelectedImage] = useState<number>(0);
  
  // Fallback images if no product images are available
  const fallbackImages = [
    'https://images.unsplash.com/photo-1523712999610-f77fbcfc3843',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b',
  ].map(url => `${url}?w=600&h=400&fit=crop&auto=format`);
  
  const displayImages = images && images.length > 0 ? images : fallbackImages;
  // Limit to maximum 3 images
  const limitedImages = displayImages.slice(0, 3);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-gray-200" style={{ height: '380px' }}>
        <img
          src={limitedImages[selectedImage]}
          alt={`${productName} - View ${selectedImage + 1}`}
          className="object-cover w-full h-full"
        />
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
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
