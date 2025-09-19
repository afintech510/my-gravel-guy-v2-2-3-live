import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, Lock, Unlock, Calculator } from 'lucide-react';
import { useLandingPage } from '@/contexts/LandingPageContext';
import { PriceScale } from './PriceScale';
import { DepositFlow } from './DepositFlow';
import { FloatingCalculatorButton } from './FloatingCalculatorButton';
import { LandingAreaCalculator } from './LandingAreaCalculator';
import ProductFilterSelector from '@/components/product-calculator/ProductFilterSelector';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/services/productService';
import { Product } from '@/services/productTypes';
import { calculateFinalPrice } from '@/services/products/pricingUtils';
import { trackEvent, trackEcommerce } from '@/utils/analytics';
import { formatCoverageText } from '@/utils/coverageCalculator';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Please enter a valid phone number'),
  street: z.string().min(5, 'Please enter a valid street address'),
  city: z.string().min(2, 'Please enter a valid city'),
  state: z.string().min(2, 'Please select a state'),
  zip: z.string().min(5, 'Please enter a valid ZIP code'),
  consent: z.boolean().refine(val => val === true, 'You must agree to receive communications'),
});

type ContactForm = z.infer<typeof contactSchema>;

export const ReactivePricingForm = () => {
  const { 
    state, 
    setContactInfo, 
    unlockDiscount,
    trackFormInteraction 
  } = useLandingPage();

  // Local state - like ProductCalculator
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(10);
  const [zipCode, setZipCode] = useState('');
  const [priceData, setPriceData] = useState<any>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  
  const [showContactForm, setShowContactForm] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const calculatorRef = useRef<HTMLDivElement>(null);

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<ContactForm>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: state.contactInfo?.name || '',
      email: state.contactInfo?.email || '',
      phone: state.contactInfo?.phone || '',
      street: '',
      city: '',
      state: '',
      zip: '',
      consent: false,
    }
  });

  const watchedValues = watch();

  // Calculate pricing when product, quantity, or ZIP changes (like ProductCalculator)
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

  // Update ZIP code from form
  useEffect(() => {
    if (watchedValues.zip && watchedValues.zip.length >= 5) {
      setZipCode(watchedValues.zip);
    }
  }, [watchedValues.zip]);

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

  const onContactSubmit = async (data: ContactForm) => {
    try {
      const contactInfo = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        zipCode: data.zip,
      };

      setContactInfo(contactInfo);

      unlockDiscount();
      trackFormInteraction('contact_form_submitted', contactInfo);
    } catch (error) {
      console.error('Error submitting contact form:', error);
    }
  };

  const discountAmount = priceData ? Math.min(priceData.normalPrice * 0.05, 50) : 50;

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

                {/* Delivery ZIP Code Field */}
                <div>
                  <Label htmlFor="zip">Delivery Zip Code</Label>
                  <Input
                    id="zip"
                    {...register('zip')}
                    placeholder="73301"
                    className={errors.zip ? 'border-destructive' : ''}
                  />
                  {errors.zip && (
                    <p className="text-sm text-destructive mt-1">{errors.zip.message}</p>
                  )}
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

          {/* Step 2: Price Display and Discount Offer - Only show when ZIP code is entered */}
          {priceData && zipCode.length >= 5 && (
            <div className="space-y-6">
              <PriceScale priceData={priceData} />

              {!state.discountUnlocked && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="text-center space-y-4">
                      <div className="flex items-center justify-center gap-2">
                        <Tag className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold text-foreground">
                          Unlock Your Discount
                        </h3>
                      </div>
                      
                      <p className="text-muted-foreground">
                        Get <strong className="text-primary">${(priceData?.discountAmount || 50).toFixed(0)} off</strong> when you add your contact information
                      </p>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowContactForm(!showContactForm)}
                        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                      >
                        {showContactForm ? (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Hide Contact Form
                          </>
                        ) : (
                          <>
                            <Unlock className="h-4 w-4 mr-2" />
                            Add My Info & Save ${(priceData?.discountAmount || 50).toFixed(0)}
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Contact Form (Lead Gate) */}
              {(showContactForm || state.discountUnlocked) && !state.discountUnlocked && (
                <form onSubmit={handleSubmit(onContactSubmit)} className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                      2
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">Your Contact Information</h3>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="John Smith"
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        {...register('email')}
                        placeholder="john@example.com"
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && (
                        <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        {...register('phone')}
                        placeholder="(555) 123-4567"
                        className={errors.phone ? 'border-destructive' : ''}
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                  <Checkbox
                    id="consent"
                    checked={watchedValues.consent || false}
                    onCheckedChange={(checked) => setValue('consent', checked as boolean)}
                      className={errors.consent ? 'border-destructive' : ''}
                    />
                    <div className="text-sm">
                      <label htmlFor="consent" className="text-foreground cursor-pointer">
                        I agree to receive text messages and calls about my order. Msg & data rates may apply.
                      </label>
                      {errors.consent && (
                        <p className="text-destructive mt-1">{errors.consent.message}</p>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Unlocking Discount...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Unlock ${(priceData?.discountAmount || 50).toFixed(0)} Discount
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Step 4: Deposit Flow (Shown after discount unlocked or at base price) */}
              {(state.discountUnlocked || state.formStep === 'review') && (
                <DepositFlow priceData={priceData} discountUnlocked={state.discountUnlocked} />
              )}
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