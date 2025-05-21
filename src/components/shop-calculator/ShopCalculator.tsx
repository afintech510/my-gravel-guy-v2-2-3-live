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
import { sendCalculatorEmail, EmailData } from '../../utils/emailService';
import MaterialCategorySelector from './MaterialCategorySelector';
import ShopAreaInputs from './ShopAreaInputs';
import ShopCalculationDisplay from './ShopCalculationDisplay';
import DepthSlider from './DepthSlider';
import ExtraSlider from './ExtraSlider';
import ZipCodeSection from './ZipCodeSection';
import ContactForm from './ContactForm';

// Define material categories
export type MaterialCategory = 'gravel' | 'sand' | 'dirt' | 'mulch' | 'base';
export type ApplicationType = 'driveway' | 'walkway' | 'landscape' | 'natural' | 'construction';
export type MaterialSize = '3/8"' | '3/4"' | '1"' | '1½"' | '2-3"';

// Define material subcategories
export type MaterialSubcategory = 
  // Sand subcategories
  'washed-sand' | 'mason-sand' | 'playground-sand' | 'pool-sand' | 'beach-sand' |
  // Dirt subcategories
  'fill-dirt' | 'top-soil' | 'compost' | 'loam' | 'sandy-loam' |
  // Mulch subcategories
  'natural' | 'black' | 'chocolate-brown' | 'red' | 'request' |
  // Base subcategories
  '57-crushed-stone' | 'crusher-run' | 'road-base' | 'rca-crushed-concrete' | 'drainage-rock' |
  // Gravel subcategories
  'driveway' | 'walkway' | 'landscape' | 'natural' | 'construction' |
  'pea-gravel' | 'river-rock' | 'crushed-stone' | 'decorative-gravel' | 'drainage-gravel';

// Form schema for contact info
const contactSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().min(10, 'Valid phone number required'),
  consent: z.boolean().default(false),
});

const ShopCalculator = () => {
  // Material selection state variables
  
  const [selectedCategory, setSelectedCategory] = useState<MaterialCategory>('gravel');
  const [selectedSubcategory, setSelectedSubcategory] = useState<MaterialSubcategory>('driveway');
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
  const [discountApplied, setDiscountApplied] = useState<boolean>(false);
  const [lastCalculatedTons, setLastCalculatedTons] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { toast } = useToast();
  const { addToCart } = useCart();
  const { zipCode } = useZipCode();
  
  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      consent: false,
    },
  });

  // useEffect hooks and helper functions
  
  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
        if (fetchedProducts.length > 0) {
          setSelectedProduct(fetchedProducts[0].id.toString());
          // Set initial product images - Use single image and convert to array if needed
          if (fetchedProducts[0].image) {
            setProductImages([fetchedProducts[0].image]);
          }
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      }
    };
    loadProducts();
  }, []);

  // Update product selection when category or subcategory changes
  useEffect(() => {
    // In a real app, you would filter products by category and subcategory
    const filteredProducts = products.filter(p => 
      (p.category?.toLowerCase() === selectedCategory) || 
      (p.subtype === selectedSubcategory) ||
      (p.name.toLowerCase().includes(selectedCategory))
    );
    
    if (filteredProducts.length > 0) {
      setSelectedProduct(filteredProducts[0].id.toString());
      // Update product images - Use single image and convert to array if needed
      if (filteredProducts[0].image) {
        setProductImages([filteredProducts[0].image]);
      } else {
        // Fallback images based on category
        setProductImages([
          `https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?category=${selectedCategory}`
        ]);
      }
    }
  }, [selectedCategory, selectedSubcategory, products]);

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
        // Only show toast for critical errors like delivery unavailability
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

  // Store the calculated tons when not manually set
  useEffect(() => {
    if (manualTons === undefined) {
      // Round to nearest integer when storing calculated tons
      setLastCalculatedTons(Math.round(calculations.totalTons));
    }
  }, [calculations.totalTons, manualTons]);

  // Use lastCalculatedTons when manual tons is not set
  const displayTons = manualTons !== undefined ? manualTons : lastCalculatedTons;

  const handleTonsChange = (newTons: number) => {
    // Ensure we're always using integer values
    setManualTons(Math.round(newTons));
  };

  const handleFormSubmit = async (formData: {
    name: string;
    email: string;
    phone: string;
    consent: boolean;
  }) => {
    if (!zipCode) {
      toast({
        title: "ZIP Code Required",
        description: "Please enter a valid delivery ZIP code",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const finalTons = Math.round(manualTons !== undefined ? manualTons : calculations.totalTons);
      const currentPrice = discountApplied ? calculations.discountedCost : calculations.estimatedCost;
      
      // Prepare email data
      const emailData: EmailData = {
        materialCategory: selectedCategory,
        materialSubcategory: selectedSubcategory,
        materialSize: selectedSize,
        applicationType: selectedApplication,
        areas: areas,
        depth: depth,
        extraPercentage: extraPercentage,
        totalArea: calculations.totalSquareFeet,
        cubicYards: calculations.totalCubicYards,
        tons: finalTons,
        zipCode: zipCode,
        price: calculations.estimatedCost,
        discountedPrice: calculations.discountedCost,
        discountApplied: discountApplied,
        contactInfo: {
          name: formData.name,
          email: formData.email, 
          phone: formData.phone,
          consent: formData.consent
        }
      };
      
      // Send the email
      const emailSent = await sendCalculatorEmail(emailData);
      
      if (emailSent) {
        toast({
          title: "Quote Sent!",
          description: "Your request has been sent to our team. We'll be in touch soon!",
          className: "border-green-500 border-2 shadow-[0_0_15px_rgba(20,255,106,0.5)]"
        });
        
        // Apply the discount after successful submission
        setDiscountApplied(true);
      } else {
        toast({
          title: "Quote Request Failed",
          description: "There was a problem sending your request. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error sending email:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCart = () => {
    if (!zipCode) {
      toast({
        title: "ZIP Code Required",
        description: "Please enter a valid delivery ZIP code",
        variant: "destructive",
        className: "border-green-500 border-2 shadow-[0_0_15px_rgba(20,255,106,0.5)]"
      });
      return;
    }

    const product = products.find(p => p.id.toString() === selectedProduct);
    if (product) {
      const formData = form.getValues();
      // Round to nearest integer
      const finalTons = Math.round(manualTons !== undefined ? manualTons : calculations.totalTons);
      
      // Apply price adjustment to the product price
      const adjustedProduct = {
        ...product,
        price: selectedProductPrice // Use the ZIP code adjusted price
      };
      
      // Enhanced product metadata to include all selected options
      const enhancedProduct = {
        ...adjustedProduct,
        tons: finalTons,
        yards: calculations.totalCubicYards,
        materialCategory: selectedCategory,
        materialSubcategory: selectedSubcategory,
        materialSize: selectedSize,
        applicationType: selectedApplication,
        depth: depth,
        // Contact info
        contactInfo: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          zipCode: zipCode || ''
        },
        // Fix: Provide all required fields for deliveryAddress
        deliveryAddress: {
          street: '', // Empty placeholder that will be filled later
          city: '',   // Empty placeholder that will be filled later
          state: '',  // Empty placeholder that will be filled later
          zip: zipCode || ''
        },
        // Apply the discount only if the user clicked the discount button
        couponApplied: discountApplied,
        couponAmount: discountApplied ? 50 : 0
      };
      
      addToCart(enhancedProduct);
      
      const message = discountApplied 
        ? `${finalTons} tons of ${selectedCategory} (${selectedSubcategory}, ${selectedSize}) added to your cart with a $50 discount applied.`
        : `${finalTons} tons of ${selectedCategory} (${selectedSubcategory}, ${selectedSize}) added to your cart.`;
        
      toast({
        title: "Added to Cart",
        description: message,
        className: "border-green-500 border-2 shadow-[0_0_15px_rgba(20,255,106,0.5)]"
      });
    }
  };

  const handleApplyDiscount = () => {
    setDiscountApplied(true);
    toast({
      title: "Discount Applied!",
      description: "Your $50 discount has been applied to your order.",
      className: "border-green-500 border-2 shadow-[0_0_15px_rgba(20,255,106,0.5)]"
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Material Category and Subcategory Selectors with Tabs */}
      <MaterialCategorySelector 
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedSubcategory={selectedSubcategory}
        setSelectedSubcategory={setSelectedSubcategory}
        selectedSize={selectedSize}
        setSelectedSize={setSelectedSize}
        productImages={productImages}
      />

      {/* Area Inputs */}
      <div className="mt-6"> 
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
          totalTons={displayTons}
          handleTonsChange={handleTonsChange}
          estimatedCost={calculations.estimatedCost}
          discountedCost={calculations.discountedCost}
          onAddToCart={handleAddToCart}
          zipCodeValid={zipCodeValid}
          discountApplied={discountApplied}
        />
      </div>

      {/* Contact Information */}
      <div className="mt-6">
        <ContactForm 
          form={form} 
          onApplyDiscount={handleApplyDiscount}
          onSubmit={handleFormSubmit}
          loading={isSubmitting}
        />
      </div>
    </div>
  );
};

export default ShopCalculator;
