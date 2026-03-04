
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
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
import ProductTrustModule from '@/components/products/ProductTrustModule';
import PaymentMethodLogos from '@/components/payment/PaymentMethodLogos';
import TrustBanner from '@/components/products/trust/TrustBanner';
import { useProduct } from '@/hooks/useProduct';
import { Product } from '@/services/productTypes';
import { trackEcommerce, trackEvent } from '@/utils/analytics';
import QuoteFormProduct from '@/components/forms/QuoteFormProduct';
import SecurePay from '@/components/products/SecurePay';
import ProductReviews from '@/components/products/ProductReviews';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { zipCode } = useZipCode();
  const { addToCart } = useCart();
  
  // State for selected tons - start with 3 as default
  const [currentTons, setCurrentTons] = useState<number>(3);
  
  // Use our enhanced useProduct hook with tons parameter
  const { product, adjustedPrice, priceDetails, loading, error } = useProduct(
    slug, 
    zipCode, 
    currentTons // Use the current tons for pricing
  );

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

  // Simple handler for direct quantity changes from the product actions component
  const handleProductQuantityChange = (tons: number) => {
    console.log('Product quantity changed to:', tons);
    setCurrentTons(tons);
  };

  // Handler for when the calculator suggests a quantity
  const handleCalculatorQuantity = (tons: number) => {
    console.log('Calculator suggested quantity:', tons);
    setCurrentTons(tons);
    
    // Show toast notification
    /*toast({
      title: "Amount updated",
      description: `${tons} tons has been set as your selected amount.`,
    });*/
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-16 px-4">
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
      <div className="min-h-screen bg-background py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-4">The product you're looking for doesn't exist.</p>
          <Button asChild>
            <a href="/products">View All Products</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{product.name} - Buy Online | My Gravel Guy</title>
        <meta name="description" content={`Order ${product.name} online. ${product.short_description || product.description?.slice(0, 120) || 'Premium quality bulk materials delivered to your door.'}`.slice(0, 160)} />
        <link rel="canonical" href={`https://mygravelguy.com/products/${product.slug}`} />
        <meta property="og:title" content={`${product.name} - My Gravel Guy`} />
        <meta property="og:description" content={product.short_description || product.description?.slice(0, 160) || ''} />
        <meta property="og:url" content={`https://mygravelguy.com/products/${product.slug}`} />
        <meta property="og:type" content="product" />
        {product.images?.[0] && <meta property="og:image" content={product.images[0]} />}
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Product",
          "name": product.name,
          "description": product.short_description || product.description,
          "image": product.images || [],
          "url": `https://mygravelguy.com/products/${product.slug}`,
          "category": product.category,
          "sku": product.id,
          "brand": {
            "@type": "Brand",
            "name": "My Gravel Guy"
          },
          "offers": {
            "@type": "Offer",
            "price": adjustedPrice ?? product.price,
            "priceCurrency": "USD",
            "priceValidUntil": `${new Date().getFullYear()}-12-31`,
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": adjustedPrice ?? product.price,
              "priceCurrency": "USD",
              "unitText": "ton"
            },
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "My Gravel Guy"
            },
            "shippingDetails": {
              "@type": "OfferShippingDetails",
              "shippingRate": {
                "@type": "MonetaryAmount",
                "value": "0",
                "currency": "USD"
              },
              "shippingDestination": {
                "@type": "DefinedRegion",
                "addressCountry": "US"
              },
              "deliveryTime": {
                "@type": "ShippingDeliveryTime",
                "handlingTime": {
                  "@type": "QuantitativeValue",
                  "minValue": 1,
                  "maxValue": 2,
                  "unitCode": "DAY"
                },
                "transitTime": {
                  "@type": "QuantitativeValue",
                  "minValue": 1,
                  "maxValue": 3,
                  "unitCode": "DAY"
                }
              }
            },
            "hasMerchantReturnPolicy": {
              "@type": "MerchantReturnPolicy",
              "applicableCountry": "US",
              "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted",
              "merchantReturnDays": 0
            }
          }
        })}</script>
      </Helmet>
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Images and Tabs on Desktop */}
          <div className="space-y-8">
            <ProductImages product={product} />
            
            {/* Product Tabs - Only show on desktop in this column */}
            <div className="hidden lg:block">
              <ProductTabs product={product} />
            </div>
          </div>
          
          {/* Right Column - Product Info and Actions */}
          <div className="space-y-8">
            <ProductHeader 
              product={product}
              adjustedPrice={adjustedPrice ?? product.price}
              zipCode={zipCode}
            />

            {!zipCode && (
              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Check Delivery Availability</h3>
                  <ZipCodeSearch />
                </CardContent>
              </Card>
            )}

            <ProductActions 
              product={product}
              adjustedPrice={adjustedPrice ?? product.price}
              priceDetails={priceDetails}
              onQuantityChange={handleProductQuantityChange}
              selectedTons={currentTons}
            />

            {/* Trust Module - positioned under Add to Cart button, above SecurePay */}
            <ProductTrustModule />

            {/* SecurePay Module - positioned under trust module */}
            <SecurePay /> 

            {/* Keep mini calculator separate */}
            <MiniCalculator
              pricePerTon={adjustedPrice ?? product.price}
              onQuantityCalculated={handleCalculatorQuantity}
              tonYardRatio={product?.tonYardRatio}
            />

            {/* Product Reviews - positioned under calculator */}
            <ProductReviews 
              productId="all-products" 
              productName="All Products"
            />
          </div>
        </div>

        {/* Product Tabs - Show on mobile/tablet below the grid */}
        <div className="lg:hidden mt-16">
          <ProductTabs product={product} />
        </div>
        
        {/* Quote Form Component Above Trust Banner */}
        <div className="mt-16">
          <QuoteFormProduct selectedProduct={product} />
        </div>
        
        <TrustBanner 
          badgeSize="normal"
          title="Why Choose My Gravel Guy" 
          className="mb-12"
        />
      </div>
    </div>
    </>
  );
};

export default ProductDetail;
