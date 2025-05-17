
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { useZipCode } from '../contexts/ZipCodeContext';
import { getPriceAdjustmentForZipCode } from '../services/productService';
import { Product } from '../services/productTypes';
import { ImageOff } from 'lucide-react';

// Helper function to handle image paths
const getCorrectImagePath = (path: string | undefined, productName: string | undefined) => {
  if (!path) return "/placeholder.svg";
  
  // Special case for River Rock products
  if (productName && productName.toLowerCase().includes('river rock')) {
    return "/assets/river-rocks.png";
  }
  
  // Special case for Crushed Stone products
  if (productName && productName.toLowerCase().includes('crushed stone')) {
    return "/assets/crushed-stone.png";
  }
  
  // Handle /src/assets/ paths by removing the /src prefix
  if (path.startsWith('/src/assets/')) {
    return path.replace('/src/', '/');
  }
  
  return path;
};

const ProductCard = ({ product }: { product: Product }) => {
  const { zipCode } = useZipCode();
  const [imageError, setImageError] = useState(false);
  
  const defaultImage = "/placeholder.svg";
  const correctedImagePath = getCorrectImagePath(product.image, product.name);

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
                src={correctedImagePath}
                alt={product.name}
                className="object-cover w-full h-full rounded-md"
                onError={(e) => {
                  console.log(`Image failed to load for ${product.name}:`, product.image, "Tried path:", correctedImagePath);
                  setImageError(true);
                }}
              />
            )}
          </Link>
        </div>
        <p className="text-gray-600 mb-2 line-clamp-3 text-sm">{product.description}</p>
      </CardContent>
      <CardFooter className="pt-2">
        <Button asChild className="w-full">
          <Link to={`/products/${encodeURIComponent(product.slug)}`}>
            View Details
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
