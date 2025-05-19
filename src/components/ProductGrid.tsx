
import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { getProducts } from '../services/productService';
import { Product } from '../services/productTypes';
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw } from "lucide-react";

interface ProductGridProps {
  filters?: {
    search: string;
    sort: string;
    category: string;
    subcategory?: string;
    size?: string;
  };
  limit?: number; // Prop to limit number of products
}

const ProductGrid = ({ 
  filters = { search: '', sort: 'nameAsc', category: 'all', subcategory: '', size: '' }, 
  limit = 100 // Changed default from 9 to 100 products
}: ProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProducts = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      console.log("ProductGrid: Fetching products");
      const fetchedProducts = await getProducts(forceRefresh);
      console.log("ProductGrid: Fetched", fetchedProducts.length, "products");
      setProducts(fetchedProducts);
    } catch (err) {
      console.error("ProductGrid: Failed to load products:", err);
      setError("Failed to load products. Please try again later.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProducts(true); // Force refresh
  };

  useEffect(() => {
    let result = [...products];
    console.log("Filtering products with:", filters);

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by main category - always apply this filter first
    if (filters.category !== 'all') {
      result = result.filter(product => {
        // Check if the product has the category either in the main category or in the categories array
        const matchesMainCategory = product.category.toLowerCase() === filters.category.toLowerCase();
        
        // Check in the categories array if available
        const matchesCategoryArray = product.categories && Array.isArray(product.categories) && 
          product.categories.some(cat => cat.toLowerCase() === filters.category.toLowerCase());
        
        return matchesMainCategory || matchesCategoryArray;
      });
      
      console.log(`After category filter (${filters.category}): ${result.length} products`);

      // Filter by subcategory if present
      if (filters.subcategory) {
        console.log(`Applying subcategory filter: ${filters.subcategory}`);
        const beforeCount = result.length;
        
        result = result.filter(product => {
          const subcategory = filters.subcategory?.toLowerCase();
          
          // Enhanced matching for all subcategories based on their category
          switch (filters.category) {
            case 'gravel':
              // Logic for gravel subcategories (walkway, driveway, drainage, natural, crushed, round)
              if (['walkway', 'driveway', 'drainage', 'natural', 'crushed', 'round'].includes(subcategory!)) {
                // Check in uses array
                if (product.uses && Array.isArray(product.uses)) {
                  const hasMatchingUse = product.uses.some(use => 
                    use.toLowerCase().includes(subcategory!)
                  );
                  if (hasMatchingUse) return true;
                }

                // Check in subtype property
                if (product.subtype && product.subtype.toLowerCase().includes(subcategory!)) {
                  return true;
                }
                
                // Check in categories array
                if (product.categories && Array.isArray(product.categories)) {
                  return product.categories.some(cat => 
                    cat.toLowerCase().includes(subcategory!)
                  );
                }
                
                // Check description for keywords
                if (product.description.toLowerCase().includes(subcategory!)) {
                  return true;
                }
              }
              break;
            
            case 'dirt':
              // Logic for dirt subcategories (top-soil, compost, fill-dirt, loam, sandy-loam)
              if (['top-soil', 'compost', 'fill-dirt', 'loam', 'sandy-loam'].includes(subcategory!)) {
                // Check in subtype
                if (product.subtype && product.subtype.toLowerCase() === subcategory) {
                  return true;
                }
                
                // Check in categories
                if (product.categories && Array.isArray(product.categories)) {
                  const hasMatch = product.categories.some(cat => 
                    cat.toLowerCase() === subcategory || cat.toLowerCase().includes(subcategory!)
                  );
                  if (hasMatch) return true;
                }
                
                // Check in description
                if (product.description.toLowerCase().includes(subcategory!)) {
                  return true;
                }
                
                // Special case for hyphenated terms
                if (subcategory === 'top-soil' && 
                    (product.description.toLowerCase().includes('top soil') || 
                     product.description.toLowerCase().includes('topsoil'))) {
                  return true;
                }
                
                if (subcategory === 'fill-dirt' && 
                    (product.description.toLowerCase().includes('fill dirt'))) {
                  return true;
                }
                
                if (subcategory === 'sandy-loam' && 
                    (product.description.toLowerCase().includes('sandy loam'))) {
                  return true;
                }
              }
              break;
            
            case 'base':
              // Logic for base subcategories (road-base, concrete-rca, crusher-base)
              if (['road-base', 'concrete-rca', 'crusher-base'].includes(subcategory!)) {
                // Check in subtype
                if (product.subtype && 
                    (product.subtype.toLowerCase() === subcategory || 
                     product.subtype.toLowerCase().includes(subcategory!.replace('-', ' ')))) {
                  return true;
                }
                
                // Check in categories
                if (product.categories && Array.isArray(product.categories)) {
                  const hasMatch = product.categories.some(cat => 
                    cat.toLowerCase() === subcategory || 
                    cat.toLowerCase().includes(subcategory!) ||
                    cat.toLowerCase().includes(subcategory!.replace('-', ' '))
                  );
                  if (hasMatch) return true;
                }
                
                // Check in description - also try without hyphens
                if (product.description.toLowerCase().includes(subcategory!) || 
                    product.description.toLowerCase().includes(subcategory!.replace('-', ' '))) {
                  return true;
                }
              }
              break;
            
            case 'sand':
              // Logic for sand subcategories (concrete, mason, playground, beach, washed)
              if (['concrete', 'mason', 'playground', 'beach', 'washed'].includes(subcategory!)) {
                // Check in subtype
                if (product.subtype && 
                    (product.subtype.toLowerCase() === subcategory || 
                     product.subtype.toLowerCase().includes(subcategory! + '-sand') ||
                     product.subtype.toLowerCase().includes(subcategory! + ' sand'))) {
                  return true;
                }
                
                // Check in categories
                if (product.categories && Array.isArray(product.categories)) {
                  const hasMatch = product.categories.some(cat => 
                    cat.toLowerCase() === subcategory || 
                    cat.toLowerCase().includes(subcategory! + '-sand') ||
                    cat.toLowerCase().includes(subcategory! + ' sand')
                  );
                  if (hasMatch) return true;
                }
                
                // Check in description
                if (product.description.toLowerCase().includes(subcategory! + ' sand') || 
                    product.description.toLowerCase().includes(subcategory!)) {
                  return true;
                }
              }
              break;
            
            case 'mulch':
              // Logic for mulch subcategories (chocolate, jet-black, red, natural-dark, wood-chips)
              if (['chocolate', 'jet-black', 'red', 'natural-dark', 'wood-chips'].includes(subcategory!)) {
                // Check in color property
                if (product.color && (
                    product.color.toLowerCase() === subcategory ||
                    product.color.toLowerCase().includes(subcategory!))) {
                  return true;
                }
                
                // Check in specifications.color
                if (product.specifications?.color && 
                    product.specifications.color.toLowerCase().includes(subcategory!)) {
                  return true;
                }
                
                // Check in categories
                if (product.categories && Array.isArray(product.categories)) {
                  const hasMatch = product.categories.some(cat => 
                    cat.toLowerCase() === subcategory || 
                    cat.toLowerCase().includes(subcategory!)
                  );
                  if (hasMatch) return true;
                }
                
                // Check in description
                if (product.description.toLowerCase().includes(subcategory!)) {
                  return true;
                }

                // Special cases for hyphenated terms
                if (subcategory === 'jet-black' && 
                    (product.description.toLowerCase().includes('jet black') || 
                     product.color?.toLowerCase().includes('black'))) {
                  return true;
                }

                if (subcategory === 'natural-dark' && 
                    (product.description.toLowerCase().includes('natural dark') || 
                     product.description.toLowerCase().includes('dark natural') ||
                     product.color?.toLowerCase().includes('natural'))) {
                  return true;
                }

                if (subcategory === 'wood-chips' && 
                    (product.description.toLowerCase().includes('wood chips') ||
                     product.description.toLowerCase().includes('woodchips'))) {
                  return true;
                }
              }
              break;
              
            default:
              // Fallback generic checks for any other category
              // Check in all possible fields
              if (product.subtype?.toLowerCase() === subcategory ||
                  product.color?.toLowerCase() === subcategory ||
                  product.size?.toLowerCase() === subcategory ||
                  (product.uses && Array.isArray(product.uses) && 
                   product.uses.some(use => use.toLowerCase().includes(subcategory!))) ||
                  (product.categories && Array.isArray(product.categories) && 
                   product.categories.some(cat => cat.toLowerCase().includes(subcategory!))) ||
                  product.description.toLowerCase().includes(subcategory!)) {
                return true;
              }
              break;
          }
          
          return false;
        });
        
        console.log(`After subcategory filter: ${result.length} products (removed ${beforeCount - result.length})`);
      }

      // Filter by size if present and category is gravel or base
      if (filters.size && ['gravel', 'base'].includes(filters.category)) {
        console.log(`Applying size filter: ${filters.size}`);
        const beforeCount = result.length;
        
        result = result.filter(product => {
          // Check if product has size information
          if (!product.size) return false;
          
          // Normalize sizes by removing spaces for comparison
          const normalizedProductSize = product.size.replace(/\s+/g, '').toLowerCase();
          const normalizedFilterSize = filters.size!.replace(/\s+/g, '').toLowerCase();
          
          return normalizedProductSize.includes(normalizedFilterSize);
        });
        
        console.log(`After size filter: ${result.length} products (removed ${beforeCount - result.length})`);
      }
    }

    // Apply sorting after all filters
    result.sort((a, b) => {
      switch (filters.sort) {
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        case 'priceAsc':
          return a.price - b.price;
        case 'priceDesc':
          return b.price - a.price;
        case 'nameAsc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    const limitedResult = limit ? result.slice(0, limit) : result;
    console.log(`Final filtered products: ${limitedResult.length} products displayed (limit: ${limit})`);
    setFilteredProducts(limitedResult);
  }, [products, filters, limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-full">
            <Skeleton className="h-64 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Try Again'}
        </Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8 space-y-4">
        <p className="text-gray-500">No products found. There might be an issue connecting to the database.</p>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Try Again'}
        </Button>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No products found matching your criteria.</p>
        {(filters.category !== 'all' || filters.search !== '' || filters.subcategory) ? (
          <p className="text-sm mt-2">Try changing your filters or search terms.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
