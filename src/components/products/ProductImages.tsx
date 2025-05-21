import React, { useState } from 'react';
import { Product } from '@/services/productTypes';
import { ImageOff } from 'lucide-react';
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
  
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-lg border border-gray-200" style={{ height: '380px' }}>
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <ImageOff className="h-12 w-12 text-gray-400" />
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
              className={`cursor-pointer rounded-md overflow-hidden border-2 h-12 w-12 flex-shrink-0 transition-all ${
                selectedImage === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img 
                src={image} 
                alt={`${product?.name} thumbnail ${index + 1}`} 
                className="object-cover w-full h-full"
                onError={(e) => {
                  console.log(`Thumbnail failed to load for ${product?.name}:`, image);
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

export default ProductImages;
