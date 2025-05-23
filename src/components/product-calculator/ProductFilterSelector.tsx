
import React, { useState, useEffect } from 'react';
import { getProducts, getUniqueCategories } from '@/services/productService';
import { Product } from '@/services/productTypes';
import { cn } from '@/lib/utils';
import { Truck, Shovel, Map, Building, Trees } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProductFilterSelectorProps {
  onProductSelected: (product: Product | null) => void;
  selectedProduct: Product | null;
}

export default function ProductFilterSelector({ onProductSelected, selectedProduct }: ProductFilterSelectorProps) {
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [applications, setApplications] = useState<string[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<string>('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Category icons mapping
  const categoryIcons: Record<string, React.ReactNode> = {
    'gravel': <Truck className="h-5 w-5" />,
    'sand': <Map className="h-5 w-5" />,
    'dirt': <Shovel className="h-5 w-5" />,
    'mulch': <Trees className="h-5 w-5" />,
    'base': <Building className="h-5 w-5" />
  };

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const allProducts = await getProducts();
        setProducts(allProducts);
        
        // Get unique categories
        const uniqueCategories = await getUniqueCategories();
        setCategories(uniqueCategories);
        
        // Set initial category if available
        if (uniqueCategories.length > 0) {
          setSelectedCategory(uniqueCategories[0]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading products:', error);
        setLoading(false);
      }
    };
    
    loadProducts();
  }, []);

  // Filter by category and extract applications
  useEffect(() => {
    if (!selectedCategory) return;
    
    const categoryProducts = products.filter(product => 
      product.category === selectedCategory || 
      (product.categories && product.categories.includes(selectedCategory))
    );
    
    // Extract unique applications
    const uniqueApplications = new Set<string>();
    categoryProducts.forEach(product => {
      // Try to find application in various product fields
      if (product.usage) {
        uniqueApplications.add(product.usage);
      }
      
      // Check uses array
      if (product.uses && Array.isArray(product.uses)) {
        product.uses.forEach(use => uniqueApplications.add(use));
      }
      
      // If no specific applications found, add a default one based on category
      if (uniqueApplications.size === 0) {
        uniqueApplications.add(`${selectedCategory} materials`);
      }
    });
    
    const applicationsList = Array.from(uniqueApplications);
    setApplications(applicationsList);
    
    // Reset application selection
    setSelectedApplication('');
    
    // Update filtered products
    setFilteredProducts(categoryProducts);
  }, [selectedCategory, products]);

  // Filter by application and extract sizes
  useEffect(() => {
    if (!selectedApplication) return;
    
    const appProducts = filteredProducts.filter(product => {
      // Check various fields for application match
      return (
        product.usage === selectedApplication ||
        (product.uses && product.uses.includes(selectedApplication))
      );
    });
    
    // If no specific matches, don't filter further
    const productsToUse = appProducts.length > 0 ? appProducts : filteredProducts;
    
    // Extract unique sizes
    const uniqueSizes = new Set<string>();
    productsToUse.forEach(product => {
      if (product.size) {
        uniqueSizes.add(product.size);
      } else if (product.specifications?.size) {
        uniqueSizes.add(product.specifications.size);
      }
    });
    
    const sizesList = Array.from(uniqueSizes);
    setSizes(sizesList);
    
    // Reset size selection
    setSelectedSize('');
    
    // Update filtered products
    setFilteredProducts(productsToUse);
  }, [selectedApplication, filteredProducts]);

  // Filter by size
  useEffect(() => {
    if (!selectedSize) return;
    
    const sizeProducts = filteredProducts.filter(product => {
      return (
        product.size === selectedSize || 
        product.specifications?.size === selectedSize
      );
    });
    
    // Update filtered products
    setFilteredProducts(sizeProducts.length > 0 ? sizeProducts : filteredProducts);
  }, [selectedSize, filteredProducts]);

  // Select a product
  const handleProductSelect = (product: Product) => {
    onProductSelected(product);
  };

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Material Category</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                "flex items-center justify-center p-3 border rounded-md transition-colors",
                selectedCategory === category
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
              )}
            >
              {categoryIcons[category] || null}
              <span className={cn("ml-2", isMobile ? "text-xs" : "text-sm")}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Application Selection - Only show if options exist */}
      {applications.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Application Type</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {applications.map(application => (
              <button
                key={application}
                onClick={() => setSelectedApplication(application)}
                className={cn(
                  "p-2 border rounded-md text-sm transition-colors",
                  selectedApplication === application
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                )}
              >
                {application}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Size Selection - Only show if options exist */}
      {sizes.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Material Size</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {sizes.map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={cn(
                  "p-2 border rounded-md text-sm transition-colors",
                  selectedSize === size
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white hover:bg-gray-50 text-gray-700 border-gray-200"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Products List */}
      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Available Materials</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <p className="text-gray-500">Loading products...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredProducts.slice(0, 10).map(product => (
              <button
                key={product.id}
                onClick={() => handleProductSelect(product)}
                className={cn(
                  "text-left p-4 border rounded-md transition-all hover:shadow-md",
                  selectedProduct?.id === product.id 
                    ? "border-primary bg-primary/5" 
                    : "border-gray-200 bg-white"
                )}
              >
                <div className="flex items-start">
                  {product.image && (
                    <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 mr-4">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  )}
                  <div>
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    {product.price > 0 && (
                      <p className="text-primary font-semibold mt-1">
                        ${product.price.toFixed(2)}/ton
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                      {product.size || product.specifications?.size || ""}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full p-8 text-center text-gray-500 bg-gray-50 rounded-md">
                No products match your selection. Try adjusting your filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
