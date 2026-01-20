
import React, { useState, useEffect } from 'react';
import { getProducts } from '@/services/productService';
import { Product } from '@/services/productTypes';
import { cn } from '@/lib/utils';
import { Package, Layers, Mountain, RockingChair, Building2, Shovel, Waves, Flower, Route } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ShopProductFilterSelectorProps {
  onFilterChange: (filters: {
    category: string;
    filteredProducts: Product[];
  }) => void;
  sortOrder?: string;
}

export default function ShopProductFilterSelector({ onFilterChange, sortOrder = 'nameAsc' }: ShopProductFilterSelectorProps) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Updated categories with new specific gravel types
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
        console.log('ShopProductFilterSelector: Loaded products:', allProducts.length);
        setProducts(allProducts);
        setLoading(false);
      } catch (error) {
        console.error('Error loading products:', error);
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // Function to convert size string to numerical value for sorting
  const getSizeValue = (size: string | undefined): number => {
    if (!size) return 0;
    
    // Extract numeric value from size string (e.g., "3/4\"" -> 0.75, "2-3\"" -> 2.5)
    const sizeStr = size.toLowerCase();
    
    if (sizeStr.includes('/')) {
      // Handle fractions like "3/4", "1/2"
      const parts = sizeStr.split('/');
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1].replace(/[^0-9]/g, ''));
        return numerator / denominator;
      }
    }
    
    if (sizeStr.includes('-')) {
      // Handle ranges like "2-3", take the average
      const parts = sizeStr.split('-');
      if (parts.length === 2) {
        const min = parseFloat(parts[0]);
        const max = parseFloat(parts[1].replace(/[^0-9]/g, ''));
        return (min + max) / 2;
      }
    }
    
    // Extract first number from string
    const match = sizeStr.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Function to sort products based on sortOrder
  const sortProducts = (productsToSort: Product[], order: string) => {
    return [...productsToSort].sort((a, b) => {
      switch (order) {
        case 'nameDesc':
          return b.name.localeCompare(a.name);
        case 'priceAsc':
          return a.price - b.price;
        case 'priceDesc':
          return b.price - a.price;
        case 'sizeAsc':
          return getSizeValue(a.size) - getSizeValue(b.size);
        case 'sizeDesc':
          return getSizeValue(b.size) - getSizeValue(a.size);
        case 'nameAsc':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  };

  // Filter and sort products based on selected category and sort order
  useEffect(() => {
    if (!selectedCategory) return;
    
    let result = [...products];
    console.log(`Filtering for category: ${selectedCategory}, total products: ${products.length}`);
    
    // Apply category filter if not "all"
    if (selectedCategory !== 'all') {
      result = products.filter(product => {
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

    // Apply sorting based on the passed sortOrder prop
    result = sortProducts(result, sortOrder);
    
    console.log(`Filtered and sorted products count for ${selectedCategory}: ${result.length}`);
    
    // Notify parent component of filter changes
    onFilterChange({
      category: selectedCategory,
      filteredProducts: result
    });
  }, [selectedCategory, products, sortOrder, onFilterChange]);

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {categories.map(category => (
        <button
          key={category.id}
          onClick={() => handleCategorySelect(category.id)}
          className={cn(
            "flex items-center justify-center p-3 border rounded-md transition-colors",
            selectedCategory === category.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
          )}
        >
          {category.icon}
          <span className={cn("ml-2", isMobile ? "text-xs" : "text-sm")}>
            {category.label}
          </span>
        </button>
      ))}
    </div>
  );
}
