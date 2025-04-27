
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getProductBySlug, getPriceAdjustmentForZipCode, applyZipCodeAdjustment } from '../services/productService';
import { Product } from '../services/productTypes';
import { useZipCode } from '../contexts/ZipCodeContext';
import { useCart } from '../contexts/CartContext';
import { Skeleton } from "@/components/ui/skeleton";
import ZipCodeSearch from '@/components/ZipCodeSearch';
import { Button } from '@/components/ui/button';
import ProductImages from '@/components/products/ProductImages';
import ProductHeader from '@/components/products/ProductHeader';
import ProductActions from '@/components/products/ProductActions';
import ProductTabs from '@/components/products/ProductTabs';
import MiniCalculator from '@/components/products/MiniCalculator';

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

  const handleAddToCart = (productToAdd: Product & { quantity: number, deliveryDate: Date }) => {
    addToCart(productToAdd);
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart for delivery on ${productToAdd.deliveryDate.toLocaleDateString()}.`,
    });
  };

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <ProductImages product={product} />
          
          <div className="space-y-8">
            <ProductHeader 
              product={product}
              adjustedPrice={adjustedPrice ?? product.price}
              zipCode={zipCode}
            />

            {!zipCode && (
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Check Delivery Availability</h3>
                  <ZipCodeSearch />
                </CardContent>
              </Card>
            )}

            <ProductActions 
              product={product}
              adjustedPrice={adjustedPrice ?? product.price}
              onAddToCart={handleAddToCart}
            />

            <MiniCalculator
              pricePerTon={adjustedPrice ?? product.price}
              onQuantityCalculated={(tons) => console.log(tons)}
            />
          </div>
        </div>

        <ProductTabs product={product} />
      </div>
    </div>
  );
};

export default ProductDetail;
