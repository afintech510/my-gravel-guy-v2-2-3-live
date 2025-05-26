import React, { useState, useEffect } from 'react';
import { 
  Truck, Map, Shovel, Trees, Building
} from 'lucide-react';
import { MaterialCategory, MaterialSubcategory } from './ShopCalculator';
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';
import { Card } from '@/components/ui/card';
import ProductGallery from './ProductGallery';
import { getProducts } from '@/services/productService';
import { Product } from '@/services/productTypes';

type ShopMaterialSelectorProps = {
  selectedCategory: MaterialCategory;
  setSelectedCategory: (category: MaterialCategory) => void;
  selectedSubcategory: MaterialSubcategory;
  setSelectedSubcategory: (subcategory: MaterialSubcategory) => void;
  productImages: string[];
  onProductSelected?: (product: Product | null) => void;
};

const ShopMaterialSelector: React.FC<ShopMaterialSelectorProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  productImages,
  onProductSelected
}) => {
  const isMobile = useIsMobile();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Category definitions with icons
  const categories: Array<{id: MaterialCategory, name: string, icon: JSX.Element}> = [
    { id: 'gravel', name: 'Gravel', icon: <Truck className="h-5 w-5" /> },
    { id: 'base', name: 'Base', icon: <Building className="h-5 w-5" /> },
    { id: 'dirt', name: 'Dirt', icon: <Shovel className="h-5 w-5" /> },
    { id: 'sand', name: 'Sand', icon: <Map className="h-5 w-5" /> },
    { id: 'mulch', name: 'Mulch', icon: <Trees className="h-5 w-5" /> }
  ];

  // Define subcategories for each material category - only include ShopMaterialCategory types
  const subcategories: Record<MaterialCategory, MaterialSubcategory[]> = {
    sand: ['washed-sand', 'mason-sand', 'playground-sand', 'pool-sand', 'beach-sand'],
    dirt: ['fill-dirt', 'top-soil', 'compost', 'loam', 'sandy-loam'],
    mulch: ['natural', 'black', 'chocolate-brown', 'red', 'request'],
    base: ['57-crushed-stone', 'crusher-run', 'road-base', 'rca-crushed-concrete', 'drainage-rock'],
    gravel: ['driveway', 'walkway', 'landscape', 'natural', 'construction']
  };

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const allProducts = await getProducts();
        setProducts(allProducts);
        console.log('ShopMaterialSelector: Loaded products:', allProducts.length);
      } catch (error) {
        console.error('ShopMaterialSelector: Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, []);

  // Filter products based on selected category and subcategory
  useEffect(() => {
    if (!products || products.length === 0) return;
    
    const filtered = products.filter(product => {
      // Match category
      const categoryMatch = product.category === selectedCategory ||
        (product.categories && product.categories.includes(selectedCategory));
      
      if (!categoryMatch) return false;
      
      // Match subcategory if selected
      if (selectedSubcategory) {
        // Check in various fields for subcategory match
        const subcategoryMatch = 
          (product.subtype && product.subtype.toLowerCase().includes(selectedSubcategory)) ||
          (product.categories && product.categories.some(cat => 
            cat.toLowerCase().includes(selectedSubcategory)
          )) ||
          (product.description && product.description.toLowerCase().includes(selectedSubcategory)) ||
          (product.uses && product.uses.some(use => 
            use.toLowerCase().includes(selectedSubcategory)
          ));
          
        if (!subcategoryMatch) return false;
      }
      
      return true;
    });
    
    console.log('ShopMaterialSelector: Filtered products:', filtered.length);
    setFilteredProducts(filtered);
    
    // Reset selected product when filters change
    setSelectedProduct(null);
    if (onProductSelected) {
      onProductSelected(null);
    }
  }, [selectedCategory, selectedSubcategory, products, onProductSelected]);

  // Handle product selection
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    if (onProductSelected) {
      onProductSelected(product);
    }
  };

  // Get formatted display name for subcategory
  const getSubcategoryDisplayName = (subcategory: MaterialSubcategory): string => {
    const nameMap: Record<MaterialSubcategory, string> = {
      'washed-sand': 'Washed Sand',
      'mason-sand': 'Mason Sand',
      'playground-sand': 'Playground Sand',
      'pool-sand': 'Pool Sand',
      'beach-sand': 'Beach Sand',
      'fill-dirt': 'Fill Dirt',
      'top-soil': 'Topsoil',
      'compost': 'Compost',
      'loam': 'Loam',
      'sandy-loam': 'Sandy Loam',
      'natural': 'Natural',
      'black': 'Black',
      'chocolate-brown': 'Chocolate Brown',
      'red': 'Red',
      'request': 'Request',
      '57-crushed-stone': '#57 Crushed Stone',
      'crusher-run': 'Crusher Run',
      'road-base': 'Road Base',
      'rca-crushed-concrete': 'RCA / Crushed Concrete',
      'drainage-rock': 'Drainage Rock',
      'driveway': 'Driveway',
      'walkway': 'Walkway',
      'landscape': 'Landscape',
      'construction': 'Construction',
      'pea-gravel': 'Pea Gravel',
      'river-rock': 'River Rock',
      'crushed-stone': 'Crushed Stone',
      'decorative-gravel': 'Decorative Gravel',
      'drainage-gravel': 'Drainage Gravel'
    };
    
    return nameMap[subcategory] || subcategory.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Get description based on selected category and subcategory
  const getDescription = (category: MaterialCategory, subcategory: MaterialSubcategory): string => {
    if (category === 'gravel') {
      return `Our premium ${getSubcategoryDisplayName(subcategory)} is perfect for driveways, landscaping, and drainage applications.`;
    } else if (category === 'sand') {
      return `${getSubcategoryDisplayName(subcategory)} is ideal for construction, playgrounds, and landscaping projects.`;
    } else if (category === 'dirt') {
      return `${getSubcategoryDisplayName(subcategory)} is perfect for your gardening, landscaping, and construction needs.`;
    } else if (category === 'mulch') {
      return `${getSubcategoryDisplayName(subcategory)} mulch enhances your landscape while protecting plants and improving soil health.`;
    } else if (category === 'base') {
      return `${getSubcategoryDisplayName(subcategory)} provides a sturdy foundation for driveways, patios, and construction projects.`;
    }
    return '';
  };

  return (
    <div className="space-y-6">
      {/* Material Categories Section */}
      <Card className="overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-sm">Material Type</h3>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2 p-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={cn(
                "flex flex-col items-center justify-center p-3 rounded-md transition-colors border",
                selectedCategory === category.id 
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              )}
            >
              {category.icon}
              <span className="mt-1 text-xs font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Material Options Card - No longer collapsible */}
      <Card>
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-sm">Material Options</h3>
        </div>
        
        <div className="p-4 space-y-4">
          {/* Subcategory Selection */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {subcategories[selectedCategory].map(subcategory => (
              <button
                key={subcategory}
                onClick={() => setSelectedSubcategory(subcategory)}
                className={cn(
                  "px-3 py-2 rounded-md border text-sm transition-colors",
                  selectedSubcategory === subcategory
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                )}
              >
                {getSubcategoryDisplayName(subcategory)}
              </button>
            ))}
          </div>
          
          {/* Product Selection - Added this section */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="font-medium text-sm mb-3">Select Product</h4>
            {loading ? (
              <p className="text-sm text-gray-500">Loading products...</p>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleProductSelect(product)}
                    className={cn(
                      "px-3 py-3 rounded-md border text-left transition-colors",
                      selectedProduct?.id === product.id
                        ? 'bg-primary/10 border-primary'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    )}
                  >
                    <p className="font-medium">{product.name}</p>
                    {product.size && (
                      <p className="text-xs text-gray-500 mt-1">Size: {product.size}</p>
                    )}
                    {product.price > 0 && (
                      <p className="text-sm font-semibold mt-1">${product.price.toFixed(2)} per ton</p>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No products available for this selection</p>
            )}
          </div>
          
          {/* Material Description */}
          <div className="pt-4 mt-2 border-t border-gray-100">
            <p className="text-sm text-gray-600">
              {selectedProduct ? selectedProduct.description : getDescription(selectedCategory, selectedSubcategory)}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Product Gallery Card */}
      <Card>
        <div className="p-4">
          <h3 className="font-medium text-sm mb-2">
            {selectedProduct ? selectedProduct.name : getSubcategoryDisplayName(selectedSubcategory)} Preview
          </h3>
          <ProductGallery 
            images={selectedProduct?.images || productImages.slice(0, 3)}
            productName={selectedProduct ? selectedProduct.name : getSubcategoryDisplayName(selectedSubcategory)}
          />
        </div>
      </Card>
    </div>
  );
};

export default ShopMaterialSelector;
