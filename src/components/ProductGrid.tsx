
import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Product, getProducts } from '../services/productService';
import { Skeleton } from "@/components/ui/skeleton";

const ProductGrid = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
        setError(null);
      } catch (err) {
        console.error("Failed to load products:", err);
        setError("Failed to load products. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-full">
            <Skeleton className="h-64 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <p>Showing sample products instead:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {/* Fallback to sample products */}
          {sampleProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.length > 0 ? (
        products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))
      ) : (
        <div className="col-span-3 text-center py-8">
          <p>No products found.</p>
        </div>
      )}
    </div>
  );
};

// Sample products as fallback
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

export default ProductGrid;
