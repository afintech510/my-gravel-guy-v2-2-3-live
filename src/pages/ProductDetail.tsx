
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Product, getProductBySlug, getPriceAdjustmentForZipCode, applyZipCodeAdjustment } from '../services/productService';
import { useZipCode } from '../contexts/ZipCodeContext';
import { useCart } from '../contexts/CartContext';
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { zipCode } = useZipCode();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [adjustedPrice, setAdjustedPrice] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      
      try {
        setLoading(true);
        const fetchedProduct = await getProductBySlug(slug);
        setProduct(fetchedProduct);
        
        if (fetchedProduct && zipCode) {
          const adjustment = await getPriceAdjustmentForZipCode(zipCode);
          setAdjustedPrice(applyZipCodeAdjustment(fetchedProduct.price, adjustment));
        } else if (fetchedProduct) {
          setAdjustedPrice(fetchedProduct.price);
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadProduct();
  }, [slug, zipCode]);

  const handleAddToCart = () => {
    if (product) {
      // Add product with adjusted price if available
      addToCart({
        ...product,
        price: adjustedPrice !== undefined ? adjustedPrice : product.price
      });
      
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-lg" />
            <div>
              <Skeleton className="h-10 w-3/4 mb-4" />
              <Skeleton className="h-6 w-1/4 mb-6" />
              <Skeleton className="h-24 w-full mb-8" />
              <Skeleton className="h-12 w-full mb-6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  const productPrice = adjustedPrice !== undefined ? adjustedPrice : product.price;
  const priceAdjusted = adjustedPrice !== undefined && adjustedPrice !== product.price;

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
            <p className="text-2xl font-bold text-gray-900 mb-2">${productPrice.toFixed(2)}/yard</p>
            
            {priceAdjusted && zipCode && (
              <p className="text-sm mb-6">
                <span className={adjustedPrice > product.price ? "text-red-500" : "text-green-500"}>
                  {adjustedPrice > product.price ? "+" : "-"}
                  {Math.abs(((adjustedPrice - product.price) / product.price) * 100).toFixed(0)}%
                </span>
                {" "}price adjusted for ZIP {zipCode}
              </p>
            )}
            
            <p className="text-gray-600 mb-8">{product.description}</p>
            
            <Button onClick={handleAddToCart} size="lg" className="w-full mb-6">
              Add to Cart
            </Button>
            
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Delivery Information</h3>
                <p className="text-gray-600 text-sm">
                  {zipCode 
                    ? `Available for delivery to ZIP ${zipCode}.` 
                    : "Check availability in your area by entering your ZIP code on the homepage."}
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
