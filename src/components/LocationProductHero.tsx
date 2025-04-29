
import React, { useState, useEffect } from 'react';
import { useZipCode } from '../contexts/ZipCodeContext';
import { getProducts, getPriceAdjustmentForZipCode, applyZipCodeAdjustment } from '../services/productService';
import { Product } from '../services/productTypes';
import { Button } from '@/components/ui/button';
import { useCart } from '../contexts/CartContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { MapPin } from 'lucide-react';

const LocationProductHero = () => {
  const { zipCode, zipCodeData } = useZipCode();
  const { addToCart } = useCart();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [regionalProducts, setRegionalProducts] = useState<Product[]>([]);
  const [otherProducts, setOtherProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const allProducts = await getProducts();
        let adjustment = 0;
        
        if (zipCode) {
          adjustment = await getPriceAdjustmentForZipCode(zipCode);
        }
        
        // Apply price adjustments based on ZIP code
        const productsWithAdjustedPrices = allProducts.map(product => ({
          ...product,
          price: applyZipCodeAdjustment(product.price, adjustment)
        }));
        
        // Determine regional products based on ZIP code region
        const region = zipCodeData?.state_name || '';
        
        // For demo purposes - consider products as regional if they match the state or have specific keywords
        const regional = productsWithAdjustedPrices.filter(product => 
          product.description?.toLowerCase().includes(region.toLowerCase()) ||
          product.name.toLowerCase().includes(region.toLowerCase())
        );
        
        // Other products are everything else
        const others = productsWithAdjustedPrices.filter(p => 
          !regional.some(rp => rp.id === p.id)
        );
        
        setProducts(productsWithAdjustedPrices);
        setRegionalProducts(regional.length > 0 ? regional : productsWithAdjustedPrices.slice(0, 3));
        setOtherProducts(others);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [zipCode, zipCodeData]);
  
  const handleAddToCart = (product: Product) => {
    addToCart({
      ...product,
      quantity: 1
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };
  
  // Always show the component with appropriate messaging if no location is set
  const locationText = zipCodeData ? 
    `${zipCodeData.city}, ${zipCodeData.state_id}` : 
    "Your Area";
  
  // If products are available but no location is set, use "Near You" wording
  const titlePrefix = zipCodeData ? "Products Available in" : "Products Available Near";
  
  return (
    <div className="bg-gradient-to-b from-primary/5 to-transparent py-6 px-4 rounded-lg border">
      <div className="flex items-center mb-4">
        <MapPin className="h-5 w-5 text-primary mr-2" />
        <h2 className="text-xl font-semibold">
          {titlePrefix} {locationText}
        </h2>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-4 rounded-md border">
              <Skeleton className="h-24 w-full mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {regionalProducts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Popular in Your Area</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {regionalProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="bg-white p-4 rounded-md border hover:shadow-md transition-shadow">
                    <div className="aspect-square relative mb-4">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="object-cover w-full h-full rounded-md"
                      />
                    </div>
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-1">{product.description}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-bold">${product.price.toFixed(2)}/ton</p>
                      <Button 
                        onClick={() => handleAddToCart(product)} 
                        size="sm"
                      >
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {otherProducts.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">Other Available Products</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {otherProducts.slice(0, 4).map((product) => (
                  <div key={product.id} className="bg-white p-3 rounded-md border hover:shadow-md transition-shadow">
                    <h4 className="font-semibold text-sm mb-1 line-clamp-1">{product.name}</h4>
                    <p className="text-sm font-bold mb-2">${product.price.toFixed(2)}/ton</p>
                    <Button 
                      onClick={() => handleAddToCart(product)} 
                      size="sm" 
                      className="w-full text-xs py-1"
                    >
                      Add to Cart
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LocationProductHero;
