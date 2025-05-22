import React, { useState, useEffect } from 'react';
import { useZipCode } from '../contexts/ZipCodeContext';
import { getProducts, getPriceAdjustmentForZipCode, applyZipCodeAdjustment } from '../services/productService';
import { Product } from '../services/productTypes';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, RefreshCw, PackageSearch, ImageOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '../contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';

const LocationProductHero = () => {
  const { zipCode, zipCodeData } = useZipCode();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [regionalProducts, setRegionalProducts] = useState<Product[]>([]);
  const [otherProducts, setOtherProducts] = useState<Product[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const loadProducts = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      console.log("LocationProductHero: Fetching products");
      // Fix: Call getProducts without an argument or pass forceRefresh
      const allProducts = await getProducts();
      
      if (!allProducts || allProducts.length === 0) {
        console.log("LocationProductHero: No products found");
        setProducts([]);
        setRegionalProducts([]);
        setOtherProducts([]);
        setLoading(false);
        return;
      }
      
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
            p.name.toLowerCase().includes('gravel') || 
            (p.categories && p.categories.includes('gravel'))
          );
          
          const sand = productsWithAdjustedPrices.filter(p => 
            p.name.toLowerCase().includes('sand') || 
            (p.categories && p.categories.includes('sand'))
          );
          
          const dirt = productsWithAdjustedPrices.filter(p => 
            p.name.toLowerCase().includes('dirt') || 
            p.name.toLowerCase().includes('soil') ||
            (p.categories && (p.categories.includes('dirt') || p.categories.includes('soil')))
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
    } catch (e) {
      console.error('Error fetching products:', e);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadProducts();
  }, [zipCode, zipCodeData]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProducts(true); // Force refresh
  };
  
  // Always show the component with appropriate messaging if no location is set
  const locationText = zipCodeData ? 
    `${zipCodeData.city}, ${zipCodeData.state_id}` : 
    "Your Area";
  
  // If products are available but no location is set, use "Near You" wording
  const titlePrefix = zipCodeData ? "Products Available in" : "Popular Products";
  
  return (
    <div className="bg-gradient-to-b from-primary/5 to-transparent py-6 px-4 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <MapPin className="h-5 w-5 text-primary mr-2" />
          <h2 className="text-xl font-semibold">
            {titlePrefix} {zipCodeData ? locationText : ""}
          </h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
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
        <div className="text-center py-8 space-y-4">
          <PackageSearch className="h-12 w-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 mb-4">No products found at this time</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Try Again
            </Button>
            <Button variant="outline" asChild>
              <Link to="/products">
                View All Products
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {regionalProducts.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">{zipCodeData ? 'Popular in Your Area' : 'Featured Products'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {regionalProducts.slice(0, 3).map((product) => (
                  <div key={product.id} className="bg-white p-4 rounded-md border hover:shadow-md transition-shadow h-full flex flex-col">
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
                    <h4 className="font-semibold mb-1">{product.name}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 flex-grow">{product.description || `Premium quality ${product.name}`}</p>
                    <Button 
                      asChild
                      className="w-full"
                      size="sm"
                    >
                      <Link to={`/products/${encodeURIComponent(product.slug)}`}>
                        Shop
                      </Link>
                    </Button>
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
                  <div key={product.id} className="bg-white p-3 rounded-md border hover:shadow-md transition-shadow h-full flex flex-col">
                    <h4 className="font-semibold text-sm mb-1 line-clamp-1">{product.name}</h4>
                    <p className="text-xs text-gray-500 mb-2 line-clamp-2 flex-grow">{product.description || `Premium quality ${product.name}`}</p>
                    <Button 
                      asChild
                      size="sm" 
                      className="w-full text-xs py-1"
                    >
                      <Link to={`/products/${encodeURIComponent(product.slug)}`}>
                        Shop
                      </Link>
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
