import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Calculator, ExternalLink, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getProducts } from '@/services/products';
import { Product } from '@/services/products/types';
import { useZipCode } from '@/contexts/ZipCodeContext';
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
  const totalTons = basetons * (1 + orderExtra[0] / 100);

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

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
             Calculator
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Calculate exactly how much material you need for your project
          </p>
        </div>

        <Card className="bg-white shadow-sm border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" />
              Material Calculator - Calculate exactly how much material you need for your project
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Areas Input */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Project Areas</Label>
              {areas.map((area, index) => (
                <div key={area.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-600">Length (ft)</Label>
                      <Input
                        type="number"
                        value={area.length || ''}
                        onChange={(e) => updateArea(area.id, 'length', parseFloat(e.target.value) || 0)}
                        className="mt-1"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Width (ft)</Label>
                      <Input
                        type="number"
                        value={area.width || ''}
                        onChange={(e) => updateArea(area.id, 'width', parseFloat(e.target.value) || 0)}
                        className="mt-1"
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
                        className="text-red-600 hover:text-red-700"
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
                <Label className="text-base font-semibold">Depth (inches)</Label>
                <span className="text-sm text-gray-600">{depth}"</span>
              </div>
              <Slider
                value={[depth]}
                onValueChange={(value) => setDepth(value[0])}
                max={24}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>1"</span>
                <span>24"</span>
              </div>
            </div>

            {/* Order Extra Slider */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">Order Extra</Label>
                <span className="text-sm text-gray-600">{orderExtra[0]}%</span>
              </div>
              <Slider
                value={orderExtra}
                onValueChange={setOrderExtra}
                max={30}
                min={0}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>30%</span>
              </div>
            </div>

            {/* Product Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Material Type</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
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
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Calculation Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-900">
                      {totalAreaSqFt.toFixed(0)}
                    </div>
                    <div className="text-sm text-blue-700">Square Feet</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-900">
                      {totalVolumeYards.toFixed(1)}
                    </div>
                    <div className="text-sm text-green-700">Cubic Yards</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-orange-50 border-orange-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-900">
                      {totalTons.toFixed(1)}
                    </div>
                    <div className="text-sm text-orange-700">Tons Needed</div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-900">
                      {totalTons < 3 ? "3 ton min. order" : `$${totalDeliveredPrice.toFixed(0)}`}
                    </div>
                    <div className="text-sm text-purple-700">Total Delivered Price</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Product Card */}
            {selectedProductData && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Selected Product</h3>
                <Card className="overflow-hidden border-0 shadow-lg">
                  <div 
                    className="relative min-h-[300px] bg-cover bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url(${selectedProductData.image || '/placeholder.svg'})`
                    }}
                  >
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>
                    
                    {/* Content */}
                    <div className="relative z-10 p-8 flex flex-col justify-end h-full min-h-[300px]">
                      <div className="text-white">
                        {/* Product Name and Unit Price on Same Line */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                          <h4 className="text-2xl font-bold mb-2 sm:mb-0">{selectedProductData.name}</h4>
                          <div className="text-xl font-semibold">
                            ${totalDeliveredPrice && totalVolumeYards > 0 ? (totalDeliveredPrice / totalVolumeYards).toFixed(2) : '0.00'}/yard
                          </div>
                        </div>
                        
                        {/* Description */}
                        <p className="text-white/80 mb-6 text-lg">
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
                          <Button className="flex-1 bg-primary hover:bg-primary/90">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Add to Cart - ${totalDeliveredPrice.toFixed(0)}
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