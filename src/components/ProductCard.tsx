import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';
import { useZipCode } from '../contexts/ZipCodeContext';
import { Product, getPriceAdjustmentForZipCode, applyZipCodeAdjustment } from '../services/productService';

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const { zipCode } = useZipCode();
  const { toast } = useToast();
  const [adjustedPrice, setAdjustedPrice] = useState(product.price);
  
  useEffect(() => {
    async function updatePrice() {
      if (zipCode) {
        const adjustment = await getPriceAdjustmentForZipCode(zipCode);
        setAdjustedPrice(applyZipCodeAdjustment(product.price, adjustment));
      } else {
        setAdjustedPrice(product.price);
      }
    }
    
    updatePrice();
  }, [product.price, zipCode]);

  const handleAddToCart = () => {
    addToCart({
      ...product,
      price: adjustedPrice,
      quantity: 3
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          <Link to={`/products/${product.slug}`}>
            {product.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-square relative mb-4">
          <img
            src={product.image}
            alt={product.name}
            className="object-cover w-full h-full rounded-md"
          />
        </div>
        <p className="text-gray-600 mb-2 line-clamp-2">{product.description}</p>
        <p className="text-xl font-bold">${adjustedPrice.toFixed(2)} • ton</p>
        {zipCode && product.price !== adjustedPrice && (
          <p className="text-sm text-gray-500">
            <span className={adjustedPrice > product.price ? "text-red-500" : "text-green-500"}>
              {adjustedPrice > product.price ? "+" : "-"}
              {Math.abs(((adjustedPrice - product.price) / product.price) * 100).toFixed(0)}%
            </span>
            {" "}adjusted for ZIP {zipCode}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleAddToCart} className="w-full">
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
