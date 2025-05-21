
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from 'react-router-dom';
import { useZipCode } from '../contexts/ZipCodeContext';
import { Product } from '../services/productTypes';
import { ImageOff, Columns3, Cog } from 'lucide-react';

// Default product image
const DEFAULT_PRODUCT_IMAGE = '/lovable-uploads/85eef0fe-9a59-406e-ba6b-54e1aaf6f56b.png';

const ProductCard = ({ product }: { product: Product }) => {
  const { zipCode } = useZipCode();
  const [imageError, setImageError] = useState(false);
  
  // Use the image path directly from the product data
  const imagePath = product.image || DEFAULT_PRODUCT_IMAGE;

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
        <p className="text-gray-600 mb-2 line-clamp-3 text-sm">{product.description}</p>
      </CardContent>
      <CardFooter className="pt-2">
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
