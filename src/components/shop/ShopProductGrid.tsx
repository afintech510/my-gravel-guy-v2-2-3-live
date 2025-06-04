
import React, { useState } from 'react';
import { Product } from '@/services/productTypes';
import ShopProductCard from './ShopProductCard';

interface ShopProductGridProps {
  products: Product[];
  loading?: boolean;
  searchTerm?: string;
}

export default function ShopProductGrid({ products, loading, searchTerm }: ShopProductGridProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Filter products by search term if provided
  const filteredProducts = searchTerm 
    ? products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  const handleProductSelect = (productId: string) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="bg-gray-100 rounded-lg h-64 animate-pulse" />
        ))}
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 p-6 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
          <span className="text-2xl">📦</span>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {searchTerm 
            ? `No products match "${searchTerm}". Try adjusting your search or filters.`
            : 'No products match your current filters. Try selecting a different category.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredProducts.map((product) => (
        <ShopProductCard
          key={product.id}
          product={product}
          isSelected={selectedProductIds.has(String(product.id))}
          onSelect={() => handleProductSelect(String(product.id))}
        />
      ))}
    </div>
  );
}
