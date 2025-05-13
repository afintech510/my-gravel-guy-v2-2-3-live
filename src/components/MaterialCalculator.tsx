
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '../contexts/CartContext';
import { getProducts } from '../services/productService';
import { Product } from '../services/productTypes';
import AreaInputs from './calculator/AreaInputs';
import CalculationDisplay from './calculator/CalculationDisplay';
import { useCalculator } from '../hooks/useCalculator';
import { CalculatorForm } from './calculator/CalculatorForm';
import MaterialSelector from './calculator/MaterialSelector';
import { PriceDisplay } from './calculator/PriceDisplay';

type AreaInput = {
  length: number;
  width: number;
};

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^(\+1|1)?[-. ]?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/, 'Invalid phone number'),
  zipCode: z.string().min(5, 'ZIP code must be 5 digits'),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must agree to receive communications',
  }),
});

const MaterialCalculator = () => {
  const [areas, setAreas] = useState([{ length: 10, width: 10 }]);
  const [depth, setDepth] = useState(4);
  const [extraPercentage, setExtraPercentage] = useState(10);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [showDiscountedPrice, setShowDiscountedPrice] = useState(false);
  const { toast } = useToast();
  const { addToCart } = useCart();
  const [cityState, setCityState] = useState<string>('');
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      zipCode: '',
      consent: false,
    },
  });

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

  const selectedProductObj = products.find(p => p.id.toString() === selectedProduct);
  const selectedProductPrice = selectedProductObj?.price || 0;
  const tonYardRatio = selectedProductObj?.tonYardRatio ? parseFloat(String(selectedProductObj.tonYardRatio)) : 1.5;
  
  const calculations = useCalculator(areas, depth, extraPercentage, selectedProductPrice, tonYardRatio);

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
        description: `${calculations.totalTons.toFixed(1)} tons of ${product.name} added with $50 discount applied.`,
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
      <CardContent className="space-y-6">
        <AreaInputs areas={areas} onAreaChange={setAreas} />
        
        {/* Mini calculation display showing just area and cubic yards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 py-2 bg-gray-50 rounded-md">
          <div>
            <p className="text-sm text-muted-foreground">Total Area</p>
            <p className="text-xl font-bold">{calculations.totalSquareFeet.toFixed(2)} sq. ft.</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Cubic Yards Needed</p>
            <p className="text-xl font-bold">{calculations.totalCubicYards.toFixed(2)} cu. yds.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Depth: {depth} inches
            </label>
            <Slider
              value={[depth]}
              onValueChange={([value]) => setDepth(value)}
              min={1}
              max={36}
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

        <MaterialSelector
          products={products}
          selectedProduct={selectedProduct}
          onProductSelect={setSelectedProduct}
        />

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

        <PriceDisplay
          showDiscountedPrice={showDiscountedPrice}
          discountedCost={calculations.discountedCost}
          totalTons={calculations.totalTons}
          onAddToCart={handleAddToCart}
        />
      </CardContent>
    </Card>
  );
};

export default MaterialCalculator;
