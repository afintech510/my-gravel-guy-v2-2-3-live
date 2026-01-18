import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Plus, Trash2, Calculator, ExternalLink, ShoppingCart, Info } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getProducts } from '@/services/products';
import { Product } from '@/services/products/types';
import { useZipCode } from '@/contexts/ZipCodeContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/components/ui/use-toast';
import { calculateProductExponentialPrice } from '@/services/products/exponentialPricing';
import { calculateFinalPrice } from '@/services/products/pricingUtils';

interface AreaInput {
  id: string;
  length: number;
  width: number;
}

const HomeCalculator = () => {
  const [areas, setAreas] = useState<AreaInput[]>([
    { id: '1', length: 0, width: 0 }
  ]);
  const [depth, setDepth] = useState<number>(2);
  const [orderExtra, setOrderExtra] = useState<number[]>([5]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDeliveredPrice, setTotalDeliveredPrice] = useState<number>(0);
  
  const { zipCode } = useZipCode();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch products on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsData = await getProducts();
        setProducts(productsData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Calculations
  const totalAreaSqFt = areas.reduce((sum, area) => sum + (area.length * area.width), 0);
  const totalVolumeCubicFt = totalAreaSqFt * (depth / 12); // Convert inches to feet
  const totalVolumeYards = totalVolumeCubicFt / 27; // Convert cubic feet to cubic yards
  
  const selectedProductData = products.find(p => p.id.toString() === selectedProduct);
  const tonYardRatio = selectedProductData?.tonYardRatio || 1.5;
  const basetons = totalVolumeYards * tonYardRatio;
  const calculatedTons = basetons * (1 + orderExtra[0] / 100);
  // Round to nearest whole ton with minimum of 3 tons
  const totalTons = Math.max(3, Math.round(calculatedTons));

  // Calculate delivered price using exponential pricing
  useEffect(() => {
    const calculateDeliveredPrice = async () => {
      if (selectedProductData && totalTons > 0) {
        try {
          const pricingResult = await calculateFinalPrice(selectedProductData, totalTons, zipCode);
          setTotalDeliveredPrice(pricingResult.finalPrice);
        } catch (error) {
          console.error('Error calculating delivered price:', error);
          setTotalDeliveredPrice(0);
        }
      } else {
        setTotalDeliveredPrice(0);
      }
    };

    calculateDeliveredPrice();
  }, [selectedProductData, totalTons, zipCode]);

  const addArea = () => {
    const newId = (areas.length + 1).toString();
    setAreas([...areas, { id: newId, length: 0, width: 0 }]);
  };

  const removeArea = (id: string) => {
    if (areas.length > 1) {
      setAreas(areas.filter(area => area.id !== id));
    }
  };

  const updateArea = (id: string, field: 'length' | 'width', value: number) => {
    setAreas(areas.map(area => 
      area.id === id ? { ...area, [field]: value } : area
    ));
  };

  // Handle adding product to cart
  const handleAddToCart = async () => {
    if (!selectedProductData) {
      toast({
        title: "No product selected",
        description: "Please select a material type first.",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log(`HomeCalculator: Adding ${totalTons} tons of ${selectedProductData.name} to cart`);
      
      // Recalculate price for the selected tons to get the per-ton price
      const pricing = await calculateFinalPrice(selectedProductData, totalTons, zipCode || undefined);
      
      addToCart({ 
        ...selectedProductData, 
        price: pricing.pricePerTon, // Use the per-ton price
        tons: totalTons,
        yards: totalTons / tonYardRatio
      });
      
      // Navigate to cart page
      navigate('/cart');
      
    } catch (error) {
      console.error("HomeCalculator: Error adding to cart:", error);
      toast({
        title: "Error adding to cart",
        description: "There was a problem adding this item to your cart. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <section className="py-16 px-4 bg-card border-y border-border">
      <div className="max-w-4xl mx-auto">
       
        <Card className="bg-background shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Calculator className="h-5 w-5 text-primary" />
              Material Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Areas Input */}
            <div className="space-y-4">
              <Label className="text-base font-semibold text-foreground">Project Areas</Label>
              {areas.map((area, index) => (
                <div key={area.id} className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Length (ft)</Label>
                      <Input
                        type="number"
                        value={area.length || ''}
                        onChange={(e) => updateArea(area.id, 'length', parseFloat(e.target.value) || 0)}
                        className="mt-1 bg-background border-border"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Width (ft)</Label>
                      <Input
                        type="number"
                        value={area.width || ''}
                        onChange={(e) => updateArea(area.id, 'width', parseFloat(e.target.value) || 0)}
                        className="mt-1 bg-background border-border"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {areas.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeArea(area.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={addArea}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Area
              </Button>
            </div>

            {/* Depth Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold text-foreground">Depth (inches)</Label>
                <span className="text-sm text-muted-foreground">{depth}"</span>
              </div>
              <Slider
                value={[depth]}
                onValueChange={(value) => setDepth(value[0])}
                max={24}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1"</span>
                <span>24"</span>
              </div>
            </div>

            {/* Order Extra Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold text-foreground">Order Extra</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-sm max-w-xs">
                          Order 5% extra when over 10 tons, order 10% when less than 10 tons. Consider additional for compaction.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <span className="text-sm text-muted-foreground">{orderExtra[0]}%</span>
              </div>
              <Slider
                value={orderExtra}
                onValueChange={setOrderExtra}
                max={30}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>30%</span>
              </div>
            </div>

            {/* Product Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-foreground">Material Type</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select material type" />
                </SelectTrigger>
                <SelectContent>
                  {products.map(product => (
                    <SelectItem key={product.id} value={product.id.toString()}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results */}
            <div className="border-t border-border pt-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Calculation Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-blue-500/10 border-blue-500/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {totalAreaSqFt.toFixed(0)}
                    </div>
                    <div className="text-sm text-blue-600/80 dark:text-blue-400/80">Square Feet</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-500/10 border-green-500/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {totalVolumeYards.toFixed(1)}
                    </div>
                    <div className="text-sm text-green-600/80 dark:text-green-400/80">Cubic Yards</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-orange-500/10 border-orange-500/20">
                  <CardContent className="p-4 text-center">
                     <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                       {calculatedTons.toFixed(1)}
                     </div>
                    <div className="text-sm text-orange-600/80 dark:text-orange-400/80">Tons Needed</div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-500/10 border-purple-500/20">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {totalTons < 3 ? "3 ton min. order" : `$${totalDeliveredPrice.toFixed(0)}`}
                    </div>
                    <div className="text-sm text-purple-600/80 dark:text-purple-400/80">Total Delivered Price</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Product Card */}
            {selectedProductData && (
              <div className="border-t border-border pt-6">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Selected Product</h3>
                <Card className="overflow-hidden border-0 shadow-lg">
                  <div 
                    className="relative min-h-[200px] bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url(${selectedProductData.image || '/placeholder.svg'})`
                    }}
                  >
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                    
                    {/* Content */}
                    <div className="relative z-10 p-6 flex flex-col justify-end h-full min-h-[200px]">
                      <div className="text-white">
                        {/* Product Name and Tons Display */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                          <h4 className="text-2xl font-bold mb-2 sm:mb-0">{selectedProductData.name}</h4>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{totalTons} tons</div>
                            <div className="text-lg">
                              ${totalDeliveredPrice && totalTons > 0 ? (totalDeliveredPrice / totalTons).toFixed(2) : '0.00'} per ton
                            </div>
                            <div className="mt-1">
                              <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                Free Delivery
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-white/80 mb-4 text-lg">
                          {selectedProductData.short_description || selectedProductData.description || "Perfect for driveways and high-traffic areas"}
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Link to={`/products/${selectedProductData.slug}`} className="flex-1">
                            <Button variant="outline" className="w-full bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Explore Product
                            </Button>
                          </Link>
                          <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={handleAddToCart}>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add {totalTons} tons - ${(totalDeliveredPrice / totalTons).toFixed(0)}/ton (${totalDeliveredPrice.toFixed(0)} total)
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default HomeCalculator;
