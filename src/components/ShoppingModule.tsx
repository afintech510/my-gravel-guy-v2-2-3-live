import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getProducts } from '@/services/productService';
import { Product, PriceTier } from '@/services/productTypes';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { 
  getPriceTiersForProduct, 
  getPriceAdjustmentForZipCode,
  findPriceMultiplierForQuantity 
} from '@/services/products/pricingUtils';

interface ProductPricing {
  productId: string;
  priceTiers: PriceTier[];
  zipAdjustment: number;
}

const ShoppingModule = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('gravel');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [productPricing, setProductPricing] = useState<Record<string, ProductPricing>>({});
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { zipCode } = useZipCode();

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

  // Load products and initialize pricing data
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

        // Preload pricing data for all products
        await preloadPricingData(allProducts);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Preload pricing tiers and ZIP adjustments for all products
  const preloadPricingData = async (allProducts: Product[]) => {
    try {
      console.log('Preloading pricing data for', allProducts.length, 'products');
      
      // Get ZIP code adjustment once
      const zipAdjustment = zipCode ? await getPriceAdjustmentForZipCode(zipCode) : 1;
      
      // Load price tiers for all products in parallel
      const pricingPromises = allProducts.map(async (product) => {
        try {
          const priceTiers = await getPriceTiersForProduct(product.id);
          return {
            productId: product.id.toString(),
            priceTiers,
            zipAdjustment
          };
        } catch (error) {
          console.error(`Error loading pricing for product ${product.id}:`, error);
          return {
            productId: product.id.toString(),
            priceTiers: [],
            zipAdjustment
          };
        }
      });

      const allPricingData = await Promise.all(pricingPromises);
      
      // Convert to lookup object
      const pricingLookup: Record<string, ProductPricing> = {};
      allPricingData.forEach(data => {
        pricingLookup[data.productId] = data;
      });
      
      setProductPricing(pricingLookup);
      console.log('Pricing data preloaded for', Object.keys(pricingLookup).length, 'products');
    } catch (error) {
      console.error('Error preloading pricing data:', error);
    }
  };

  // Update ZIP adjustment when ZIP code changes
  useEffect(() => {
    if (zipCode && Object.keys(productPricing).length > 0) {
      const updateZipAdjustment = async () => {
        try {
          const newZipAdjustment = await getPriceAdjustmentForZipCode(zipCode);
          
          // Update all product pricing with new ZIP adjustment
          const updatedPricing = { ...productPricing };
          Object.keys(updatedPricing).forEach(productId => {
            updatedPricing[productId] = {
              ...updatedPricing[productId],
              zipAdjustment: newZipAdjustment
            };
          });
          
          setProductPricing(updatedPricing);
        } catch (error) {
          console.error('Error updating ZIP adjustment:', error);
        }
      };
      
      updateZipAdjustment();
    }
  }, [zipCode]);

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

  // Calculate final price with tiered pricing and ZIP adjustment
  const calculateFinalPrice = (product: Product, tons: number): number => {
    const productId = product.id.toString();
    const pricing = productPricing[productId];
    
    if (!pricing) {
      // Fallback to base price if pricing data not loaded
      return product.price * tons;
    }

    // Get the appropriate multiplier for the quantity
    const multiplier = findPriceMultiplierForQuantity(pricing.priceTiers, tons);
    
    // Calculate: base price * multiplier * zip adjustment * tons
    const pricePerTon = product.price * multiplier * pricing.zipAdjustment;
    const totalPrice = pricePerTon * tons;
    
    return Math.round(totalPrice * 100) / 100;
  };

  // Calculate price per ton with adjustments
  const calculatePricePerTon = (product: Product, tons: number): number => {
    const productId = product.id.toString();
    const pricing = productPricing[productId];
    
    if (!pricing) {
      return product.price;
    }

    const multiplier = findPriceMultiplierForQuantity(pricing.priceTiers, tons);
    const pricePerTon = product.price * multiplier * pricing.zipAdjustment;
    
    return Math.round(pricePerTon * 100) / 100;
  };

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
    <div className="py-8 md:py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Shop Materials</h2>
          <p className="text-gray-600">Select your material and add to cart for delivery</p>
        </div>

        {/* Material Category Selector */}
        <Card className="mb-6 md:mb-8">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-4">Material Category</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-3">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-2 md:p-3 rounded-lg border text-xs md:text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-green-500 text-white border-green-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-base md:text-lg mb-1">{category.icon}</div>
                  <div className="leading-tight">{category.name}</div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Available Materials */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-4">Available Materials</h3>
            
            {filteredProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No products found for this category</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:gap-6">
                {filteredProducts.map((product) => {
                  const quantity = quantities[product.id.toString()] || 5;
                  const totalPrice = calculateFinalPrice(product, quantity);
                  const cubicYards = Math.round((quantity / (product.tonYardRatio || 1.5)) * 10) / 10;
                  
                  return (
                    <div key={product.id} className="border rounded-lg p-4">
                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-4">
                        <div className="flex items-start gap-3">
                          <img
                            src={getProductImage(product)}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm leading-tight">{product.name}</h4>
                            {product.size && (
                              <p className="text-xs text-gray-500 mt-1">{product.size}</p>
                            )}
                            <Link
                              to={`/products/${product.slug}`}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                            >
                              More Details...
                            </Link>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border rounded-md">
                            <button
                              onClick={() => updateQuantity(product.id.toString(), -1)}
                              className="p-2 hover:bg-gray-100"
                              disabled={quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <div className="px-3 py-2 text-center">
                              <div className="text-sm font-medium">{quantity} tons</div>
                              <div className="text-xs text-gray-500">≡ {cubicYards} yd³</div>
                            </div>
                            <button
                              onClick={() => updateQuantity(product.id.toString(), 1)}
                              className="p-2 hover:bg-gray-100"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-bold">${totalPrice.toFixed(2)}</div>
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

                      {/* Desktop Layout */}
                      <div className="hidden md:flex items-center gap-4">
                        <img
                          src={getProductImage(product)}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                        />
                        
                        <div className="flex-1">
                          <h4 className="font-semibold">{product.name}</h4>
                          {product.size && (
                            <p className="text-sm text-gray-500">{product.size}</p>
                          )}
                          <Link
                            to={`/products/${product.slug}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            More Details...
                          </Link>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center border rounded-md">
                            <button
                              onClick={() => updateQuantity(product.id.toString(), -1)}
                              className="p-2 hover:bg-gray-100"
                              disabled={quantity <= 1}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <div className="px-4 py-2 text-center">
                              <div className="font-medium">{quantity} tons</div>
                              <div className="text-xs text-gray-500">≡ {cubicYards} yd³</div>
                            </div>
                            <button
                              onClick={() => updateQuantity(product.id.toString(), 1)}
                              className="p-2 hover:bg-gray-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-bold">${totalPrice.toFixed(2)}</div>
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
