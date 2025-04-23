
import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Product } from '../components/ProductCard';

// This would typically come from an API or CMS based on the slug
const getProductBySlug = (slug: string): Product | undefined => {
  const allProducts = [
    {
      id: 1,
      name: "River Rock Gravel",
      description: "Smooth, rounded stones perfect for landscaping",
      price: 45.99,
      image: "/placeholder.svg",
      category: "gravel"
    },
    {
      id: 2,
      name: "Fine Sand",
      description: "High-quality sand for construction and landscaping",
      price: 35.99,
      image: "/placeholder.svg",
      category: "sand"
    },
    {
      id: 3,
      name: "Premium Topsoil",
      description: "Rich, organic soil for gardening",
      price: 29.99,
      image: "/placeholder.svg",
      category: "dirt"
    },
  ];

  return allProducts.find(p => p.name.toLowerCase().replace(/\s+/g, '-') === slug);
};

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const product = slug ? getProductBySlug(slug) : undefined;

  const handleAddToCart = () => {
    if (product) {
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    }
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <Button asChild>
            <a href="/products">View All Products</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
          
          <div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <p className="text-2xl font-bold text-gray-900 mb-6">${product.price.toFixed(2)}/yard</p>
            <p className="text-gray-600 mb-8">{product.description}</p>
            
            <Button onClick={handleAddToCart} size="lg" className="w-full mb-6">
              Add to Cart
            </Button>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Delivery Information</h3>
                <p className="text-gray-600 text-sm">
                  Check availability in your area by entering your ZIP code on the homepage.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
