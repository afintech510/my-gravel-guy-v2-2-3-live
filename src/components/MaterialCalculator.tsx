import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '../contexts/CartContext';
import { getProducts, validateZipCode, getPriceAdjustmentForZipCode, applyZipCodeAdjustment } from '../services/productService';
import { Product } from '../services/productTypes';
import AreaInputs from './calculator/AreaInputs';
import CalculationDisplay from './calculator/CalculationDisplay';
import { useCalculator } from '../hooks/useCalculator';
import { CalculatorForm } from './calculator/CalculatorForm';
import MaterialSelector from './calculator/MaterialSelector';
import { PriceDisplay } from './calculator/PriceDisplay';
import { useZipCode } from '../contexts/ZipCodeContext';
import { calculateFinalPrice } from '../services/products/pricingUtils';

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

// Helper function to enforce minimum quantity for pricing
const getEffectivePricingQuantity = (calculatedTons: number): number => {
  return Math.max(3, calculatedTons);
};

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
  const [manualTons, setManualTons] = useState<number | undefined>(undefined);
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0);
  const [availableInZip, setAvailableInZip] = useState<boolean>(true);
  const [actualPricePerTon, setActualPricePerTon] = useState<number>(0);
  const { zipCode } = useZipCode();
  
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

  // Set the ZIP code in the form when it's available from context
  useEffect(() => {
    if (zipCode && form.getValues('zipCode') === '') {
      form.setValue('zipCode', zipCode);
      lookupCityState(zipCode);
      fetchPriceAdjustment(zipCode);
    }
  }, [zipCode, form]);

  // Fetch price adjustment and calculate actual pricing when ZIP code or product changes
  const fetchPriceAdjustment = async (zip: string) => {
    try {
      const validation = await validateZipCode(zip);
      setAvailableInZip(validation.inServiceArea);
      
      if (validation.inServiceArea) {
        const adjustment = validation.priceAdjustment || 0;
        setPriceAdjustment(adjustment);
        console.log(`Price adjustment for ${zip}: ${adjustment}%`);
        
        // Calculate actual pricing using tier system
        await updateActualPricing(zip);
      } else {
        setPriceAdjustment(0);
        setActualPricePerTon(0);
        toast({
          title: "Delivery Not Available",
          description: `We don't currently deliver to ${zip}. Please try another ZIP code.`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Failed to fetch price adjustment:', error);
      setPriceAdjustment(0);
      setActualPricePerTon(0);
    }
  };

  // Update actual pricing using the tier system
  const updateActualPricing = async (zip?: string) => {
    const selectedProductObj = products.find(p => p.id.toString() === selectedProduct);
    if (selectedProductObj && calculations.totalTons > 0) {
      try {
        const effectiveTons = getEffectivePricingQuantity(calculations.totalTons);
        console.log(`MaterialCalculator: Calculating actual price for ${effectiveTons} tons`);
        
        const priceDetails = await calculateFinalPrice(
          selectedProductObj,
          effectiveTons,
          zip || zipCode || undefined
        );
        
        setActualPricePerTon(priceDetails.pricePerTon);
        console.log(`MaterialCalculator: Actual price per ton: $${priceDetails.pricePerTon}`);
      } catch (error) {
        console.error('Failed to calculate actual pricing:', error);
        setActualPricePerTon(selectedProductObj.price);
      }
    }
  };

  // Load products
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

  // Update actual pricing when product or calculated tons change
  useEffect(() => {
    if (zipCode && selectedProduct) {
      updateActualPricing();
    }
  }, [selectedProduct, zipCode, products]);

  // Reset manual tons when areas or depth change to recalculate based on dimensions
  useEffect(() => {
    setManualTons(undefined);
  }, [areas, depth, extraPercentage]);

  const selectedProductObj = products.find(p => p.id.toString() === selectedProduct);
  
  // Use actual price per ton if available, otherwise fall back to adjusted price
  const selectedProductPrice = actualPricePerTon > 0 ? actualPricePerTon : 
    (selectedProductObj ? applyZipCodeAdjustment(selectedProductObj.price, priceAdjustment) : 0);
    
  const tonYardRatio = selectedProductObj?.tonYardRatio ? parseFloat(String(selectedProductObj.tonYardRatio)) : 1.5;
  
  const calculations = useCalculator(areas, depth, extraPercentage, selectedProductPrice, tonYardRatio, manualTons);

  const handleTonsChange = (newTons: number) => {
    // Ensure we're always using integer values
    setManualTons(Math.floor(newTons));
  };

  const handleAddToCart = () => {
    const product = products.find(p => p.id.toString() === selectedProduct);
    if (product) {
      const formData = form.getValues();
      
      // Apply price adjustment to the product price
      const adjustedProduct = {
        ...product,
        price: selectedProductPrice // Use the actual calculated price per ton
      };
      
      addToCart({
        ...adjustedProduct,
        tons: calculations.totalTons,
        yards: calculations.totalCubicYards,
        contactInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          zipCode: formData.zipCode
        },
        // Apply the $50 coupon automatically
        couponApplied: true,
        couponAmount: 50
      });
      
      toast({
        title: "Added to Cart",
        description: `${Math.floor(calculations.totalTons)} tons of ${product.name} added to your cart with a $50 discount applied.`,
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
      
      // Also check if zip code is in our service area
      fetchPriceAdjustment(zipCode);
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
        
        {priceAdjustment !== 0 && (
          <div className="px-4 py-2 bg-blue-50 border border-blue-100 rounded-md">
            <p className="text-sm text-blue-700">
              {priceAdjustment > 0 ? (
                `Price includes ${priceAdjustment}% regional adjustment for ${form.getValues('zipCode')}`
              ) : (
                `Price includes ${Math.abs(priceAdjustment)}% discount for ${form.getValues('zipCode')}`
              )}
            </p>
          </div>
        )}

        <CalculationDisplay
          totalArea={calculations.totalSquareFeet}
          cubicYards={calculations.totalCubicYards}
          tons={calculations.totalTons}
          estimatedCost={calculations.estimatedCost}
          onTonsChange={handleTonsChange}
          isManualTons={manualTons !== undefined}
        />

        <CalculatorForm
          onSubmit={() => setShowDiscountedPrice(true)}
          onZipCodeChange={(zipCode) => {
            lookupCityState(zipCode);
            fetchPriceAdjustment(zipCode);
          }}
        />

        <PriceDisplay
          showDiscountedPrice={showDiscountedPrice}
          discountedCost={calculations.discountedCost}
          totalTons={calculations.totalTons}
          onAddToCart={handleAddToCart}
          isAvailable={availableInZip}
          productName={selectedProductObj?.name} // Pass the product name to the PriceDisplay component
        />
      </CardContent>
    </Card>
  );
};

export default MaterialCalculator;
