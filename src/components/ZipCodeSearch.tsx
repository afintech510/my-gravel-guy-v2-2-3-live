
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useZipCode } from '../contexts/ZipCodeContext';
import { getPriceAdjustmentForZipCode } from '../services/productService';

const ZipCodeSearch = () => {
  const [zipCodeInput, setZipCodeInput] = useState('');
  const { zipCode, setZipCode } = useZipCode();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (zipCodeInput.length !== 5) {
      toast({
        title: "Invalid ZIP Code",
        description: "Please enter a valid 5-digit ZIP code",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Get price adjustment for this ZIP code
      const priceAdjustment = await getPriceAdjustmentForZipCode(zipCodeInput);
      
      // Save ZIP code to context (which also saves to localStorage)
      setZipCode(zipCodeInput);
      
      // Show success message with pricing info
      const pricingMessage = priceAdjustment !== 0 
        ? `Prices adjusted by ${priceAdjustment > 0 ? '+' : ''}${priceAdjustment}% for your location.` 
        : 'Standard pricing available in your area.';
      
      toast({
        title: "Service Available!",
        description: `We deliver to your area. ${pricingMessage} Browse our products below.`,
      });
    } catch (error) {
      console.error("Error checking ZIP code:", error);
      toast({
        title: "Error",
        description: "An error occurred while checking your ZIP code. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-md mx-auto flex gap-2">
      <Input
        type="text"
        placeholder="Enter ZIP Code"
        value={zipCodeInput}
        onChange={(e) => setZipCodeInput(e.target.value)}
        className="flex-grow"
        maxLength={5}
      />
      <Button type="submit">
        {zipCode ? 'Update Location' : 'Check Availability'}
      </Button>
    </form>
  );
};

export default ZipCodeSearch;
