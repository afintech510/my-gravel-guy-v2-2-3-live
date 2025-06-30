
import React, { useState } from 'react';
import { Product } from '@/services/productTypes';
import { ImageOff, Play } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

// Default product image
const DEFAULT_PRODUCT_IMAGE = '/lovable-uploads/85eef0fe-9a59-406e-ba6b-54e1aaf6f56b.png';

interface ProductImagesProps {
  product: Product;
}

const ProductImages = ({ product }: ProductImagesProps) => {
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [imageError, setImageError] = useState(false);
  
  // Get product images directly from the product.images array
  const getProductImages = (): string[] => {
    // If images array exists and has entries, use it
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      console.log(`ProductImages: Using images array for ${product.name}:`, product.images);
      return product.images;
    }
    
    // Otherwise fall back to the single image or default
    console.log(`ProductImages: No images array for ${product.name}, falling back to default`);
    return [DEFAULT_PRODUCT_IMAGE];
  };
  
  const images = getProductImages();
  console.log('ProductImages - Images to display:', images);
  
  // Check if a file is a video
  const isVideo = (url: string): boolean => {
    return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().includes('.mp4');
  };
  
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-gray-200">
        <AspectRatio ratio={1} className="bg-gray-100">
          {imageError ? (
            <div className="w-full h-full flex items-center justify-center">
              <ImageOff className="h-12 w-12 text-gray-400" />
            </div>
          ) : isVideo(images[selectedImage]) ? (
            <div className="relative w-full h-full">
              <video
                src={images[selectedImage]}
                className="object-cover w-full h-full"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
                style={{
                  animation: 'bounce 2s infinite'
                }}
                onError={() => {
                  console.log(`Video failed to load for ${product?.name}:`, images[selectedImage]);
                  setImageError(true);
                }}
              >
                Your browser does not support the video tag.
              </video>
              <style jsx>{`
                @keyframes bounce {
                  0%, 20%, 50%, 80%, 100% {
                    transform: translateY(0);
                  }
                  40% {
                    transform: translateY(-10px);
                  }
                  60% {
                    transform: translateY(-5px);
                  }
                }
              `}</style>
            </div>
          ) : (
            <img
              src={images[selectedImage]}
              alt={`${product?.name} - View ${selectedImage + 1}`}
              className="object-cover w-full h-full"
              onError={() => {
                console.log(`Image failed to load for ${product?.name}:`, images[selectedImage]);
                setImageError(true);
              }}
            />
          )}
        </AspectRatio>
      </div>
      
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-auto pb-1">
          {images.map((image, index) => (
            <div 
              key={index}
              onClick={() => {
                setSelectedImage(index);
                setImageError(false); // Reset error state when changing images
              }}
              className={`cursor-pointer rounded-md overflow-hidden border-2 h-12 w-12 flex-shrink-0 transition-all relative ${
                selectedImage === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              {isVideo(image) ? (
                <div className="relative w-full h-full bg-black flex items-center justify-center">
                  <video 
                    src={image} 
                    className="object-cover w-full h-full"
                    preload="metadata"
                    muted
                    onError={(e) => {
                      console.log(`Video thumbnail failed to load for ${product?.name}:`, image);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <Play className="absolute inset-0 m-auto h-3 w-3 text-white opacity-80" />
                </div>
              ) : (
                <img 
                  src={image} 
                  alt={`${product?.name} thumbnail ${index + 1}`} 
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    console.log(`Thumbnail failed to load for ${product?.name}:`, image);
                    e.currentTarget.src = DEFAULT_PRODUCT_IMAGE;
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImages;
