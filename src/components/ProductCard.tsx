
import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from '../contexts/CartContext';
import { Link } from 'react-router-dom';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'gravel' | 'sand' | 'dirt';
}

const ProductCard = ({ product }: { product: Product }) => {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          <Link to={`/products/${product.name.toLowerCase().replace(/\s+/g, '-')}`}>
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
        <p className="text-gray-600 mb-2">{product.description}</p>
        <p className="text-xl font-bold">${product.price.toFixed(2)}/yard</p>
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
