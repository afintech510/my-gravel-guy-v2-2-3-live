
import React from 'react';
import ProductCard, { Product } from './ProductCard';

const sampleProducts: Product[] = [
  {
    id: 1,
    name: "River Rock Gravel",
    description: "Smooth, rounded stones perfect for landscaping",
    price: 45.99,
    image: "/placeholder.svg",
    category: "gravel"
  },
  {
    id: 2,
    name: "Fine Sand",
    description: "High-quality sand for construction and landscaping",
    price: 35.99,
    image: "/placeholder.svg",
    category: "sand"
  },
  {
    id: 3,
    name: "Premium Topsoil",
    description: "Rich, organic soil for gardening",
    price: 29.99,
    image: "/placeholder.svg",
    category: "dirt"
  },
];

const ProductGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sampleProducts.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};

export default ProductGrid;
