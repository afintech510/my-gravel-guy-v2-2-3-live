
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '../../contexts/CartContext';
import { getProducts, validateZipCode, applyZipCodeAdjustment } from '../../services/productService';
import { Product } from '../../services/productTypes';
import { useZipCode } from '../../contexts/ZipCodeContext';
import { useCalculator } from '../../hooks/useCalculator';
import MaterialCategorySelector from './MaterialCategorySelector';
import SizeSelector from './SizeSelector';
import ShopAreaInputs from './ShopAreaInputs';
import ShopCalculationDisplay from './ShopCalculationDisplay';
import DepthSlider from './DepthSlider';
import ExtraSlider from './ExtraSlider';
import ZipCodeSection from './ZipCodeSection';
import ContactForm from './ContactForm';
import ProductGallery from './ProductGallery';

// Define material categories
export type MaterialCategory = 'gravel' | 'sand' | 'dirt' | 'mulch' | 'base';
export type ApplicationType = 'driveway' | 'walkway' | 'landscape' | 'natural' | 'construction';
export type MaterialSize = '3/8"' | '3/4"' | '1"' | '1½"' | '2-3"';

// Form schema for contact info
const contactSchema = z.object({
  name: z.string().min(2, 'Name required'),
  phone: z.string().regex(/^\d{10}$/, 'Valid phone number required'),
});

const ShopCalculator = () => {
  // Material selection state
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory>('gravel');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationType>('driveway');
  const [selectedSize, setSelectedSize] = useState<MaterialSize>('3/4"');
  
  // Area and calculation state
  const [areas, setAreas] = useState([{ length: 10, width: 10 }]);
  const [depth, setDepth] = useState(4);
  const [extraPercentage, setExtraPercentage] = useState(10);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [manualTons, setManualTons] = useState<number | undefined>(undefined);
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0);
  const [zipCodeValid, setZipCodeValid] = useState<boolean>(false);
  const [productImages, setProductImages] = useState<string[]>([]);

  const { toast } = useToast();
  const { addToCart } = useCart();
  const { zipCode } = useZipCode();
  
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      phone: '',
    },
  });

  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
        if (fetchedProducts.length > 0) {
          setSelectedProduct(fetchedProducts[0].id.toString());
          // Set initial product images
          if (fetchedProducts[0].images) {
            setProductImages(fetchedProducts[0].images);
          }
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };
    loadProducts();
  }, []);

  // Update product selection when category or application changes
  useEffect(() => {
    // In a real app, you would filter products by category and application
    const filteredProducts = products.filter(p => 
      p.category?.toLowerCase() === selectedCategory || 
      p.name.toLowerCase().includes(selectedCategory)
    );
    
    if (filteredProducts.length > 0) {
      setSelectedProduct(filteredProducts[0].id.toString());
      // Update product images
      if (filteredProducts[0].images) {
        setProductImages(filteredProducts[0].images);
      }
    }
  }, [selectedCategory, selectedApplication, products]);

  // Reset manual tons when areas or depth change to recalculate based on dimensions
  useEffect(() => {
    setManualTons(undefined);
  }, [areas, depth, extraPercentage]);

  // Validate ZIP code and get price adjustment
  const validateZipCodeAndGetPrice = async (zipCode: string) => {
    try {
      const validation = await validateZipCode(zipCode);
      setZipCodeValid(validation.inServiceArea);
      
      if (validation.inServiceArea) {
        const adjustment = validation.priceAdjustment || 0;
        setPriceAdjustment(adjustment);
        return true;
      } else {
        toast({
          title: "Delivery Not Available",
          description: `We don't currently deliver to ${zipCode}. Please try another ZIP code.`,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Failed to validate ZIP code:', error);
      setZipCodeValid(false);
      return false;
    }
  };

  const selectedProductObj = products.find(p => p.id.toString() === selectedProduct);
  
  // Apply price adjustment based on ZIP code
  const selectedProductPrice = selectedProductObj ? 
    applyZipCodeAdjustment(selectedProductObj.price, priceAdjustment) : 0;
    
  const tonYardRatio = selectedProductObj?.tonYardRatio ? parseFloat(String(selectedProductObj.tonYardRatio)) : 1.5;
  
  const calculations = useCalculator(areas, depth, extraPercentage, selectedProductPrice, tonYardRatio, manualTons);

  const handleTonsChange = (newTons: number) => {
    // Ensure we're always using integer values
    setManualTons(Math.floor(newTons));
  };

  const handleAddToCart = () => {
    if (!zipCodeValid) {
      toast({
        title: "ZIP Code Required",
        description: "Please enter a valid delivery ZIP code",
        variant: "destructive"
      });
      return;
    }

    const product = products.find(p => p.id.toString() === selectedProduct);
    if (product) {
      const formData = form.getValues();
      
      // Apply price adjustment to the product price
      const adjustedProduct = {
        ...product,
        price: selectedProductPrice // Use the ZIP code adjusted price
      };
      
      addToCart({
        ...adjustedProduct,
        tons: calculations.totalTons,
        yards: calculations.totalCubicYards,
        contactInfo: {
          name: formData.name,
          email: '',
          phone: formData.phone,
          zipCode: zipCode || ''
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Material Category and Application Selectors */}
      <MaterialCategorySelector 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedApplication={selectedApplication}
        setSelectedApplication={setSelectedApplication}
      />

      {/* Size Selection */}
      <div className="mt-6">
        <h3 className="font-medium text-gray-700 mb-2">Size</h3>
        <SizeSelector
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
        />
      </div>

      {/* Area Inputs */}
      <div className="mt-6">
        <h3 className="font-medium text-gray-700 mb-2">Area to Cover</h3>
        <ShopAreaInputs areas={areas} setAreas={setAreas} />
      </div>

      {/* Calculation Display */}
      <div className="mt-6">
        <ShopCalculationDisplay
          totalArea={calculations.totalSquareFeet}
          cubicYards={calculations.totalCubicYards}
          tons={calculations.totalTons}
        />
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <DepthSlider depth={depth} setDepth={setDepth} />
        <ExtraSlider extraPercentage={extraPercentage} setExtraPercentage={setExtraPercentage} />
      </div>

      {/* Delivery ZIP Code and Total Section */}
      <div className="mt-6">
        <ZipCodeSection
          zipCode={zipCode}
          validateZipCodeAndGetPrice={validateZipCodeAndGetPrice}
          totalTons={calculations.totalTons}
          handleTonsChange={handleTonsChange}
          estimatedCost={calculations.estimatedCost}
          discountedCost={calculations.discountedCost}
          onAddToCart={handleAddToCart}
          zipCodeValid={zipCodeValid}
        />
      </div>

      {/* Contact Information */}
      <div className="mt-6">
        <ContactForm form={form} />
      </div>

      {/* Product Gallery */}
      <div className="mt-8">
        <h3 className="font-medium text-gray-700 mb-4">Product Images</h3>
        <ProductGallery images={productImages} productName={selectedProductObj?.name || ''} />
      </div>
    </div>
  );
};

export default ShopCalculator;
