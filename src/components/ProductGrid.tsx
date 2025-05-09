
import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { getProducts } from '../services/productService';
import { Product } from '../services/productTypes';
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  filters?: {
    search: string;
    sort: string;
    category: string;
  };
  limit?: number; // New prop to limit number of products
}

const ProductGrid = ({ 
  filters = { search: '', sort: 'nameAsc', category: 'all' }, 
  limit = 9 // Default to 9 products, matches home page requirement
}: ProductGridProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
        setError(null);
      } catch (err) {
        console.error("Failed to load products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    let result = [...products];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.category !== 'all') {
      result = result.filter(product => {
        // Check if the product has the category either in the main category or in the categories array
        if (product.category === filters.category) {
          return true;
        }
        
        // Check in the categories array if available
        if (product.categories && Array.isArray(product.categories)) {
          return product.categories.some(cat => 
            cat.toLowerCase() === filters.category.toLowerCase()
          );
        }
        
        return false;
      });
    }

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
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No products found matching your criteria.</p>
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
