
import React, { useState } from 'react';
import { Product } from '@/services/productTypes';
import { cn } from '@/lib/utils';

interface ProductDetailsProps {
  product: Product;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Use the product images array, fallback to single image if necessary
  const images = product.images && product.images.length > 0 
    ? product.images 
    : [product.image];
    
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">{product.name}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        {/* Image Gallery */}
        <div>
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
            <img 
              src={images[activeImageIndex]} 
              alt={product.name} 
              className="w-full h-full object-cover" 
            />
          </div>
          
          {images.length > 1 && (
            <div className="flex overflow-x-auto gap-2 py-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setActiveImageIndex(index)}
                  className={cn(
                    "w-16 h-16 rounded-md flex-shrink-0 overflow-hidden",
                    activeImageIndex === index ? "ring-2 ring-primary" : ""
                  )}
                >
                  <img 
                    src={image} 
                    alt={`${product.name} - image ${index + 1}`}
                    className="w-full h-full object-cover" 
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Product Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-medium mb-1">Description</h3>
            <p className="text-sm text-gray-700">{product.description}</p>
          </div>

          
          <div className="grid grid-cols-2 gap-4">
            {/* Remove price
            <div>
              <h3 className="text-xs font-medium text-gray-500">Price</h3>
              <p className="text-lg font-semibold text-primary">
                ${product.price.toFixed(2)}<span className="text-sm text-gray-500">/ton</span>
              </p>
            </div>
            */}
            
            {product.specifications?.size && (
              <div>
                <h3 className="text-xs font-medium text-gray-500">Size</h3>
                <p className="font-medium">{product.specifications.size}</p>
              </div>
            )}
          </div>
          
          {/* Specifications */}
          {product.specifications && (
            <div>
              <h3 className="text-base font-medium mb-2">Specifications</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {product.specifications.color && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Color:</span>
                    <span>{product.specifications.color}</span>
                  </div>
                )}
                
                {product.specifications.density && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Density:</span>
                    <span>{product.specifications.density}</span>
                  </div>
                )}
                
                {product.specifications.coverage && (
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">Coverage:</span>
                    <span>{product.specifications.coverage}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Conversion:</span>
                  <span>{product.tonYardRatio} tons per cubic yard</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Uses */}
          {product.uses && product.uses.length > 0 && (
            <div>
              <h3 className="text-base font-medium mb-2">Common Uses</h3>
              <div className="flex flex-wrap gap-2">
                {product.uses.map((use, index) => (
                  <span 
                    key={index} 
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {use}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
