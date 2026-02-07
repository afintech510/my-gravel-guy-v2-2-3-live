import React, { useState, useEffect } from 'react';
import { getProducts } from '@/services/productService';
import { Product } from '@/services/productTypes';
import { cn } from '@/lib/utils';
import { Package, Layers, Mountain, RockingChair, Building2, Shovel, Waves, Flower, Route } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductFilterSelectorProps {
  onProductSelected: (product: Product | null) => void;
  selectedProduct: Product | null;
}

export default function ProductFilterSelector({ onProductSelected, selectedProduct }: ProductFilterSelectorProps) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  console.log('[ProductFilterSelector] Current selectedProduct:', selectedProduct?.name || 'none');
  
  // Updated categories to mirror the /shop page
  const categories = [
    { id: 'all', label: 'All Products', icon: <Package className="h-5 w-5" /> },
    { id: 'walkway-gravel', label: 'Walkway Gravel', icon: <Route className="h-5 w-5" /> },
    { id: 'natural-gravel', label: 'Natural Gravel', icon: <Layers className="h-5 w-5" /> },
    { id: 'river-rock', label: 'River Rock', icon: <Mountain className="h-5 w-5" /> },
    { id: 'driveway-gravel', label: 'Driveway Gravel', icon: <RockingChair className="h-5 w-5" /> },
    { id: 'crushed-stone', label: 'Crushed Stone', icon: <Building2 className="h-5 w-5" /> },
    { id: 'rock', label: 'Rock & Stone', icon: <Mountain className="h-5 w-5" /> },
    { id: 'crushed-gravel', label: 'Crushed Gravel', icon: <RockingChair className="h-5 w-5" /> },
    { id: 'crushed-concrete', label: 'Crushed Concrete', icon: <Building2 className="h-5 w-5" /> },
    { id: 'soil-dirt', label: 'Soil & Dirt', icon: <Shovel className="h-5 w-5" /> },
    { id: 'sand', label: 'Sand', icon: <Waves className="h-5 w-5" /> },
    { id: 'mulch', label: 'Mulch', icon: <Flower className="h-5 w-5" /> },
  ];

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const allProducts = await getProducts();
        console.log('ProductFilterSelector: Loaded products:', allProducts.length);
        setProducts(allProducts);
        setLoading(false);
      } catch (error) {
        console.error('Error loading products:', error);
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // Filter products based on selected category
  useEffect(() => {
    if (!selectedCategory) return;
    
    let result = [...products];
    console.log(`Filtering for category: ${selectedCategory}, total products: ${products.length}`);
    
    // Apply category filter if not "all"
    if (selectedCategory !== 'all') {
      result = products.filter(product => {
        // Use product.category directly without relying on hardcoded mappings
        const productCategory = product.category?.toLowerCase() || '';
        console.log(`Checking product: ${product.name}, category: ${productCategory}`);
        
        switch (selectedCategory) {
          case 'walkway-gravel':
            const isWalkwayGravel = productCategory === 'walkway-gravel';
            if (isWalkwayGravel) console.log(`Product ${product.name} included as walkway-gravel`);
            return isWalkwayGravel;
          
          case 'natural-gravel':
            const isNaturalGravel = productCategory === 'natural-gravel';
            if (isNaturalGravel) console.log(`Product ${product.name} included as natural-gravel`);
            return isNaturalGravel;
          
          case 'river-rock':
            const isRiverRock = productCategory === 'river-rock';
            if (isRiverRock) console.log(`Product ${product.name} included as river-rock`);
            return isRiverRock;
          
          case 'driveway-gravel':
            const isDrivewayGravel = productCategory === 'driveway-gravel';
            if (isDrivewayGravel) console.log(`Product ${product.name} included as driveway-gravel`);
            return isDrivewayGravel;
          
          case 'crushed-stone':
            const isCrushedStone = productCategory === 'crushed-stone';
            if (isCrushedStone) console.log(`Product ${product.name} included as crushed-stone`);
            return isCrushedStone;
          
          case 'rock':
            // Products with "rock" OR "stone" OR "rock & stone" category
            const isRockOrStone = productCategory === 'rock' || productCategory === 'stone' || productCategory === 'rock-stone';
            if (isRockOrStone) console.log(`Product ${product.name} included as rock or stone`);
            return isRockOrStone;
          
          case 'crushed-gravel':
            return productCategory === 'crushed-gravel' || productCategory.includes('crushed-gravel');
          
          case 'crushed-concrete':
            return productCategory === 'crushed-concrete';
          
          case 'soil-dirt':
            return productCategory === 'soil' || productCategory === 'dirt';
          
          case 'sand':
            return productCategory === 'sand';
          
          case 'mulch':
            return productCategory === 'mulch';
          
          default:
            return false;
        }
      });
    }

    // Sort products
    if (selectedCategory === 'all') {
      // For "All Products": prioritize driveway and walkway gravels
      result.sort((a, b) => {
        // Check if product is driveway or walkway gravel
        const isDrivewayA = (a.uses?.includes('driveway') || a.description?.toLowerCase().includes('driveway')) ?? false;
        const isWalkwayA = (a.uses?.includes('walkway') || a.description?.toLowerCase().includes('walkway')) ?? false;
        const isDrivewayB = (b.uses?.includes('driveway') || b.description?.toLowerCase().includes('driveway')) ?? false;
        const isWalkwayB = (b.uses?.includes('walkway') || b.description?.toLowerCase().includes('walkway')) ?? false;
        
        // Priority order: driveway, walkway, then alphabetically
        if ((isDrivewayA || isWalkwayA) && !(isDrivewayB || isWalkwayB)) return -1;
        if (!(isDrivewayA || isWalkwayA) && (isDrivewayB || isWalkwayB)) return 1;
        if (isDrivewayA && !isDrivewayB) return -1;
        if (!isDrivewayA && isDrivewayB) return 1;
        
        // Alphabetical sort for the rest
        return a.name.localeCompare(b.name);
      });
    } else {
      // For other categories: plain alphabetical sorting
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    console.log(`Filtered products count for ${selectedCategory}: ${result.length}`);
    setFilteredProducts(result);
  }, [selectedCategory, products]);

  // Select a product
  const handleProductSelect = (product: Product) => {
    console.log('[ProductFilterSelector] Product selected:', product.name);
    onProductSelected(product);
  };

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Material Category</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex items-center justify-center p-3 border rounded-md transition-colors",
                selectedCategory === category.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card hover:bg-muted text-foreground border-border"
              )}
            >
              {category.icon}
              <span className={cn("ml-2", isMobile ? "text-xs" : "text-sm")}>
                {category.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Products List */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Available Materials</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredProducts.slice(0, 10).map(product => (
              <button
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className={cn(
                  "text-left p-4 border-2 rounded-md transition-all hover:shadow-md",
                  selectedProduct?.id === product.id 
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20" 
                    : "border-border bg-card hover:border-border"
                )}
              >
                <div className="flex items-start">
                  {product.image && (
                    <div className="w-16 h-16 bg-muted rounded flex-shrink-0 mr-4">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className={cn(
                      "font-medium",
                      selectedProduct?.id === product.id ? "text-primary" : "text-foreground"
                    )}>
                      {product.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {product.size || product.specifications?.size || ""}
                    </p>
                    {selectedProduct?.id === product.id && (
                      <div className="flex items-center mt-2">
                        <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                        <span className="text-xs font-medium text-primary">Selected</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full p-8 text-center text-muted-foreground bg-muted rounded-md">
                No products match your selection. Try adjusting your filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
