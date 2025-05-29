
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import ShopProductFilterSelector from '../components/shop/ShopProductFilterSelector';
import ShopProductGrid from '../components/shop/ShopProductGrid';
import TrustBanner from '../components/products/trust/TrustBanner';
import QuoteForm from '../components/forms/QuoteForm';
import { Product } from '@/services/productTypes';

const Shop = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filters: { category: string; filteredProducts: Product[] }) => {
    setFilteredProducts(filters.filteredProducts);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">Shop Premium Materials</h1>
        
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <Input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 h-12 text-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
            />
          </div>
        </div>

        {/* Category Selector */}
        <div className="mb-8">
          <ShopProductFilterSelector
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Product Grid */}
        <div className="mb-16">
          <ShopProductGrid 
            products={filteredProducts}
            loading={isLoading}
            searchTerm={searchTerm}
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
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">Need a Custom Quote?</h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
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
