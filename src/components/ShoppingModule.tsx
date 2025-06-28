import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getProducts } from '@/services/productService';
import { Product } from '@/services/productTypes';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, Package, Layers, Mountain, RockingChair, Building2, Shovel, Waves, Flower, ExternalLink, Scale } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPriceAdjustmentForZipCode } from '@/services/products/pricingUtils';
import { calculateProductExponentialPrice } from '@/services/products/exponentialPricing';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductPricing {
  productId: string;
  zipAdjustment: number;
}

const ShoppingModule = () => {
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState<string>('gravel');
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [productPricing, setProductPricing] = useState<Record<string, ProductPricing>>({});
  const [syncTons, setSyncTons] = useState(false);
  const [masterQuantity, setMasterQuantity] = useState(5);
  const {
    addToCart
  } = useCart();
  const {
    toast
  } = useToast();
  const {
    zipCode
  } = useZipCode();
  const navigate = useNavigate();

  // Material categories with Lucide icons (matching ShopProductFilterSelector)
  const categories = [{
    id: 'all',
    label: 'All Products',
    icon: <Package className="h-5 w-5" />
  }, {
    id: 'gravel',
    label: 'Gravel',
    icon: <Layers className="h-5 w-5" />
  }, {
    id: 'rock',
    label: 'Rock & Stone',
    icon: <Mountain className="h-5 w-5" />
  }, {
    id: 'crushed-gravel',
    label: 'Crushed Gravel',
    icon: <RockingChair className="h-5 w-5" />
  }, {
    id: 'crushed-concrete',
    label: 'Crushed Concrete',
    icon: <Building2 className="h-5 w-5" />
  }, {
    id: 'soil-dirt',
    label: 'Soil & Dirt',
    icon: <Shovel className="h-5 w-5" />
  }, {
    id: 'sand',
    label: 'Sand',
    icon: <Waves className="h-5 w-5" />
  }, {
    id: 'mulch',
    label: 'Mulch',
    icon: <Flower className="h-5 w-5" />
  }];

  // Load products and initialize pricing data
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const allProducts = await getProducts();
        setProducts(allProducts);

        // Initialize quantities with minimum of 3 tons
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

  // Preload ZIP adjustments for all products
  const preloadPricingData = async (allProducts: Product[]) => {
    try {
      console.log('Preloading pricing data for', allProducts.length, 'products');

      // Get ZIP code adjustment once
      const zipAdjustment = zipCode ? await getPriceAdjustmentForZipCode(zipCode) : 1;

      // Create pricing lookup for all products
      const pricingLookup: Record<string, ProductPricing> = {};
      allProducts.forEach(product => {
        pricingLookup[product.id.toString()] = {
          productId: product.id.toString(),
          zipAdjustment
        };
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
          const updatedPricing = {
            ...productPricing
          };
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

  // Filter products based on selected category (matching ShopProductFilterSelector logic)
  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => {
        const productCategory = product.category?.toLowerCase() || '';
        console.log(`Checking product: ${product.name}, category: ${productCategory}`);
        switch (selectedCategory) {
          case 'gravel':
            const isGravel = productCategory === 'gravel';
            if (isGravel) console.log(`Product ${product.name} included as gravel`);
            return isGravel;
          case 'rock':
            const isRockOrStone = productCategory === 'rock' || productCategory === 'stone' || productCategory === 'rock-stone';
            if (isRockOrStone) console.log(`Product ${product.name} included as rock or stone`);
            return isRockOrStone;
          case 'crushed-gravel':
            return productCategory === 'crushed-gravel' || productCategory.includes('crushed-gravel');
          case 'crushed-concrete':
            return productCategory === 'crushed-concrete';
          case 'soil-dirt':
            return productCategory === 'soil' || productCategory === 'dirt';
          case 'sand':
            return productCategory === 'sand';
          case 'mulch':
            return productCategory === 'mulch';
          default:
            return false;
        }
      });
      setFilteredProducts(filtered);
    }
  }, [selectedCategory, products]);

  // Calculate final price using exponential pricing model
  const calculateFinalPrice = (product: Product, tons: number): number => {
    const productId = product.id.toString();
    const pricing = productPricing[productId];

    // Calculate exponential price
    const exponentialResult = calculateProductExponentialPrice(product, tons);

    // Apply ZIP code adjustment if available
    const zipAdjustment = pricing?.zipAdjustment || 1;
    const pricePerTon = exponentialResult.pricePerTon * zipAdjustment;
    const totalPrice = pricePerTon * tons;
    return Math.round(totalPrice * 100) / 100;
  };

  // Calculate price per ton with adjustments
  const calculatePricePerTon = (product: Product, tons: number): number => {
    const productId = product.id.toString();
    const pricing = productPricing[productId];

    // Calculate exponential price
    const exponentialResult = calculateProductExponentialPrice(product, tons);

    // Apply ZIP code adjustment if available
    const zipAdjustment = pricing?.zipAdjustment || 1;
    const pricePerTon = exponentialResult.pricePerTon * zipAdjustment;
    return Math.round(pricePerTon * 100) / 100;
  };
  const updateQuantity = (productId: string, change: number) => {
    if (syncTons) {
      // Update master quantity and sync all products
      const newMasterQuantity = Math.max(3, masterQuantity + change);
      setMasterQuantity(newMasterQuantity);

      // Update all product quantities to match master quantity
      const updatedQuantities: Record<string, number> = {};
      filteredProducts.forEach(product => {
        updatedQuantities[product.id.toString()] = newMasterQuantity;
      });
      setQuantities(prev => ({
        ...prev,
        ...updatedQuantities
      }));
    } else {
      // Update individual product quantity
      setQuantities(prev => ({
        ...prev,
        [productId]: Math.max(3, (prev[productId] || 5) + change)
      }));
    }
  };
  const handleSyncToggle = (checked: boolean) => {
    setSyncTons(checked);
    if (checked) {
      // When enabling sync, set all quantities to the master quantity
      const updatedQuantities: Record<string, number> = {};
      filteredProducts.forEach(product => {
        updatedQuantities[product.id.toString()] = masterQuantity;
      });
      setQuantities(prev => ({
        ...prev,
        ...updatedQuantities
      }));
    }
  };
  const handleAddToCart = (product: Product) => {
    const quantity = quantities[product.id.toString()] || 5;
    addToCart({
      ...product,
      tons: quantity
    });

    // Navigate to cart page for delivery info completion
    navigate('/cart');
    
    // Scroll to top on mobile after navigation
    if (isMobile) {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };
  const getProductImage = (product: Product) => {
    return product.images?.[0] || product.image || '/lovable-uploads/85eef0fe-9a59-406e-ba6b-54e1aaf6f56b.png';
  };
  if (loading) {
    return <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-8">Shop Materials</h2>
            <p className="text-gray-600">Loading products...</p>
          </div>
        </div>
      </div>;
  }
  return <div className="py-8 md:py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 mx-0">Quick Price Compare ⚖️</h2>
          
        </div>

        {/* Material Category Selector - Updated with Lucide icons and primary styling */}
        <Card className="mb-6 md:mb-8">
          <CardContent className="p-4 md:p-6">
            <h3 className="text-base md:text-lg font-semibold mb-4">FREE SHIPPING NATIONWIDE</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
              {categories.map(category => <button key={category.id} onClick={() => setSelectedCategory(category.id)} className={cn("flex items-center justify-center p-3 border rounded-md transition-colors", selectedCategory === category.id ? "bg-primary text-primary-foreground border-primary" : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200")}>
                  {category.icon}
                  <span className={cn("ml-2", isMobile ? "text-xs" : "text-sm")}>
                    {category.label}
                  </span>
                </button>)}
            </div>
          </CardContent>
        </Card>

        {/* Available Materials */}
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base md:text-lg font-semibold">Available Materials</h3>
              <div className="flex items-center space-x-2">
                <Checkbox id="sync-tons" checked={syncTons} onCheckedChange={handleSyncToggle} />
                <label htmlFor="sync-tons" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Sync Tons
                </label>
              </div>
            </div>
            
            {filteredProducts.length === 0 ? <p className="text-gray-500 text-center py-8">No products found for this category</p> : <div className="grid grid-cols-1 gap-4 md:gap-6">
                {filteredProducts.map(product => {
              const quantity = quantities[product.id.toString()] || 5;
              const totalPrice = calculateFinalPrice(product, quantity);
              const pricePerTon = calculatePricePerTon(product, quantity);
              const cubicYards = Math.round(quantity / (product.tonYardRatio || 1.5) * 10) / 10;
              return <div key={product.id} className="border rounded-lg p-4">
                      {/* Mobile Layout */}
                      <div className="md:hidden space-y-4">
                        <div className="flex items-start gap-3">
                          <img src={getProductImage(product)} alt={product.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm leading-tight">{product.name}</h4>
                            {product.size && <p className="text-xs text-gray-500 mt-1">{product.size}</p>}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/products/${product.slug}`)}
                              className="mt-2 h-6 text-xs border-green-500 bg-gray-50 hover:bg-gray-100 text-green-700"
                            >
                              <ExternalLink className="mr-1 h-3 w-3" />
                              Explore
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border rounded-md">
                            <button 
                              onClick={() => updateQuantity(product.id.toString(), -1)} 
                              className="p-3 hover:bg-gray-100 min-h-[48px] min-w-[48px] flex items-center justify-center" 
                              disabled={quantity <= 3}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <div className="px-3 py-2 text-center">
                              <div className="text-sm font-medium">{quantity} tons</div>
                              <div className="text-xs text-gray-500">≡ {cubicYards} yd³</div>
                              <div className="text-xs text-green-600 font-medium">${pricePerTon.toFixed(2)}/ton</div>
                            </div>
                            <button 
                              onClick={() => updateQuantity(product.id.toString(), 1)} 
                              className="p-3 hover:bg-gray-100 min-h-[48px] min-w-[48px] flex items-center justify-center"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-bold">${totalPrice.toFixed(2)}</div>
                            <Button onClick={() => handleAddToCart(product)} className="bg-green-500 hover:bg-green-600 text-white mt-1" size="sm">
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout */}
                      <div className="hidden md:flex items-center gap-4">
                        <img src={getProductImage(product)} alt={product.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                        
                        <div className="flex-1">
                          <h4 className="font-semibold">{product.name}</h4>
                          {product.size && <p className="text-sm text-gray-500">{product.size}</p>}
                           {product.short_description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.short_description}</p>}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/products/${product.slug}`)}
                            className="mt-2 h-7 text-sm border-green-500 bg-gray-50 hover:bg-gray-100 text-green-700"
                          >
                            <ExternalLink className="mr-2 h-3 w-3" />
                            Explore
                          </Button>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center border rounded-md">
                            <button 
                              onClick={() => updateQuantity(product.id.toString(), -1)} 
                              className="p-3 hover:bg-gray-100 min-h-[52px] min-w-[52px] flex items-center justify-center" 
                              disabled={quantity <= 3}
                            >
                              <Minus className="h-5 w-5" />
                            </button>
                            <div className="px-4 py-2 text-center">
                              <div className="font-medium">{quantity} tons</div>
                              <div className="text-xs text-gray-500">≡ {cubicYards} yd³</div>
                              <div className="text-xs text-green-600 font-medium">${pricePerTon.toFixed(2)}/ton</div>
                            </div>
                            <button 
                              onClick={() => updateQuantity(product.id.toString(), 1)} 
                              className="p-3 hover:bg-gray-100 min-h-[52px] min-w-[52px] flex items-center justify-center"
                            >
                              <Plus className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-bold">${totalPrice.toFixed(2)}</div>
                            <Button onClick={() => handleAddToCart(product)} className="bg-green-500 hover:bg-green-600 text-white mt-1" size="sm">
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>;
            })}
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
};

export default ShoppingModule;
