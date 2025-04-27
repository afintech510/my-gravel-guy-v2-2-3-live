
import React, { useState } from 'react';
import ProductGrid from '../components/ProductGrid';
import ProductSearch from '../components/ProductSearch';
import { Product } from '../services/productService';

const Products = () => {
  const [filters, setFilters] = useState({
    search: '',
    sort: 'nameAsc',
    category: 'all'
  });

  const handleSearch = (term: string) => {
    setFilters(prev => ({ ...prev, search: term }));
  };

  const handleSort = (option: string) => {
    setFilters(prev => ({ ...prev, sort: option }));
  };

  const handleFilter = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
  };

  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Our Products</h1>
        <div className="mb-8">
          <ProductSearch
            onSearch={handleSearch}
            onSort={handleSort}
            onFilter={handleFilter}
          />
        </div>
        <ProductGrid filters={filters} />
      </div>
    </div>
  );
};

export default Products;
