
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getProducts } from '@/services/productService';
import { Product } from '@/services/productTypes';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Minus } from 'lucide-react';

const ShoppingModule = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('gravel');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Material categories with icons
  const categories = [
    { id: 'all', name: 'All Products', icon: '📦' },
    { id: 'gravel', name: 'Gravel', icon: '🪨' },
    { id: 'rock', name: 'Rock & Stone', icon: '🗿' },
    { id: 'crushed-gravel', name: 'Crushed Gravel', icon: '⚒️' },
    { id: 'crushed-concrete', name: 'Crushed Concrete', icon: '🏗️' },
    { id: 'dirt', name: 'Soil & Dirt', icon: '🌱' },
    { id: 'sand', name: 'Sand', icon: '🏖️' },
    { id: 'mulch', name: 'Mulch', icon: '🌿' }
  ];

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const allProducts = await getProducts();
        setProducts(allProducts);
        
        // Initialize quantities
        const initialQuantities: Record<string, number> = {};
        allProducts.forEach(product => {
          initialQuantities[product.id.toString()] = 5; // Default 5 tons
        });
        setQuantities(initialQuantities);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Filter products based on selected category
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => {
        const categoryMatch = 
          product.category === selectedCategory ||
          (product.categories && product.categories.includes(selectedCategory)) ||
          product.name.toLowerCase().includes(selectedCategory);
        return categoryMatch;
      });
      setFilteredProducts(filtered);
    }
  }, [selectedCategory, products]);

  const updateQuantity = (productId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 5) + change)
    }));
  };

  const handleAddToCart = (product: Product) => {
    const quantity = quantities[product.id.toString()] || 5;
    addToCart({
      ...product,
      tons: quantity
    });
    
    toast({
      title: "Added to Cart",
      description: `${quantity} tons of ${product.name} added to cart.`,
    });
  };

  const getProductImage = (product: Product) => {
    return product.images?.[0] || product.image || '/lovable-uploads/85eef0fe-9a59-406e-ba6b-54e1aaf6f56b.png';
  };

  const calculateCubicYards = (tons: number, product: Product) => {
    const tonYardRatio = product.tonYardRatio || 1.5;
    return (tons / tonYardRatio).toFixed(1);
  };

  if (loading) {
    return (
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-8">Shop Materials</h2>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-4">Shop Materials</h2>
          <p className="text-gray-600">Select your material and add to cart for delivery</p>
        </div>

        {/* Material Category Selector */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Material Category</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-lg mb-1">{category.icon}</div>
                  {category.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Materials */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Available Materials</h3>
            
            {filteredProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No products found for this category</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredProducts.map((product) => {
                  const quantity = quantities[product.id.toString()] || 5;
                  const totalPrice = (product.price * quantity).toFixed(2);
                  const cubicYards = calculateCubicYards(quantity, product);
                  
                  return (
                    <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <img
                        src={getProductImage(product)}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      
                      <div className="flex-1">
                        <h4 className="font-semibold">{product.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                        {product.size && (
                          <p className="text-xs text-gray-500 mt-1">{product.size}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="flex items-center border rounded-md mb-1">
                            <button
                              onClick={() => updateQuantity(product.id.toString(), -1)}
                              className="p-2 hover:bg-gray-100"
                              disabled={quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-4 py-2 font-medium">{quantity} tons</span>
                            <button
                              onClick={() => updateQuantity(product.id.toString(), 1)}
                              className="p-2 hover:bg-gray-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <div className="text-xs text-gray-500">≈ {cubicYards} cubic yards</div>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold">${totalPrice}</div>
                          <Button 
                            onClick={() => handleAddToCart(product)}
                            className="bg-green-500 hover:bg-green-600 text-white mt-1"
                            size="sm"
                          >
                            Add to Cart
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShoppingModule;
