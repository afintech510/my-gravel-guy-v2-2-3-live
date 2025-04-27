import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '../contexts/CartContext';
import { getProducts } from '../services/productService';
import { Product } from '../services/productTypes';
import { AreaInput } from './calculator/types';
import { CalculatorForm } from './calculator/CalculatorForm';
import { PriceDisplay } from './calculator/PriceDisplay';
import AreaInputs from './calculator/AreaInputs';
import CalculationDisplay from './calculator/CalculationDisplay';
import { useCalculator } from '../hooks/useCalculator';
import MaterialSelector from './calculator/MaterialSelector';

const MaterialCalculator = () => {
  const [areas, setAreas] = useState<AreaInput[]>([{ length: 10, width: 10 }]);
  const [depth, setDepth] = useState(4);
  const [extraPercentage, setExtraPercentage] = useState(10);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [showDiscountedPrice, setShowDiscountedPrice] = useState(false);
  const [cityState, setCityState] = useState<string>('');
  const { toast } = useToast();
  const { addToCart } = useCart();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
        if (fetchedProducts.length > 0) {
          setSelectedProduct(fetchedProducts[0].id.toString());
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };
    loadProducts();
  }, []);

  const selectedProductPrice = products.find(p => p.id.toString() === selectedProduct)?.price || 0;
  const calculations = useCalculator(areas, depth, extraPercentage, selectedProductPrice);

  const handleAddToCart = () => {
    const product = products.find(p => p.id.toString() === selectedProduct);
    if (product) {
      addToCart({
        ...product,
        price: calculations.discountedCost / calculations.totalTons,
        quantity: calculations.totalTons,
      } as any);
      
      toast({
        title: "Added to Cart",
        description: `${calculations.totalTons.toFixed(1)} tons added with $50 discount applied.`,
      });
    }
  };

  const lookupCityState = async (zipCode: string) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${zipCode}&key=REDACTED_GOOGLE_MAPS_KEY`
      );
      const data = await response.json();
      
      if (data.results && data.results[0]) {
        const addressComponents = data.results[0].address_components;
        const city = addressComponents.find((c: any) => c.types.includes('locality'))?.long_name || '';
        const state = addressComponents.find((c: any) => c.types.includes('administrative_area_level_1'))?.long_name || '';
        setCityState(city && state ? `${city}, ${state}` : '');
      }
    } catch (error) {
      console.error('Failed to lookup location:', error);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Material Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <MaterialSelector
            products={products}
            selectedProduct={selectedProduct}
            onProductSelect={setSelectedProduct}
          />

          <AreaInputs areas={areas} onAreaChange={setAreas} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Depth: {depth} inches
              </label>
              <Slider
                value={[depth]}
                onValueChange={([value]) => setDepth(value)}
                min={1}
                max={100}
                step={1}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Order Extra: {extraPercentage}%
              </label>
              <Slider
                value={[extraPercentage]}
                onValueChange={([value]) => setExtraPercentage(value)}
                min={0}
                max={30}
                step={1}
              />
            </div>
          </div>

          <CalculationDisplay
            totalArea={calculations.totalSquareFeet}
            cubicYards={calculations.totalCubicYards}
            tons={calculations.totalTons}
            estimatedCost={calculations.estimatedCost}
          />

          <CalculatorForm 
            onSubmit={() => setShowDiscountedPrice(true)}
            onZipCodeChange={lookupCityState}
          />

          <Button type="submit" className="w-full" onClick={() => setShowDiscountedPrice(true)}>
            Submit RFQ for at least $50 OFF est. cost!
          </Button>

          <PriceDisplay
            showDiscountedPrice={showDiscountedPrice}
            discountedCost={calculations.discountedCost}
            totalTons={calculations.totalTons}
            onAddToCart={handleAddToCart}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default MaterialCalculator;
