import React, { useState, useEffect } from 'react';
import { Plus, Minus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '../contexts/CartContext';
import { Product, getProducts } from '../services/productService';

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
  const [areas, setAreas] = useState<AreaInput[]>([{ length: 10, width: 10 }]);
  const [depth, setDepth] = useState<number>(4);
  const [extraPercentage, setExtraPercentage] = useState<number>(10);
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

  const calculateTotalSquareFeet = (): number => {
    return areas.reduce((total, area) => total + (area.length * area.width), 0);
  };

  const calculateCubicYards = (squareFeet: number): number => {
    const cubicFeet = (squareFeet * depth) / 12; // Convert depth from inches to feet
    const baseYards = cubicFeet / 27; // Convert cubic feet to cubic yards
    return baseYards * (1 + extraPercentage / 100); // Add extra percentage
  };

  const calculateTotalTons = (cubicYards: number): number => {
    const product = products.find(p => p.id.toString() === selectedProduct);
    return product ? cubicYards * product.tonYardRatio : 0;
  };

  const calculateEstimatedCost = (tons: number): number => {
    const product = products.find(p => p.id.toString() === selectedProduct);
    return product ? tons * product.price : 0;
  };

  const totalSquareFeet = calculateTotalSquareFeet();
  const totalCubicYards = calculateCubicYards(totalSquareFeet);
  const totalTons = calculateTotalTons(totalCubicYards);
  const estimatedCost = calculateEstimatedCost(totalTons);
  const discountedCost = estimatedCost - 50;

  const updateAreaValue = (index: number, field: keyof AreaInput, value: string) => {
    const newValue = parseFloat(value) || 0;
    const newAreas = [...areas];
    newAreas[index] = { ...newAreas[index], [field]: newValue };
    setAreas(newAreas);
  };

  const addArea = () => {
    setAreas([...areas, { length: 10, width: 10 }]);
  };

  const removeArea = (index: number) => {
    if (areas.length > 1) {
      const newAreas = areas.filter((_, i) => i !== index);
      setAreas(newAreas);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setShowDiscountedPrice(true);
    toast({
      title: "Quote Generated!",
      description: "Your discounted price is now available. Click 'Add to Cart' to proceed.",
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Material Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Areas Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Areas to Cover</h3>
              {areas.map((area, index) => (
                <div key={index} className="flex gap-4 items-center">
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Length (ft)"
                      value={area.length}
                      onChange={(e) => updateAreaValue(index, 'length', e.target.value)}
                      step="0.1"
                      min="0"
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      type="number"
                      placeholder="Width (ft)"
                      value={area.width}
                      onChange={(e) => updateAreaValue(index, 'width', e.target.value)}
                      step="0.1"
                      min="0"
                    />
                  </div>
                  <div className="flex gap-2">
                    {areas.length > 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => removeArea(index)}
                        type="button"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                    {index === areas.length - 1 && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={addArea}
                        type="button"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Depth and Extra Percentage Sliders */}
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
                  Extra Percentage: {extraPercentage}%
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

            {/* Material Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Material</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a material" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name} - ${product.price}/ton
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calculations Display */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4 border-t border-b">
              <div>
                <p className="text-sm text-muted-foreground">Cubic Yards Needed</p>
                <p className="text-2xl font-bold">{totalCubicYards.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Tons</p>
                <p className="text-2xl font-bold">{totalTons.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Cost</p>
                <p className="text-2xl font-bold">${estimatedCost.toFixed(2)}</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} type="tel" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery ZIP Code</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        maxLength={5} 
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value.length === 5) {
                            lookupCityState(e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    {cityState && (
                      <p className="text-sm text-muted-foreground mt-1">{cityState}</p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm text-muted-foreground">
                        I agree to receive communications about my inquiry
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <Button type="submit" className="w-full">
                Submit RFQ for at least $50 OFF est. cost!
              </Button>
              
              {showDiscountedPrice && (
                <div className="text-center space-y-4">
                  <div className="text-2xl font-bold text-green-600">
                    Discounted Price: ${discountedCost.toFixed(2)}
                    <div className="text-sm font-normal text-green-700">
                      You save: $50.00
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => {
                      const product = products.find(p => p.id.toString() === selectedProduct);
                      if (product) {
                        addToCart({
                          ...product,
                          price: discountedCost, // Use discounted price
                        });
                        toast({
                          title: "Added to Cart",
                          description: "Your discounted material has been added to the cart.",
                        });
                      }
                    }}
                    className="w-full"
                  >
                    Add to Cart
                  </Button>
                </div>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MaterialCalculator;
