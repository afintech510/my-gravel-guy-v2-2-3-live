
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useZipCode } from '../contexts/ZipCodeContext';
import { useCart } from '../contexts/CartContext';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '@/components/ui/button';
import ZipCodeSearch from '@/components/zip-code/ZipCodeSearch';
import ProductImages from '@/components/products/ProductImages';
import ProductHeader from '@/components/products/ProductHeader';
import ProductActions from '@/components/products/ProductActions';
import ProductTabs from '@/components/products/ProductTabs';
import MiniCalculator from '@/components/products/MiniCalculator';
import TrustBanner from '@/components/products/trust/TrustBanner';
import { useProduct } from '@/hooks/useProduct';
import { Product } from '@/services/productTypes';
import { trackEcommerce, trackEvent } from '@/utils/analytics';
import QuoteFormProduct from '@/components/forms/QuoteFormProduct';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { zipCode } = useZipCode();
  const { addToCart } = useCart();
  
  const { product, adjustedPrice, loading, error } = useProduct(slug, zipCode);
  
  // State for selected tons from mini calculator
  const [calculatedTons, setCalculatedTons] = useState<number | null>(null);

  // Track product view when product data is loaded
  useEffect(() => {
    if (product) {
      // Track view_item event for Google Analytics
      trackEcommerce('view_item', [
        {
          item_id: product.id,
          item_name: product.name,
          price: adjustedPrice ?? product.price,
          item_category: product.category
        }
      ]);
    }
  }, [product, adjustedPrice]);

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

  if (error || !product) {
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

  const handleAddToCart = (productToAdd: Product & { tons: number, deliveryDate: Date }) => {
    addToCart(productToAdd);
    
    // Track add_to_cart event
    trackEcommerce('add_to_cart', [
      {
        item_id: productToAdd.id,
        item_name: productToAdd.name,
        price: adjustedPrice ?? productToAdd.price,
        quantity: productToAdd.tons,
        item_category: productToAdd.category
      }
    ], productToAdd.tons * (adjustedPrice ?? productToAdd.price));
    
    // Show toast notification
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart for delivery on ${productToAdd.deliveryDate.toLocaleDateString()}.`,
    });
  };

  // Handle quantity from calculator
  const handleQuantityCalculated = (tons: number) => {
    // Update the selected tons
    setCalculatedTons(tons);
    
    // Show toast notification
    toast({
      title: "Amount updated",
      description: `${tons} tons has been set as your selected amount.`,
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
              initialTons={calculatedTons ?? undefined}
            />

            <MiniCalculator
              pricePerTon={adjustedPrice ?? product.price}
              onQuantityCalculated={handleQuantityCalculated}
            />
          </div>
        </div>

        <ProductTabs product={product} />
        
        {/* Quote Form Component Above Trust Banner */}
        <div className="mt-16">
          <QuoteFormProduct product={product} />
        </div>
        
        <TrustBanner 
          badgeSize="normal"
          title="Why Choose My Gravel Guy" 
          className="mb-12"
        />
      </div>
    </div>
  );
};

export default ProductDetail;
