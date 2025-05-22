
import React, { useState } from 'react';
import ProductGrid from '../components/ProductGrid';
import ProductSearch from '../components/ProductSearch';
import TrustBanner from '../components/products/trust/TrustBanner';
import { useToast } from "@/components/ui/use-toast";

const Products = () => {
  const [filters, setFilters] = useState({
    search: '',
    sort: 'nameAsc',
    category: 'all',
    subcategory: '',
    size: ''
  });
  const { toast } = useToast();

  const handleSearch = (term: string) => {
    setFilters(prev => ({ ...prev, search: term }));
  };

  const handleSort = (option: string) => {
    setFilters(prev => ({ ...prev, sort: option }));
  };

  const handleFilter = (category: string, subcategory: string = '', size: string = '') => {
    console.log(`Products: handleFilter called with category=${category}, subcategory=${subcategory}, size=${size}`);
    
    // If subcategory is "all", treat it as no specific subcategory
    const effectiveSubcategory = subcategory === 'all' ? '' : subcategory;
    
    setFilters(prev => ({ 
      ...prev, 
      category, 
      subcategory: effectiveSubcategory,
      size
    }));
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">Premium Aggregates for All Projects</h1>
        <div className="mb-8">
          <ProductSearch
            onSearch={handleSearch}
            onSort={handleSort}
            onFilter={handleFilter}
          />
        </div>
        
        <ProductGrid filters={filters} limit={100} />
        
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
