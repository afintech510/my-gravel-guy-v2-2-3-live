
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { useZipCode } from '../contexts/ZipCodeContext';
import { Product } from '../services/productTypes';
import { ImageOff, Columns3, ExternalLink } from 'lucide-react';
import { useProduct } from '../hooks/useProduct';

// Default product image
const DEFAULT_PRODUCT_IMAGE = '/lovable-uploads/85eef0fe-9a59-406e-ba6b-54e1aaf6f56b.png';

const ProductCard = ({ product }: { product: Product }) => {
  const { zipCode } = useZipCode();
  const [imageError, setImageError] = useState(false);
  
  // Get pricing for display
  const { adjustedPrice } = useProduct(product.slug, zipCode, 1);
  const displayPrice = adjustedPrice ?? product.price;
  
  // Get the image to display - use first image from images array if available
  const determineImagePath = () => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      console.log(`ProductCard: Using first image from images array for ${product.name}:`, product.images[0]);
      return product.images[0];
    }
    
    console.log(`ProductCard: No images array for ${product.name}, falling back to default`);
    return DEFAULT_PRODUCT_IMAGE;
  };
  
  const imagePath = determineImagePath();

  return (
    <Card className="w-full max-w-sm h-full flex flex-col transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">
          <Link to={`/products/${encodeURIComponent(product.slug)}`} className="hover:text-primary transition-colors">
            {product.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="aspect-square relative mb-4">
          <Link to={`/products/${encodeURIComponent(product.slug)}`}>
            {imageError ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
                <ImageOff className="h-12 w-12 text-gray-400" />
              </div>
            ) : (
              <img
                src={imagePath}
                alt={product.name}
                className="object-cover w-full h-full rounded-md"
                onError={(e) => {
                  console.log(`Image failed to load for ${product.name}:`, imagePath);
                  setImageError(true);
                }}
              />
            )}
          </Link>
        </div>
        <p className="text-gray-600 mb-2 line-clamp-3 text-sm">
          {product.short_description || product.description}
        </p>
        <div className="mt-auto">
          <div className="text-center mb-2">
            <span className="text-xl font-bold text-primary">
              ${displayPrice.toFixed(2)}
            </span>
            <span className="text-sm text-gray-500 ml-1">per ton</span>
          </div>
          <div className="text-sm text-gray-600 font-medium text-center">
            FREE Delivery
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-2 flex flex-col gap-2">
        <Button 
          asChild 
          variant="outline" 
          className="w-full border-green-500 text-green-700 bg-gray-50 hover:bg-green-50"
        >
          <Link to={`/products/${encodeURIComponent(product.slug)}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            More Details
          </Link>
        </Button>
        <Button asChild className="w-full">
          <Link to={`/products/${encodeURIComponent(product.slug)}`}>
            Shop <Columns3 className="ml-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
