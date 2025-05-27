import React, { useState, useEffect } from 'react';
import { getProducts } from '@/services/productService';
import { Product, PriceTier } from '@/services/productTypes';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { useNavigate } from 'react-router-dom';
import { getPriceTiersForProduct, getPriceAdjustmentForZipCode, findPriceMultiplierForQuantity } from '@/services/products/pricingUtils';
import CategorySelector from './shopping/CategorySelector';
import ProductList from './shopping/ProductList';
import { categories } from './shopping/categoryData';

interface ProductPricing {
  productId: string;
  priceTiers: PriceTier[];
  zipAdjustment: number;
}

const ShoppingModule = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('popular');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [productPricing, setProductPricing] = useState<Record<string, ProductPricing>>({});
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { zipCode } = useZipCode();
  const navigate = useNavigate();

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
      const pricingPromises = allProducts.map(async product => {
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

  // Enhanced product filtering with better category matching
  useEffect(() => {
    if (!products.length) return;

    let filtered: Product[] = [];

    if (selectedCategory === 'popular') {
      // Show most popular products across categories
      const popularKeywords = ['river', 'decomposed granite', 'pea gravel', '57 stone', 'fill dirt'];
      filtered = products.filter(product => 
        popularKeywords.some(keyword => 
          product.name.toLowerCase().includes(keyword.toLowerCase()) ||
          product.description.toLowerCase().includes(keyword.toLowerCase())
        )
      ).slice(0, 8); // Limit to 8 most popular
    } else {
      const category = categories.find(cat => cat.id === selectedCategory);
      if (category) {
        filtered = products.filter(product => {
          // Check if product matches category by name, description, or keywords
          const nameMatch = category.keywords.some(keyword =>
            product.name.toLowerCase().includes(keyword.toLowerCase())
          );
          const descMatch = category.keywords.some(keyword =>
            product.description.toLowerCase().includes(keyword.toLowerCase())
          );
          const categoryMatch = product.category === selectedCategory || 
                               (product.categories && product.categories.includes(selectedCategory));
          
          return nameMatch || descMatch || categoryMatch;
        });
      }
    }

    setFilteredProducts(filtered);
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
      description: `${quantity} tons of ${product.name} added to cart.`
    });

    // Navigate to cart page for delivery info completion
    navigate('/cart');
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

        <CategorySelector
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />

        <ProductList
          categories={categories}
          selectedCategory={selectedCategory}
          filteredProducts={filteredProducts}
          quantities={quantities}
          onQuantityChange={updateQuantity}
          onAddToCart={handleAddToCart}
          onCategorySelect={setSelectedCategory}
          calculateFinalPrice={calculateFinalPrice}
          getProductImage={getProductImage}
        />
      </div>
    </div>
  );
};

export default ShoppingModule;
