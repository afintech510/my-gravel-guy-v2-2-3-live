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
  limit?: number;
  onAvailableSizesChange?: (sizes: string[]) => void;
}

const ProductGrid = ({ 
  filters = { search: '', sort: 'nameAsc', category: 'all', subcategory: '', size: '' }, 
  limit = 100,
  onAvailableSizesChange
}: ProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

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

  // Function to normalize size strings for comparison
  const normalizeSize = (size: string): string => {
    if (!size) return '';
    
    // Remove spaces, convert to lowercase
    let normalized = size.toLowerCase().replace(/\s+/g, '');
    
    // Handle common variations
    normalized = normalized
      .replace(/inch(es)?/g, '"')
      .replace(/^(\d+)([/])(\d+)$/g, '$1/$3"') // Add inch symbol if missing
      .replace(/^(\d+)[-](\d+)$/g, '$1-$2"') // Add inch symbol if missing
      .replace('½', '1/2')
      .replace('¼', '1/4')
      .replace('¾', '3/4')
      .replace('⅛', '1/8')
      .replace('⅜', '3/8');
    
    return normalized;
  };
  
  // Function to match product size against filter size
  const sizeMatches = (productSize: string | undefined, filterSize: string): boolean => {
    if (!productSize || !filterSize) return false;
    
    const normalizedProductSize = normalizeSize(productSize);
    const normalizedFilterSize = normalizeSize(filterSize);
    
    // Direct match
    if (normalizedProductSize === normalizedFilterSize) return true;
    
    // Looser match - product size contains filter size
    if (normalizedProductSize.includes(normalizedFilterSize)) return true;
    
    // Special case for fraction handling
    // Convert "1½"" to "1-1/2"" for comparison
    const specialCases: Record<string, string[]> = {
      '3/8"': ['3/8"', '0.375"', '3/8inch', '3/8in', '3-8"'],
      '3/4"': ['3/4"', '0.75"', '3/4inch', '3/4in', '3-4"'],
      '1"': ['1"', '1inch', '1in', '1.0"'],
      '1½"': ['1½"', '1-1/2"', '1.5"', '1-1/2inch', '1-1/2in', '1-5"'],
      '2-3"': ['2-3"', '2-3inch', '2-3in', '2to3"']
    };
    
    // Check if either normalized string matches any of the special cases
    for (const [standard, variants] of Object.entries(specialCases)) {
      if (standard === normalizedFilterSize && variants.includes(normalizedProductSize)) {
        return true;
      }
      if (variants.includes(normalizedFilterSize) && standard === normalizedProductSize) {
        return true;
      }
    }
    
    return false;
  };

  // Enhanced function to check if a product belongs to a category
  const productMatchesCategory = (product: Product, categoryFilter: string): boolean => {
    if (categoryFilter === 'all') return true;
    
    const categoryLower = categoryFilter.toLowerCase();
    
    // Check main category field
    if (product.category.toLowerCase() === categoryLower) return true;
    
    // Check if main category contains the filter (for compound categories like "crushed-gravel")
    if (product.category.toLowerCase().includes(categoryLower)) return true;
    
    // Check categories array if it exists
    if (product.categories && Array.isArray(product.categories)) {
      const matchesArray = product.categories.some(cat => {
        const catLower = cat.toLowerCase();
        return catLower === categoryLower || catLower.includes(categoryLower);
      });
      if (matchesArray) return true;
    }
    
    // For specific category mappings
    if (categoryFilter === 'gravel') {
      // Include products with categories that contain gravel
      const gravelCategories = ['gravel', 'crushed-gravel', 'crushed gravel', 'pea-gravel', 'pea gravel'];
      return gravelCategories.some(gravelCat => 
        product.category.toLowerCase().includes(gravelCat) ||
        (product.categories && product.categories.some(cat => cat.toLowerCase().includes(gravelCat)))
      );
    }
    
    if (categoryFilter === 'base') {
      const baseCategories = ['base', 'road-base', 'crusher-base', 'concrete-rca'];
      return baseCategories.some(baseCat => 
        product.category.toLowerCase().includes(baseCat) ||
        (product.categories && product.categories.some(cat => cat.toLowerCase().includes(baseCat)))
      );
    }
    
    if (categoryFilter === 'sand') {
      const sandCategories = ['sand', 'mason-sand', 'concrete-sand', 'play-sand', 'playground-sand'];
      return sandCategories.some(sandCat => 
        product.category.toLowerCase().includes(sandCat) ||
        (product.categories && product.categories.some(cat => cat.toLowerCase().includes(sandCat)))
      );
    }
    
    if (categoryFilter === 'dirt') {
      const dirtCategories = ['dirt', 'soil', 'loam', 'topsoil', 'fill-dirt', 'compost'];
      return dirtCategories.some(dirtCat => 
        product.category.toLowerCase().includes(dirtCat) ||
        product.name.toLowerCase().includes(dirtCat) ||
        (product.categories && product.categories.some(cat => cat.toLowerCase().includes(dirtCat)))
      );
    }
    
    return false;
  };

  // Function to normalize text for comparison (handles spaces, hyphens, case)
  const normalizeText = (text: string): string => {
    return text.toLowerCase()
      .replace(/\s+/g, '') // Remove all spaces
      .replace(/-/g, ''); // Remove all hyphens
  };

  // Enhanced subcategory matching function
  const subcategoryMatches = (product: Product, subcategory: string): boolean => {
    const normalizedSubcategory = normalizeText(subcategory);
    
    // Check various product fields for the subcategory keyword
    const fieldsToCheck = [
      product.name,
      product.description,
      product.subtype || '',
      product.usage || '',
      product.color || '',
      ...(product.uses || []),
      ...(product.categories || [])
    ];
    
    return fieldsToCheck.some(field => {
      const normalizedField = normalizeText(field);
      return normalizedField.includes(normalizedSubcategory);
    });
  };

  useEffect(() => {
    let result = [...products];
    console.log("Filtering products with:", filters);
    console.log("Total products before filtering:", result.length);

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      );
      console.log(`After search filter: ${result.length} products`);
    }

    // Filter by main category - use enhanced category matching
    if (filters.category !== 'all') {
      const beforeCount = result.length;
      result = result.filter(product => productMatchesCategory(product, filters.category));
      
      console.log(`After category filter (${filters.category}): ${result.length} products (removed ${beforeCount - result.length})`);
      
      // Log some examples of what was filtered
      if (result.length > 0) {
        console.log("Sample products after category filter:", result.slice(0, 3).map(p => ({
          name: p.name,
          category: p.category,
          categories: p.categories
        })));
      }

      // Filter by subcategory if present - use enhanced subcategory matching
      if (filters.subcategory) {
        console.log(`Applying subcategory filter: ${filters.subcategory}`);
        const beforeSubCount = result.length;
        
        result = result.filter(product => subcategoryMatches(product, filters.subcategory!));
        
        console.log(`After subcategory filter: ${result.length} products (removed ${beforeSubCount - result.length})`);
      }

      // Extract available sizes after category and subcategory filtering but before size filtering
      const categoryFilteredSizes = result
        .map(product => product.size)
        .filter((size): size is string => !!size)
        .filter((value, index, self) => self.indexOf(value) === index); // Get unique sizes
      
      console.log("Available sizes after category/subcategory filtering:", categoryFilteredSizes);
      
      // Set the available sizes state and notify parent if callback provided
      if (JSON.stringify(availableSizes) !== JSON.stringify(categoryFilteredSizes)) {
        setAvailableSizes(categoryFilteredSizes);
        if (onAvailableSizesChange) {
          onAvailableSizesChange(categoryFilteredSizes);
        }
      }

      // Filter by size if present and category is gravel or base
      if (filters.size && ['gravel', 'base'].includes(filters.category)) {
        console.log(`Applying size filter: ${filters.size}`);
        const beforeCount = result.length;
        
        result = result.filter(product => {
          // Check if product has size information
          if (!product.size) return false;
          
          // Use the new robust size matching function
          return sizeMatches(product.size, filters.size!);
        });
        
        console.log(`After size filter: ${result.length} products (removed ${beforeCount - result.length})`);
        
        // If no products match the size filter, log a warning
        if (result.length === 0) {
          console.warn(`No products match the size filter: ${filters.size}. Available sizes were: ${categoryFilteredSizes.join(', ')}`);
        }
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
  }, [products, filters, limit, onAvailableSizesChange]);

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
