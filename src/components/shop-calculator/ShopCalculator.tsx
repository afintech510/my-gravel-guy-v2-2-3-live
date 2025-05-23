
import React, { useState, useEffect } from 'react';
import { getProducts } from '@/services/productService';
import { Product } from '@/services/productTypes';
import { useZipCode } from '@/contexts/ZipCodeContext';
import ShopAreaInputs from './ShopAreaInputs';
import DepthSlider from './DepthSlider';
import ExtraSlider from './ExtraSlider';
import ShopCalculationDisplay from './ShopCalculationDisplay';
import ZipCodeSection from './ZipCodeSection';
import ContactForm from './ContactForm';
import ShopMaterialSelector from './ShopMaterialSelector';

// Define types for material selector
export type MaterialCategory = 'gravel' | 'sand' | 'dirt' | 'mulch' | 'base';
export type MaterialSubcategory = string;
export type MaterialSize = string;
export type ApplicationType = string;

interface ShopCalculatorProps {
  onProductSelected?: (product: Product | null) => void;
  selectedProduct?: Product | null;
}

// Define the type for ShopAreaInputs props to fix TypeScript error
interface ShopAreaInputsProps {
  areas: { length: number; width: number }[];
  setAreas: React.Dispatch<React.SetStateAction<{ length: number; width: number }[]>>;
}

const ShopCalculator: React.FC<ShopCalculatorProps> = ({
  onProductSelected,
  selectedProduct
}) => {
  // State for areas (length, width)
  const [areas, setAreas] = useState([{ length: 10, width: 10 }]);
  
  // State for depth (in inches)
  const [depth, setDepth] = useState(4);
  
  // State for extra percentage
  const [extraPercentage, setExtraPercentage] = useState(10);
  
  // Material selection state
  const [materialCategory, setMaterialCategory] = useState<MaterialCategory>('gravel');
  const [materialSubcategory, setMaterialSubcategory] = useState<MaterialSubcategory>('driveway');
  const [materialSize, setMaterialSize] = useState<MaterialSize>('3/4"');
  
  // Product state
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProduct, setFilteredProduct] = useState<Product | null>(null);
  const [productImages, setProductImages] = useState<string[]>([
    '/assets/crushed-stone.png',
    '/assets/river-rocks.png'
  ]);
  
  // ZIP code context
  const { zipCode } = useZipCode();

  // Load products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };
    
    fetchProducts();
  }, []);

  // When a product is selected via ShopMaterialSelector
  const handleProductSelected = (product: Product | null) => {
    console.log('ShopCalculator: Selected product:', product?.name || 'None');
    setFilteredProduct(product);
    
    // Update product images if available
    if (product?.images && product.images.length > 0) {
      setProductImages(product.images);
    }
    
    // Notify parent component if callback provided
    if (onProductSelected) {
      onProductSelected(product);
    }
  };

  // Apply discount handler (passed to ContactForm)
  const handleApplyDiscount = () => {
    console.log('ShopCalculator: Applying discount');
    // You could implement discount logic here
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
      {/* Left column: Material selection and calculator inputs */}
      <div className="p-6">
        <ShopMaterialSelector
          selectedCategory={materialCategory}
          setSelectedCategory={setMaterialCategory}
          selectedSubcategory={materialSubcategory}
          setSelectedSubcategory={setMaterialSubcategory}
          selectedSize={materialSize}
          setSelectedSize={setMaterialSize}
          productImages={productImages}
          onProductSelected={handleProductSelected}
        />
      </div>
      
      {/* Right column: Measurement inputs, calculator, and contact form */}
      <div className="p-6 border-t lg:border-t-0 lg:border-l border-gray-100">
        <div className="space-y-6">
          <h2 className="font-bold text-lg">Calculate Amount Needed</h2>
          
          <ShopAreaInputs
            areas={areas}
            setAreas={setAreas}
          />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <DepthSlider
              depth={depth}
              setDepth={setDepth}
            />
            
            <ExtraSlider
              extraPercentage={extraPercentage}
              setExtraPercentage={setExtraPercentage}
            />
          </div>
          
          <ShopCalculationDisplay
            areas={areas}
            depth={depth}
            extraPercentage={extraPercentage}
            product={filteredProduct}
            materialCategory={materialCategory}
            materialSize={materialSize}
          />
          
          <div className="mt-8">
            <ZipCodeSection product={filteredProduct} />
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100">
            <ContactForm 
              product={filteredProduct} 
              onApplyDiscount={handleApplyDiscount} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopCalculator;
