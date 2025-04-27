import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Product, getProductBySlug, getPriceAdjustmentForZipCode, applyZipCodeAdjustment } from '../services/productService';
import { useZipCode } from '../contexts/ZipCodeContext';
import { useCart } from '../contexts/CartContext';
import { Skeleton } from "@/components/ui/skeleton";
import TonSelector from '@/components/products/TonSelector';
import DeliveryDatePicker from '@/components/products/DeliveryDatePicker';
import MiniCalculator from '@/components/products/MiniCalculator';
import ZipCodeSearch from '@/components/ZipCodeSearch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const { zipCode } = useZipCode();
  const { addToCart } = useCart();
  
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [adjustedPrice, setAdjustedPrice] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [selectedTons, setSelectedTons] = useState("3");
  const [deliveryDate, setDeliveryDate] = useState<Date>();

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

  const productPrice = adjustedPrice !== undefined ? adjustedPrice : (product?.price || 0);
  const totalPrice = productPrice * Number(selectedTons);

  const handleAddToCart = () => {
    if (!product || !deliveryDate) {
      toast({
        title: "Please select a delivery date",
        description: "A delivery date is required to continue.",
        variant: "destructive",
      });
      return;
    }

    addToCart({
      ...product,
      price: productPrice,
      quantity: Number(selectedTons),
      deliveryDate: deliveryDate,
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart for delivery on ${deliveryDate.toLocaleDateString()}.`,
    });
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

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
              <p className="text-2xl font-bold text-gray-900 mb-2">
                ${productPrice.toFixed(2)}/ton
              </p>
              
              {adjustedPrice !== undefined && adjustedPrice !== product.price && zipCode && (
                <p className="text-sm mb-6">
                  <span className={adjustedPrice > product.price ? "text-red-500" : "text-green-500"}>
                    {adjustedPrice > product.price ? "+" : "-"}
                    {Math.abs(((adjustedPrice - product.price) / product.price) * 100).toFixed(0)}%
                  </span>
                  {" "}price adjusted for ZIP {zipCode}
                </p>
              )}
            </div>

            {!zipCode && (
              <Card className="bg-gray-50">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-4">Check Delivery Availability</h3>
                  <ZipCodeSearch />
                </CardContent>
              </Card>
            )}

            <TonSelector 
              value={selectedTons} 
              onValueChange={setSelectedTons} 
            />

            <DeliveryDatePicker 
              selectedDate={deliveryDate}
              onDateSelect={setDeliveryDate}
            />

            <div className="space-y-4">
              <p className="text-2xl font-bold">
                Total: ${totalPrice.toFixed(2)}
              </p>
              <Button 
                onClick={handleAddToCart} 
                size="lg" 
                className="w-full"
              >
                Add to Cart
              </Button>
            </div>

            <MiniCalculator
              pricePerTon={productPrice}
              onQuantityCalculated={(tons) => setSelectedTons(tons.toString())}
            />
          </div>
        </div>

        <div className="mt-16">
          <Tabs defaultValue="details">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="delivery">Delivery Info</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="prose max-w-none">
              <h3 className="text-xl font-semibold mb-4">Product Details</h3>
              <p className="text-gray-600">{product.description}</p>
            </TabsContent>
            <TabsContent value="specifications">
              <h3 className="text-xl font-semibold mb-4">Specifications</h3>
            </TabsContent>
            <TabsContent value="delivery">
              <h3 className="text-xl font-semibold mb-4">Delivery Information</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-600">
                <li>Minimum 72-hour lead time required for all deliveries</li>
                <li>Delivery available Monday through Friday</li>
                <li>Morning (8am-12pm) and afternoon (12pm-4pm) delivery windows</li>
                <li>Someone must be present to accept delivery</li>
              </ul>
            </TabsContent>
            <TabsContent value="faq">
              <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
