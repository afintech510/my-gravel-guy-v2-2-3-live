import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Calculator, Shield, Truck, CheckCircle, Banknote, CreditCard } from 'lucide-react';
import { useLandingPage } from '@/contexts/LandingPageContext';
import { FloatingCalculatorButton } from './FloatingCalculatorButton';
import { LandingAreaCalculator } from './LandingAreaCalculator';
import TrustBadge from '@/components/products/trust/TrustBadge';
import { generateCartLink } from '@/utils/cartLinkUtils';
import ProductFilterSelector from '@/components/product-calculator/ProductFilterSelector';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/services/productService';
import { Product } from '@/services/productTypes';
import { calculateFinalPrice } from '@/services/products/pricingUtils';
import { trackEvent, trackEcommerce } from '@/utils/analytics';
import { formatCoverageText } from '@/utils/coverageCalculator';

const contactSchema = z.object({
  zip: z.string().min(5, 'Please enter a valid ZIP code'),
});

type ContactForm = z.infer<typeof contactSchema>;

export const ReactivePricingForm = () => {
  const { trackFormInteraction } = useLandingPage();

  // Local state - like ProductCalculator
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(10);
  const [zipCode, setZipCode] = useState('');
  const [priceData, setPriceData] = useState<any>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  
  const [showCalculator, setShowCalculator] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  const {
    register,
    watch,
    formState: { errors }
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      zip: '',
    }
  });

  const watchedValues = watch();

  // Calculate pricing when product, quantity, or ZIP changes
  useEffect(() => {
    const updatePriceDetails = async () => {
      if (selectedProduct && quantity > 0 && zipCode.length >= 5) {
        try {
          setIsCalculatingPrice(true);
          console.log(`[ReactivePricingForm] Calculating price for ${selectedProduct.name}, ${quantity} tons, ZIP: ${zipCode}`);
          
          const pricing = await calculateFinalPrice(selectedProduct, quantity, zipCode);
          
          const normalPrice = pricing.finalPrice;
          const discountAmount = Math.min(normalPrice * 0.05, 50);
          const discountedPrice = normalPrice - discountAmount;

          const newPriceData = {
            normalPrice,
            discountedPrice,
            discountAmount,
            depositEstimate: 199,
            cashPriceEstimate: Math.round(normalPrice * 0.80 * 100) / 100,
            cardPriceEstimate: Math.round(discountedPrice * 0.95 * 100) / 100,
          };

          setPriceData(newPriceData);
          setIsCalculatingPrice(false);
        } catch (error) {
          console.error('[ReactivePricingForm] Error calculating pricing:', error);
          setIsCalculatingPrice(false);
        }
      } else {
        setPriceData(null);
      }
    };
    
    updatePriceDetails();
  }, [selectedProduct, quantity, zipCode]);

  // Update ZIP code from form and track interaction
  useEffect(() => {
    if (watchedValues.zip && watchedValues.zip.length >= 5) {
      setZipCode(watchedValues.zip);
      trackFormInteraction('zip_code_entered', { zipCode: watchedValues.zip });
    }
  }, [watchedValues.zip, trackFormInteraction]);

  const handleMaterialSelect = (material: Product | null) => {
    console.log('[ReactivePricingForm] Material selected:', material?.name || 'none');
    setSelectedProduct(material);
    
    if (material) {
      trackEvent('view_item', 'landing_page', material.name, quantity);
      trackEcommerce('view_item', [{
        item_id: material.id,
        item_name: material.name,
        item_category: material.category,
        quantity: quantity,
        price: material.price
      }]);
    }
    
    trackFormInteraction('material_selected', { material: material?.name });
  };

  const handleQuantityChange = (value: number[]) => {
    const newQuantity = value[0];
    setQuantity(newQuantity);
    trackFormInteraction('quantity_changed', { quantity: newQuantity });
  };

  const handleCalculatorResult = (result: { totalTons: number; totalCubicYards: number; totalSquareFeet: number }) => {
    // Only track the calculation, don't automatically update the quantity
    trackFormInteraction('calculator_used', { calculatedTons: result.totalTons });
  };

  const scrollToCalculator = () => {
    setShowCalculator(true);
    setTimeout(() => {
      calculatorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-2xl border-0 bg-card">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
            Get Your Instant Quote
          </CardTitle>
          <p className="text-muted-foreground">
            See pricing immediately and unlock your discount
          </p>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Step 1: Material Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                1
              </div>
              <h3 className="text-lg font-semibold text-foreground">Select Your Material</h3>
            </div>

            <ProductFilterSelector 
              onProductSelected={handleMaterialSelect}
              selectedProduct={selectedProduct}
            />
            
            {/* Debug: Show selected material */}
            {selectedProduct && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                ✓ Selected: <strong>{selectedProduct.name}</strong>
              </div>
            )}

            {selectedProduct && (
              <div className="space-y-6 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">
                        Amount: {quantity} tons
                      </Label>
                      {selectedProduct && (
                        <p className="text-sm text-muted-foreground italic">
                          {formatCoverageText(quantity, selectedProduct.tonYardRatio)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={scrollToCalculator}
                      className="text-xs"
                    >
                      <Calculator className="h-4 w-4 mr-1" />
                      Calculate Needed
                    </Button>
                  </div>
                  <div className="mt-3">
                    <Slider
                      value={[quantity]}
                      onValueChange={handleQuantityChange}
                      min={3}
                      max={50}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>3 tons (minimum)</span>
                    <span>50+ tons</span>
                  </div>
                </div>

                {/* Centered ZIP Code Field with Trust Badges */}
                <div className="flex items-center gap-6 max-w-2xl mx-auto">
                  {/* Left Trust Badge */}
                  <div className="hidden md:flex">
                    <TrustBadge
                      icon={Shield}
                      title="Secure Ordering"
                      size="compact"
                      className="bg-white border shadow-sm rounded-lg px-3 py-2"
                    />
                  </div>

                  {/* Centered ZIP Code Input */}
                  <div className="flex-1 max-w-xs">
                    <Label htmlFor="zip" className="text-center block mb-2 font-medium">
                      Delivery Zip Code
                    </Label>
                    <Input
                      id="zip"
                      {...register('zip')}
                      placeholder="73301"
                      className={`text-center text-lg py-3 ${errors.zip ? 'border-destructive' : 'border-primary/30 focus:border-primary'}`}
                    />
                    {errors.zip && (
                      <p className="text-sm text-destructive mt-1 text-center">{errors.zip.message}</p>
                    )}
                  </div>

                  {/* Right Trust Badge */}
                  <div className="hidden md:flex">
                    <TrustBadge
                      icon={Truck}
                      title="Free Delivery"
                      size="compact"
                      className="bg-white border shadow-sm rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Calculator Module */}
          {showCalculator && selectedProduct && (
            <div ref={calculatorRef} className="space-y-4">
              <LandingAreaCalculator
                onCalculationChange={handleCalculatorResult}
                selectedMaterial={selectedProduct}
                onClose={() => setShowCalculator(false)}
              />
            </div>
          )}

          {/* New Simple Pricing Module - Show when ZIP code is entered */}
          {priceData && zipCode.length >= 5 && (
            <div className="space-y-6">
              {/* Pricing Display */}
              <Card className="shadow-lg border-primary/20">
                <CardContent className="p-8">
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Left: $199 Deposit (Promoted) */}
                    <Card className="border-2 border-primary bg-primary/5 relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-1 text-sm font-semibold">
                        ⭐ BEST VALUE - Cash on Delivery
                      </div>
                      <CardContent className="pt-8 pb-6 px-6 text-center">
                        <div className="space-y-4">
                          <div>
                            <div className="text-3xl font-bold text-primary">$199</div>
                            <div className="text-sm text-muted-foreground">Refundable Deposit</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Pay balance in cash on delivery
                            </div>
                          </div>
                          
                          <div className="bg-white/70 rounded-lg p-3 text-sm">
                            <div className="font-medium text-foreground">Final Total:</div>
                            <div className="text-lg font-bold text-primary">
                              ${Math.round(priceData.normalPrice * 0.80).toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">Wholesale Cash Price</div>
                          </div>

                          <Button
                            size="lg"
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                            onClick={() => {
                              const cartLink = generateCartLink({
                                product: selectedProduct?.slug || selectedProduct?.id || '',
                                tons: quantity,
                                zipCode: zipCode,
                                redirect: '/cart'
                              });
                              window.location.href = cartLink + '&paymentType=deposit';
                            }}
                          >
                            <Banknote className="h-5 w-5 mr-2" />
                            Reserve with $199 Deposit
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Right: Buy Now (Normal Price) */}
                    <Card className="border border-muted">
                      <CardContent className="pt-6 pb-6 px-6 text-center">
                        <div className="space-y-4">
                          <div>
                            <div className="text-2xl font-bold text-foreground">
                              ${priceData.normalPrice.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Full Payment Now</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Pay complete amount by card
                            </div>
                          </div>

                          <div className="bg-muted/30 rounded-lg p-3 text-sm">
                            <div className="text-muted-foreground">
                              Standard card processing rate
                            </div>
                          </div>

                          <Button
                            size="lg"
                            variant="outline"
                            className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => {
                              const cartLink = generateCartLink({
                                product: selectedProduct?.slug || selectedProduct?.id || '',
                                tons: quantity,
                                zipCode: zipCode,
                                redirect: '/cart'
                              });
                              window.location.href = cartLink + '&paymentType=full';
                            }}
                          >
                            <CreditCard className="h-5 w-5 mr-2" />
                            Buy Now - ${priceData.normalPrice.toLocaleString()}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Additional Trust Elements */}
                  <div className="mt-6 pt-6 border-t border-muted/30">
                    <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span>Secure Payment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        <span>Free Delivery</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <span>Quality Guaranteed</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Floating Calculator Button */}
      {selectedProduct && !showCalculator && (
        <FloatingCalculatorButton onClick={scrollToCalculator} />
      )}
    </div>
  );
};