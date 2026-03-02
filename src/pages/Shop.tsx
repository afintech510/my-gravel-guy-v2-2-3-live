
import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Input } from "@/components/ui/input";
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import ShopProductFilterSelector from '../components/shop/ShopProductFilterSelector';
import ShopProductGrid from '../components/shop/ShopProductGrid';
import ShopTrustBlocks from '../components/shop/ShopTrustBlocks';
import TrustBanner from '../components/products/trust/TrustBanner';
import QuoteForm from '../components/forms/QuoteForm';
import { Product } from '@/services/productTypes';

const Shop = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState('nameAsc');

  // Apply search filter on top of category filter — search by name and category only
  const displayProducts = useMemo(() => {
    if (!searchTerm.trim()) return categoryProducts;
    const term = searchTerm.toLowerCase().trim();
    return categoryProducts.filter(product =>
      product.name.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term)
    );
  }, [categoryProducts, searchTerm]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filters: { category: string; filteredProducts: Product[] }) => {
    setCategoryProducts(filters.filteredProducts);
    setIsLoading(false);
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
  };

  return (
    <>
      <Helmet>
        <title>Shop Bulk Materials Online | My Gravel Guy</title>
        <meta name="description" content="Shop premium gravel, sand, dirt, and mulch online. Filter by category, compare prices, and order for delivery. Volume discounts on 3+ ton orders." />
        <link rel="canonical" href="https://mygravelguy.com/shop" />
        <meta property="og:title" content="Shop Bulk Materials Online | My Gravel Guy" />
        <meta property="og:description" content="Shop premium gravel, sand, dirt, and mulch. Volume discounts on bulk orders delivered nationwide." />
        <meta property="og:url" content="https://mygravelguy.com/shop" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://mygravelguy.com/og-image.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Shop Bulk Materials Online",
            "description": "Shop premium gravel, sand, dirt, and mulch online. Filter by category, compare prices, and order for delivery.",
            "url": "https://mygravelguy.com/shop",
            "provider": {
              "@type": "Organization",
              "name": "My Gravel Guy",
              "url": "https://mygravelguy.com"
            }
          })}
        </script>
      </Helmet>
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Page Header */}
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 text-gray-900 dark:text-gray-100">Shop Premium Materials</h1>
          
          {/* Category Selector - Without heading */}
          <div className="mb-8">
            <ShopProductFilterSelector
              onFilterChange={handleFilterChange}
              sortOrder={sortOrder}
            />
          </div>

          {/* Search Bar, Sort Button, and Materials Header - Same row */}
          <div className="mb-6 flex gap-4 items-center">

           <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
              Materials ({displayProducts.length})
            </h2>
            
            <div className="relative flex-1 max-w-lg">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="text"
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9 h-12 text-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2 h-12 px-4">
                  Sort
                  {sortOrder.includes('Desc') ? (
                    <SortDesc className="h-4 w-4" />
                  ) : (
                    <SortAsc className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-gray-800">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup value={sortOrder} onValueChange={handleSortChange}>
                  <DropdownMenuRadioItem value="nameAsc">Name (A-Z)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="nameDesc">Name (Z-A)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="priceAsc">Price (Low-High)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="priceDesc">Price (High-Low)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="sizeAsc">Size (Small-Large)</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="sizeDesc">Size (Large-Small)</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Product Grid */}
          <div className="mb-16">
            <ShopProductGrid
              products={displayProducts}
              loading={isLoading}
              searchTerm={searchTerm}
            />
          </div>
        </div>
      </div>

      {/* Trust Building Content Blocks */}
      <ShopTrustBlocks />

      {/* Trust Banner */}
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <TrustBanner 
            title="Shop With Confidence" 
            badgeSize="large" 
            columns={3}
            className="shadow-md"
          />
        </div>
      </div>

      {/* Quote Form */}
      <div className="py-16 px-4">
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
    </>
  );
};

export default Shop;
