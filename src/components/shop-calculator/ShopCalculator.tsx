
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import ShopAreaInputs, { AreaDimensions } from './ShopAreaInputs';
import ShopCalculationDisplay from './ShopCalculationDisplay';
import ShopMaterialSelector from './ShopMaterialSelector';
import ZipCodeSection from './ZipCodeSection';
import ContactForm from './ContactForm';
import { Product, UIMaterialCategory } from '@/services/productTypes';

// Define the subcategory type explicitly
export type MaterialSubcategory = 
  'washed-sand' | 'mason-sand' | 'playground-sand' | 'pool-sand' | 'beach-sand' | 
  'fill-dirt' | 'top-soil' | 'compost' | 'loam' | 'sandy-loam' |
  'natural' | 'black' | 'chocolate-brown' | 'red' | 'request' |
  '57-crushed-stone' | 'crusher-run' | 'road-base' | 'rca-crushed-concrete' | 'drainage-rock' |
  'driveway' | 'walkway' | 'landscape' | 'natural' | 'construction' |
  'pea-gravel' | 'river-rock' | 'crushed-stone' | 'decorative-gravel' | 'drainage-gravel';

export type ApplicationType = 'driveway' | 'walkway' | 'landscape' | 'drainage' | 'foundation';

interface ShopCalculatorProps {
  onProductSelected?: (product: Product | null) => void;
  selectedProduct?: Product | null;
}

const ShopCalculator: React.FC<ShopCalculatorProps> = ({ 
  onProductSelected,
  selectedProduct: initialSelectedProduct 
}) => {
  // Material selection state
  const [selectedCategory, setSelectedCategory] = useState<UIMaterialCategory>('gravel');
  const [selectedSubcategory, setSelectedSubcategory] = useState<MaterialSubcategory>('driveway');
  
  // Area dimensions state - updated to use the new structure
  const [areaDimensions, setAreaDimensions] = useState<AreaDimensions>({
    areas: [{ length: 10, width: 10 }],
    depth: 2,
    extra: 10,
  });

  // Sample product images based on category
  const productImages = {
    gravel: ['/assets/crushed-stone.png', '/assets/river-rocks.png'],
    sand: ['/assets/sand.jpg', '/assets/playground-sand.jpg'],
    dirt: ['/assets/topsoil.jpg', '/assets/fill-dirt.jpg'],
    mulch: ['/assets/mulch.jpg', '/assets/black-mulch.jpg'],
    base: ['/assets/road-base.jpg', '/assets/crushed-concrete.jpg'],
  };

  // Product state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(initialSelectedProduct || null);

  // Function to handle product selection
  const handleProductSelected = (product: Product | null) => {
    console.log("ShopCalculator: Product selected:", product?.name || 'None');
    setSelectedProduct(product);
    
    // Call parent callback if provided
    if (onProductSelected) {
      onProductSelected(product);
    }
  };

  // Create a type-safe wrapper for the setSelectedSubcategory function
  const handleSetSubcategory = (subcategory: string) => {
    setSelectedSubcategory(subcategory as MaterialSubcategory);
  };

  // Calculate cubic yards and tons based on dimensions
  const calculateMaterial = () => {
    const { areas, depth, extra } = areaDimensions;
    
    // Convert inches to feet for depth
    const depthInFeet = depth / 12;
    
    // Calculate total square footage
    const totalSquareFeet = areas.reduce((sum, area) => sum + (area.length * area.width), 0);
    
    // Calculate cubic yards
    let cubicYards = (totalSquareFeet * depthInFeet) / 27;
    
    // Add extra percentage
    cubicYards = cubicYards * (1 + (extra / 100));
    
    // Calculate tons (varies by material)
    // Use tonYardRatio from selected product if available, else use default ratio
    const tonYardRatio = selectedProduct?.tonYardRatio || 1.5;
    const tons = cubicYards * tonYardRatio;
    
    return {
      cubicYards: Math.round(cubicYards * 100) / 100,
      tons: Math.round(tons * 100) / 100
    };
  };

  const materialCalculation = calculateMaterial();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* LEFT COLUMN: Material Selection */}
      <div className="md:col-span-2">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-6">Material Selection</h2>
          <ShopMaterialSelector 
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            selectedSubcategory={selectedSubcategory}
            setSelectedSubcategory={handleSetSubcategory}
            productImages={productImages[selectedCategory] || []}
            onProductSelected={handleProductSelected}
          />
        </Card>
      </div>
      
      {/* RIGHT COLUMN: Calculator, Calculation, ZIP Code, Contact Form */}
      <div className="space-y-6">
        {/* Area Calculator - Moved to top of right column */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Area Calculator</h2>
          <ShopAreaInputs
            dimensions={areaDimensions}
            onDimensionsChange={setAreaDimensions}
          />
        </Card>
      
        <ShopCalculationDisplay 
          cubicYards={materialCalculation.cubicYards} 
          tons={materialCalculation.tons}
          materialInfo={{
            category: selectedCategory,
            subcategory: selectedSubcategory,
          }}
          selectedProduct={selectedProduct}
        />
        
        <ZipCodeSection product={selectedProduct} />
        
      </div>
    </div>
  );
};

export default ShopCalculator;
