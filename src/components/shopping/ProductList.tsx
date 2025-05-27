
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/services/productTypes';
import { Category } from './categoryData';
import ProductCard from './ProductCard';

interface ProductListProps {
  categories: Category[];
  selectedCategory: string;
  filteredProducts: Product[];
  quantities: Record<string, number>;
  onQuantityChange: (productId: string, change: number) => void;
  onAddToCart: (product: Product) => void;
  onCategorySelect: (categoryId: string) => void;
  calculateFinalPrice: (product: Product, tons: number) => number;
  getProductImage: (product: Product) => string;
}

const ProductList: React.FC<ProductListProps> = ({
  categories,
  selectedCategory,
  filteredProducts,
  quantities,
  onQuantityChange,
  onAddToCart,
  onCategorySelect,
  calculateFinalPrice,
  getProductImage
}) => {
  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base md:text-lg font-semibold">
            {categories.find(cat => cat.id === selectedCategory)?.name || 'Available Materials'}
          </h3>
          <span className="text-sm text-gray-500">
            {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </span>
        </div>
        
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No products found for this category</p>
            <Button 
              onClick={() => onCategorySelect('popular')} 
              variant="outline"
              size="sm"
            >
              View Popular Items
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:gap-6">
            {filteredProducts.map(product => {
              const quantity = quantities[product.id.toString()] || 5;
              const totalPrice = calculateFinalPrice(product, quantity);
              
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  quantity={quantity}
                  totalPrice={totalPrice}
                  onQuantityChange={onQuantityChange}
                  onAddToCart={onAddToCart}
                  getProductImage={getProductImage}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductList;
