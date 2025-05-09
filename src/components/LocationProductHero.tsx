
import React, { useState, useEffect } from 'react';
import { useZipCode } from '../contexts/ZipCodeContext';
import { getProducts, getPriceAdjustmentForZipCode, applyZipCodeAdjustment } from '../services/productService';
import { Product } from '../services/productTypes';
import { Button } from '@/components/ui/button';
import { useCart } from '../contexts/CartContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
        console.log("LocationProductHero: Fetching products");
        const allProducts = await getProducts();
        console.log("LocationProductHero: All products:", allProducts);
        
        let adjustment = 0;
        
        if (zipCode) {
          console.log("LocationProductHero: Getting price adjustment for ZIP", zipCode);
          adjustment = await getPriceAdjustmentForZipCode(zipCode);
          console.log("LocationProductHero: Price adjustment:", adjustment);
        }
        
        // Apply price adjustments based on ZIP code
        const productsWithAdjustedPrices = allProducts.map(product => ({
          ...product,
          price: applyZipCodeAdjustment(product.price, adjustment)
        }));
        
        console.log("LocationProductHero: Products with adjusted prices:", productsWithAdjustedPrices);
        
        // Determine regional products based on ZIP code region
        const region = zipCodeData?.state_name || '';
        
        // Select best products to show as regional
        let regional: Product[] = [];
        
        if (region && productsWithAdjustedPrices.length > 0) {
          // For demo purposes - consider products as regional if they match the state or have specific keywords
          regional = productsWithAdjustedPrices.filter(product => 
            product.description?.toLowerCase().includes(region.toLowerCase()) ||
            product.name.toLowerCase().includes(region.toLowerCase())
          );
          
          console.log("LocationProductHero: Regional products based on region match:", regional);
          
          // If no matches by region, select by category
          if (regional.length === 0) {
            // Group by category
            const gravel = productsWithAdjustedPrices.filter(p => 
              p.name.toLowerCase().includes('gravel')
            );
            
            const sand = productsWithAdjustedPrices.filter(p => 
              p.name.toLowerCase().includes('sand')
            );
            
            const dirt = productsWithAdjustedPrices.filter(p => 
              p.name.toLowerCase().includes('dirt') || 
              p.name.toLowerCase().includes('soil')
            );
            
            // Take 1 from each category if available
            regional = [
              ...(gravel.length > 0 ? [gravel[0]] : []),
              ...(sand.length > 0 ? [sand[0]] : []),
              ...(dirt.length > 0 ? [dirt[0]] : [])
            ];
            
            console.log("LocationProductHero: Regional products by category:", regional);
          }
        }
        
        // If still no regional products or none selected, just take the first 3
        if (regional.length === 0 && productsWithAdjustedPrices.length > 0) {
          regional = productsWithAdjustedPrices.slice(0, 3);
          console.log("LocationProductHero: Using first 3 products as regional:", regional);
        }
        
        // Other products are everything else
        const others = productsWithAdjustedPrices.filter(p => 
          !regional.some(rp => rp.id === p.id)
        );
        
        console.log("LocationProductHero: Other products:", others);
        
        setProducts(productsWithAdjustedPrices);
        setRegionalProducts(regional);
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
      tons: 1
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
  const titlePrefix = zipCodeData ? "Products Available in" : "Popular Products";
  
  return (
    <div className="bg-gradient-to-b from-primary/5 to-transparent py-6 px-4 rounded-lg border">
      <div className="flex items-center mb-4">
        <MapPin className="h-5 w-5 text-primary mr-2" />
        <h2 className="text-xl font-semibold">
          {titlePrefix} {zipCodeData ? locationText : ""}
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
      ) : products.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No products available yet</p>
          <p className="text-sm">Please check back later or contact us for assistance</p>
        </div>
      ) : (
        <>
          {regionalProducts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">{zipCodeData ? 'Popular in Your Area' : 'Featured Products'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {regionalProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="bg-white p-4 rounded-md border hover:shadow-md transition-shadow">
                    <div className="aspect-square relative mb-4">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="object-cover w-full h-full rounded-md"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    </div>
                    <h4 className="font-semibold">{product.name}</h4>
                    <p className="text-sm text-gray-500 mb-2 line-clamp-1">{product.description || `Premium quality ${product.name}`}</p>
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
