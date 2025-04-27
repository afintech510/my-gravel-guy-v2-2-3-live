
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useZipCode } from '../contexts/ZipCodeContext';
import { validateZipCode, ZipCodeData } from '../services/productService';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, MapPin } from 'lucide-react';
import ServiceAreaList from './ServiceAreaList';

const ZipCodeSearch = () => {
  const [zipCodeInput, setZipCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zipData, setZipData] = useState<ZipCodeData | null>(null);
  const { zipCode, setZipCode } = useZipCode();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!zipCodeInput || zipCodeInput.length !== 5 || !/^\d{5}$/.test(zipCodeInput)) {
      setError("Please enter a valid 5-digit ZIP code");
      return;
    }
    
    try {
      setLoading(true);
      
      const validation = await validateZipCode(zipCodeInput);
      
      if (!validation.valid) {
        setError("Invalid ZIP code. Please check and try again.");
        return;
      }
      
      if (!validation.inServiceArea) {
        setError("We don't currently deliver to this area.");
        // We could show nearest service areas here in the future
        return;
      }
      
      // Save ZIP code to context (which also saves to localStorage)
      setZipCode(zipCodeInput);
      
      // Store ZIP data for display
      if (validation.zipData) {
        setZipData(validation.zipData);
      }
      
      // Show success message with location info and pricing
      const locationInfo = validation.zipData 
        ? `${validation.zipData.city}, ${validation.zipData.state_name}`
        : '';
        
      const pricingMessage = validation.priceAdjustment !== 0 && validation.priceAdjustment !== undefined
        ? `Prices adjusted by ${validation.priceAdjustment > 0 ? '+' : ''}${validation.priceAdjustment}% for your location.` 
        : 'Standard pricing available in your area.';
      
      toast({
        title: "Service Available!",
        description: `We deliver to ${locationInfo || 'your area'}. ${pricingMessage} Browse our products below.`,
      });
      
    } catch (error) {
      console.error("Error checking ZIP code:", error);
      setError("An error occurred while checking your ZIP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSearch} className="w-full flex gap-2">
        <div className="relative flex-grow">
          <Input
            type="text"
            placeholder="Enter ZIP Code"
            value={zipCodeInput}
            onChange={(e) => setZipCodeInput(e.target.value)}
            className="pr-10"
            maxLength={5}
          />
          {zipData && (
            <div className="text-xs text-gray-500 mt-1 flex items-center">
              <MapPin className="h-3 w-3 mr-1" />
              {zipData.city}, {zipData.state_id}
            </div>
          )}
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking...
            </span>
          ) : (
            <>
              <Search className="h-4 w-4 mr-1" />
              {zipCode ? 'Update Location' : 'Check Availability'}
            </>
          )}
        </Button>
      </form>
      
      <div className="mt-2 text-center">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="text-xs p-0 h-auto">
              View Service Areas
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Our Service Areas</DialogTitle>
              <DialogDescription>
                We currently deliver to the following areas. Enter your ZIP code to see if we deliver to you.
              </DialogDescription>
            </DialogHeader>
            <ServiceAreaList />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default ZipCodeSearch;
