
import React, { useState } from 'react';
import ProductGrid from '../components/ProductGrid';
import ProductSearch from '../components/ProductSearch';
import TrustBanner from '../components/products/trust/TrustBanner';
import ProductDatabaseTest from '../components/ProductDatabaseTest'; // Add this import
import { useToast } from "@/components/ui/use-toast";

const Products = () => {
  const [filters, setFilters] = useState({
    search: '',
    sort: 'nameAsc',
    category: 'all'
  });
  const { toast } = useToast();
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const handleSearch = (term: string) => {
    setFilters(prev => ({ ...prev, search: term }));
  };

  const handleSort = (option: string) => {
    setFilters(prev => ({ ...prev, sort: option }));
  };

  const handleFilter = (category: string) => {
    setFilters(prev => ({ ...prev, category }));
    
    if (category !== 'all') {
      toast({
        title: "Category selected",
        description: `Showing ${category} products`,
        duration: 2000,
      });
    }
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
        
        {/* Diagnostics Toggle */}
        <div className="mb-8 flex justify-end">
          <button 
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="text-sm text-gray-500 underline"
          >
            {showDiagnostics ? 'Hide Database Diagnostics' : 'Show Database Diagnostics'}
          </button>
        </div>
        
        {showDiagnostics && (
          <div className="mb-8">
            <ProductDatabaseTest />
          </div>
        )}
        
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
