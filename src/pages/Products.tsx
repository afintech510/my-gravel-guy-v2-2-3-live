
import React from 'react';
import ProductGrid from '../components/ProductGrid';

const Products = () => {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-12">Our Products</h1>
        <ProductGrid />
      </div>
    </div>
  );
};

export default Products;
