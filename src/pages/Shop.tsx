
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import ProductGrid from '../components/ProductGrid';
import ProductFilterSelector from '../components/product-calculator/ProductFilterSelector';
import TrustBanner from '../components/products/trust/TrustBanner';
import QuoteForm from '../components/forms/QuoteForm';
import { Product } from '@/services/productTypes';

const Shop = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    sort: 'nameAsc',
    category: 'all',
    subcategory: '',
    size: ''
  });

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilters(prev => ({ ...prev, search: term }));
  };

  const handleProductSelected = (product: Product | null) => {
    setSelectedProduct(product);
  };

  // Update filters when category changes from ProductFilterSelector
  const handleCategoryFilter = (category: string) => {
    setFilters(prev => ({ ...prev, category, subcategory: '', size: '' }));
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <h1 className="text-4xl font-bold text-center mb-8">Shop Premium Materials</h1>
        
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-12 text-lg"
            />
          </div>
        </div>

        {/* Category Selector */}
        <div className="mb-8">
          <ProductFilterSelector
            onProductSelected={handleProductSelected}
            selectedProduct={selectedProduct}
          />
        </div>

        {/* Product Grid */}
        <div className="mb-16">
          <ProductGrid 
            filters={filters} 
            limit={50}
          />
        </div>

        {/* Trust Banner */}
        <div className="mb-16">
          <TrustBanner 
            title="Shop With Confidence" 
            badgeSize="large" 
            columns={3}
            className="shadow-md"
          />
        </div>

        {/* Quote Form */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Need a Custom Quote?</h2>
            <p className="text-gray-600 text-center mb-8">
              Get personalized pricing for your project. Our experts will help you find the perfect materials.
            </p>
            <QuoteForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
