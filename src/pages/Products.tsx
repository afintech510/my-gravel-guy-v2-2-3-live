
import React, { useState } from 'react';
import ProductGrid from '../components/ProductGrid';
import ProductSearch from '../components/ProductSearch';
import TrustBanner from '../components/products/trust/TrustBanner';

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
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Our Products</h1>
        <div className="mb-8">
          <ProductSearch
            onSearch={handleSearch}
            onSort={handleSort}
            onFilter={handleFilter}
          />
        </div>
        <ProductGrid filters={filters} />
        
        {/* Trust Banner Section */}
        <div className="mt-16 mb-12">
          <TrustBanner 
            title="Shop With Confidence" 
            badgeSize="large" 
            columns={3}
            className="shadow-md"
          />
        </div>
      </div>
    </div>
  );
};

export default Products;
