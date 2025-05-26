import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import MaterialCategorySelector, { ShopMaterialCategory, ShopMaterialSubcategory } from './MaterialCategorySelector';
import ShopAreaInputs from './ShopAreaInputs';
import DepthSlider from './DepthSlider';
import ExtraSlider from './ExtraSlider';
import ShopCalculationDisplay from './ShopCalculationDisplay';
import ContactForm from './ContactForm';
import ZipCodeSection from './ZipCodeSection';
import { MaterialSize } from '@/services/productTypes';
import { useCalculator } from '@/hooks/useCalculator';

// Remove the old type definitions since they're now in MaterialCategorySelector
export type { ShopMaterialCategory as MaterialCategory, ShopMaterialSubcategory as MaterialSubcategory } from './MaterialCategorySelector';
export type ApplicationType = 'residential' | 'commercial' | 'landscaping';

const ShopCalculator = () => {
  const [selectedCategory, setSelectedCategory] = useState<ShopMaterialCategory>('gravel');
  const [selectedSubcategory, setSelectedSubcategory] = useState<ShopMaterialSubcategory>('driveway');
  const [selectedSize, setSelectedSize] = useState<MaterialSize>('3/4"');
  const [areas, setAreas] = useState([{ length: 10, width: 10 }]);
  const [depth, setDepth] = useState(4);
  const [extraPercentage, setExtraPercentage] = useState(10);
  const [showContactForm, setShowContactForm] = useState(false);

  // Mock product images for demo
  const productImages = [
    '/assets/crushed-stone.png',
    '/assets/river-rocks.png',
    '/lovable-uploads/646fdaef-3f82-4658-ad98-21de35fad1a1.png'
  ];

  // Calculate material needs
  const calculations = useCalculator(areas, depth, extraPercentage, 62, 1.5);

  const handleGetQuote = () => {
    setShowContactForm(true);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Calculate Your Material Needs</h1>
        <p className="text-gray-600">Select your material, enter your project dimensions, and get an instant quote.</p>
      </div>

      {!showContactForm ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Material Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>1. Select Your Material</CardTitle>
              </CardHeader>
              <CardContent>
                <MaterialCategorySelector
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  selectedSubcategory={selectedSubcategory}
                  setSelectedSubcategory={setSelectedSubcategory}
                  selectedSize={selectedSize}
                  setSelectedSize={setSelectedSize}
                  productImages={productImages}
                />
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>2. Enter Project Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ShopAreaInputs areas={areas} onAreaChange={setAreas} />
                <DepthSlider depth={depth} setDepth={setDepth} />
                <ExtraSlider extraPercentage={extraPercentage} setExtraPercentage={setExtraPercentage} />
              </CardContent>
            </Card>
          </div>

          {/* Right column - Calculation & Quote */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Your Quote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <ShopCalculationDisplay
                  totalArea={calculations.totalSquareFeet}
                  cubicYards={calculations.totalCubicYards}
                  tons={calculations.totalTons}
                  estimatedCost={calculations.estimatedCost}
                />
                
                <ZipCodeSection />
                
                <Button 
                  onClick={handleGetQuote} 
                  className="w-full bg-primary hover:bg-primary/90 text-white"
                  size="lg"
                >
                  Get Quote & Schedule Delivery
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <ContactForm
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          selectedSize={selectedSize}
          calculations={calculations}
          onBack={() => setShowContactForm(false)}
        />
      )}
    </div>
  );
};

export default ShopCalculator;
